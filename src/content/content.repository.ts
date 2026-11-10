import { Inject, Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DATABASE_POOL } from '../database/database.module';

export type ContentVersion = {
  versionId: number;
  contentId: number;
  poiId: number;
  languageCode: string;
  versionNumber: number;
  title: string;
  narrationText: string;
  status: string;
  needsReview: boolean;
  selectedVoiceId?: number;
  audio?: { filePath: string; fileFormat: string; isValid: boolean; isOutdated: boolean };
  createdAt: string;
};
export type ContentVoice = { id: number; providerVoiceKey: string; languageCode: string };
export type ReviewEvent = { eventType: string; reason?: string; actedAt: string; actorUserId: number };

type VersionRow = {
  version_id: string;
  content_id: string;
  poi_id: string;
  language_code: string;
  version_number: number;
  title: string;
  narration_text: string;
  status: string;
  needs_review: boolean;
  selected_voice_id: string | null;
  file_path: string | null;
  file_format: string | null;
  audio_valid: boolean | null;
  audio_outdated: boolean | null;
  created_at: Date;
};

@Injectable()
export class ContentRepository {
  private readonly pool: Pool;

  constructor(@Inject(DATABASE_POOL) pool: Pool) {
    this.pool = pool;
  }

  async list(status?: string): Promise<ContentVersion[]> {
    const condition = status ? 'v.status = $1' : 'TRUE';
    const result = await this.pool.query<VersionRow>(this.versionQuery(condition), status ? [status] : []);
    return result.rows.map((row) => this.map(row));
  }

  async find(versionId: number): Promise<ContentVersion | undefined> {
    const result = await this.pool.query<VersionRow>(this.versionQuery('v.version_id = $1', versionId), [versionId]);
    return result.rows[0] ? this.map(result.rows[0]) : undefined;
  }

  async history(versionId: number): Promise<ReviewEvent[]> {
    const result = await this.pool.query(
      `SELECT event_type, reason, acted_at, actor_user_id
       FROM review_history WHERE version_id = $1 ORDER BY acted_at DESC`,
      [versionId],
    );
    return result.rows.map((row) => ({ eventType: row.event_type, reason: row.reason ?? undefined, actedAt: row.acted_at.toISOString(), actorUserId: Number(row.actor_user_id) }));
  }

  async findVoice(voiceId: number, languageCode: string): Promise<ContentVoice | undefined> {
    const result = await this.pool.query<{ voice_id: string; provider_voice_key: string; language_code: string }>(
      `SELECT voice_id, provider_voice_key, language_code
       FROM voice WHERE voice_id = $1 AND language_code = $2 AND is_available = TRUE`,
      [voiceId, languageCode],
    );
    const row = result.rows[0];
    return row ? { id: Number(row.voice_id), providerVoiceKey: row.provider_voice_key, languageCode: row.language_code } : undefined;
  }

  async create(poiId: number, languageCode: string, title: string, narrationText: string): Promise<ContentVersion> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const content = await client.query<{ content_id: string }>(
        `INSERT INTO narration_content (poi_id, language_code)
         VALUES ($1, $2)
         ON CONFLICT (poi_id, language_code) DO UPDATE SET needs_review = narration_content.needs_review
         RETURNING content_id`,
        [poiId, languageCode],
      );
      const contentId = content.rows[0].content_id;
      await client.query('SELECT content_id FROM narration_content WHERE content_id = $1 FOR UPDATE', [contentId]);
      const number = await client.query<{ next_number: number }>(
        `SELECT COALESCE(MAX(version_number), 0) + 1 AS next_number
         FROM content_version WHERE content_id = $1`,
        [contentId],
      );
      const version = await client.query<{ version_id: string }>(
        `INSERT INTO content_version (content_id, version_number, title, narration_text, status)
         VALUES ($1, $2, $3, $4, 'DRAFT') RETURNING version_id`,
        [contentId, number.rows[0].next_number, title, narrationText],
      );
      await client.query('COMMIT');
      return (await this.find(Number(version.rows[0].version_id))) as ContentVersion;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async createTranslation(sourceVersionId: number, targetLanguageCode: string, title: string, narrationText: string): Promise<ContentVersion> {
      const source = await this.pool.query<{ poi_id: string; language_code: string }>(
        `SELECT nc.poi_id, nc.language_code FROM content_version v
         JOIN narration_content nc ON nc.content_id = v.content_id
         WHERE v.version_id = $1`,
        [sourceVersionId],
      );
      if (!source.rows[0]) throw new Error('Source content version was not found');
      if (source.rows[0].language_code === targetLanguageCode) throw new Error('Target language must differ from source language');
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        const content = await client.query<{ content_id: string }>(
          `INSERT INTO narration_content (poi_id, language_code, needs_review)
           VALUES ($1, $2, TRUE)
           ON CONFLICT (poi_id, language_code) DO UPDATE SET needs_review = TRUE
           RETURNING content_id`,
          [source.rows[0].poi_id, targetLanguageCode],
        );
        const next = await client.query<{ next_number: number }>(
          `SELECT COALESCE(MAX(version_number), 0) + 1 AS next_number
           FROM content_version WHERE content_id = $1`,
          [content.rows[0].content_id],
        );
        const version = await client.query<{ version_id: string }>(
          `INSERT INTO content_version (content_id, version_number, title, narration_text, status, translation_source_version_id)
           VALUES ($1, $2, $3, $4, 'DRAFT', $5)
           RETURNING version_id`,
          [content.rows[0].content_id, next.rows[0].next_number, title, narrationText, sourceVersionId],
        );
        await client.query('COMMIT');
        return (await this.find(Number(version.rows[0].version_id))) as ContentVersion;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
    }
  }

  async update(versionId: number, title: string, narrationText: string): Promise<ContentVersion | undefined> {
    const previous = await this.pool.query<{ narration_text: string }>(
      `SELECT narration_text FROM content_version WHERE version_id = $1 AND status IN ('DRAFT', 'REJECTED')`,
      [versionId],
    );
    if (!previous.rows[0]) return undefined;
    const result = await this.pool.query<{ version_id: string }>(
      `UPDATE content_version
       SET title = $2, narration_text = $3
       WHERE version_id = $1 AND status IN ('DRAFT', 'REJECTED')
       RETURNING version_id`,
      [versionId, title, narrationText],
    );
    if (!result.rows[0]) return undefined;
    if (previous.rows[0].narration_text !== narrationText) {
      await this.pool.query('UPDATE audio SET is_outdated = TRUE WHERE version_id = $1', [versionId]);
    }
    return this.find(versionId);
  }

  async saveTtsAudio(versionId: number, voiceId: number, filePath: string, fileSize: number): Promise<ContentVersion | undefined> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const version = await client.query<{ language_code: string }>(
        `SELECT nc.language_code FROM content_version v
         JOIN narration_content nc ON nc.content_id = v.content_id
         WHERE v.version_id = $1 FOR UPDATE`,
        [versionId],
      );
      if (!version.rows[0]) { await client.query('ROLLBACK'); return undefined; }
      const voice = await client.query(
        'SELECT voice_id FROM voice WHERE voice_id = $1 AND language_code = $2 AND is_available = TRUE',
        [voiceId, version.rows[0].language_code],
      );
      if (!voice.rows[0]) throw new Error('Voice is unavailable or does not match content language');
      await client.query(
        `INSERT INTO audio (version_id, source_type, voice_id, file_path, file_format, file_size, is_valid, is_outdated)
         VALUES ($1, 'TTS', $2, $3, 'mp3', $4, TRUE, FALSE)
         ON CONFLICT (version_id) DO UPDATE SET source_type = 'TTS', voice_id = EXCLUDED.voice_id,
           file_path = EXCLUDED.file_path, file_format = 'mp3', file_size = EXCLUDED.file_size,
           is_valid = TRUE, is_outdated = FALSE`,
        [versionId, voiceId, filePath, fileSize],
      );
      await client.query('UPDATE content_version SET selected_voice_id = $2 WHERE version_id = $1', [versionId, voiceId]);
      await client.query('COMMIT');
      return this.find(versionId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  }

    async uploadAudio(versionId: number, fileName: string, fileSize: number): Promise<ContentVersion | undefined> {
      const version = await this.pool.query<{ version_id: string }>('SELECT version_id FROM content_version WHERE version_id = $1', [versionId]);
      if (!version.rows[0]) return undefined;
      const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const format = safeName.includes('.') ? safeName.split('.').pop() ?? 'audio' : 'audio';
      await this.pool.query(
        `INSERT INTO audio (version_id, source_type, voice_id, file_path, file_format, file_size, is_valid, is_outdated)
         VALUES ($1, 'UPLOAD', NULL, $2, $3, $4, TRUE, FALSE)
         ON CONFLICT (version_id) DO UPDATE SET source_type = 'UPLOAD', voice_id = NULL,
           file_path = EXCLUDED.file_path, file_format = EXCLUDED.file_format, file_size = EXCLUDED.file_size,
           is_valid = TRUE, is_outdated = FALSE`,
        [versionId, `local://uploads/${versionId}-${safeName}`, format, fileSize],
      );
      return this.find(versionId);
    }

    async saveUploadedAudio(versionId: number, fileName: string, fileSize: number, buffer: Buffer, mediaRoot: string): Promise<ContentVersion | undefined> {
      const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const relativePath = path.join('uploads', `${versionId}-${Date.now()}-${safeName}`);
      await mkdir(path.join(mediaRoot, 'uploads'), { recursive: true });
      await writeFile(path.resolve(mediaRoot, relativePath), buffer);
      const version = await this.uploadAudio(versionId, safeName, fileSize);
      if (!version) return undefined;
      await this.pool.query('UPDATE audio SET file_path = $2 WHERE version_id = $1', [versionId, `/media/${relativePath.replace(/\\/g, '/')}`]);
      return this.find(versionId);
    }

  async transition(versionId: number, action: 'submit' | 'withdraw' | 'approve' | 'reject' | 'publish' | 'unpublish' | 'republish', actorUserId: number, reason?: string): Promise<ContentVersion | undefined> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const current = await client.query<{ content_id: string; status: string }>(
        'SELECT content_id, status FROM content_version WHERE version_id = $1 FOR UPDATE',
        [versionId],
      );
      if (!current.rows[0]) {
        await client.query('ROLLBACK');
        return undefined;
      }
      const from = current.rows[0].status;
      const target = this.targetStatus(from, action);
      if (!target) throw new Error(`Action '${action}' is not allowed from status '${from}'`);
      if (target === 'PUBLISHED') {
        const check = await client.query<{ count: string }>(
          `SELECT COUNT(*)::text AS count FROM audio a
           JOIN content_version v ON v.version_id = a.version_id
           WHERE v.version_id = $1 AND a.is_valid = TRUE AND a.is_outdated = FALSE`,
          [versionId],
        );
        if (Number(check.rows[0].count) !== 1) throw new Error('A valid, current audio file is required before publishing');
        await client.query(
          `UPDATE content_version SET status = 'UNPUBLISHED'
           WHERE content_id = $1 AND status = 'PUBLISHED' AND version_id <> $2`,
          [current.rows[0].content_id, versionId],
        );
      }
      await client.query('UPDATE content_version SET status = $2 WHERE version_id = $1', [versionId, target]);
      await client.query(
        `INSERT INTO review_history (version_id, actor_user_id, event_type, reason)
         VALUES ($1, $2, $3, $4)`,
        [versionId, actorUserId, action === 'submit' ? 'SUBMIT' : action === 'withdraw' ? 'WITHDRAW' : action === 'approve' ? 'APPROVE' : action === 'reject' ? 'REJECT' : action === 'publish' ? 'PUBLISH' : action === 'unpublish' ? 'UNPUBLISH' : 'REPUBLISH', reason ?? null],
      );
      await client.query('COMMIT');
      return this.find(versionId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getPublished(poiId: number, languageCode: string): Promise<ContentVersion | undefined> {
    const result = await this.pool.query<VersionRow>(
      `${this.versionQuery('v.poi_id = $1 AND v.language_code = $2 AND v.status = \'PUBLISHED\'', undefined)}
       UNION ALL
       ${this.versionQuery('v.poi_id = $1 AND v.language_code = (SELECT language_code FROM language WHERE is_fallback = TRUE) AND v.status = \'PUBLISHED\'', undefined)}
       LIMIT 1`,
      [poiId, languageCode],
    );
    return result.rows[0] ? this.map(result.rows[0]) : undefined;
  }

  private targetStatus(from: string, action: string): string | undefined {
    const transitions: Record<string, Record<string, string>> = {
      DRAFT: { submit: 'PENDING_REVIEW', publish: 'PUBLISHED' },
      REJECTED: { submit: 'PENDING_REVIEW', publish: 'PUBLISHED' },
      PENDING_REVIEW: { withdraw: 'DRAFT', approve: 'APPROVED', reject: 'REJECTED' },
      APPROVED: { publish: 'PUBLISHED' },
      PUBLISHED: { unpublish: 'UNPUBLISHED' },
      UNPUBLISHED: { republish: 'PUBLISHED' },
    };
    return transitions[from]?.[action];
  }

  private versionQuery(condition: string, _value?: unknown): string {
    return `SELECT v.version_id, v.content_id, nc.poi_id, nc.language_code,
      v.version_number, v.title, v.narration_text, v.status, nc.needs_review,
      v.selected_voice_id, a.file_path, a.file_format, a.is_valid AS audio_valid,
      a.is_outdated AS audio_outdated, v.created_at
      FROM content_version v
      JOIN narration_content nc ON nc.content_id = v.content_id
      LEFT JOIN audio a ON a.version_id = v.version_id
      WHERE ${condition}
      ORDER BY v.created_at DESC`;
  }

  private map(row: VersionRow): ContentVersion {
    return {
      versionId: Number(row.version_id),
      contentId: Number(row.content_id),
      poiId: Number(row.poi_id),
      languageCode: row.language_code,
      versionNumber: row.version_number,
      title: row.title,
      narrationText: row.narration_text,
      status: row.status,
      needsReview: row.needs_review,
      selectedVoiceId: row.selected_voice_id ? Number(row.selected_voice_id) : undefined,
      audio: row.file_path ? { filePath: row.file_path, fileFormat: row.file_format ?? '', isValid: row.audio_valid ?? false, isOutdated: row.audio_outdated ?? true } : undefined,
      createdAt: row.created_at.toISOString(),
    };
  }
}
