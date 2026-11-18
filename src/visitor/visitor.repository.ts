import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';
import { ContentVersion } from '../content/content.repository';

@Injectable()
export class VisitorRepository {
  private readonly pool: Pool;
  constructor(@Inject(DATABASE_POOL) pool: Pool) { this.pool = pool; }

  async getPublishedPoi(poiId: number, languageCode?: string): Promise<ContentVersion | undefined> {
    const targetLang = languageCode?.trim() || null;
    const query = targetLang
      ? `SELECT v.version_id, v.content_id, nc.poi_id, nc.language_code, v.version_number,
                v.title, v.narration_text, v.status, nc.needs_review, v.selected_voice_id,
                a.file_path, a.file_format, a.is_valid AS audio_valid, a.is_outdated AS audio_outdated,
                v.created_at
         FROM content_version v
         JOIN narration_content nc ON nc.content_id = v.content_id
         LEFT JOIN audio a ON a.version_id = v.version_id
         WHERE nc.poi_id = $1 AND v.status = 'PUBLISHED'
           AND nc.language_code = $2
         ORDER BY v.created_at DESC
         LIMIT 1`
      : `SELECT v.version_id, v.content_id, nc.poi_id, nc.language_code, v.version_number,
                v.title, v.narration_text, v.status, nc.needs_review, v.selected_voice_id,
                a.file_path, a.file_format, a.is_valid AS audio_valid, a.is_outdated AS audio_outdated,
                v.created_at
         FROM content_version v
         JOIN narration_content nc ON nc.content_id = v.content_id
         LEFT JOIN audio a ON a.version_id = v.version_id
         WHERE nc.poi_id = $1 AND v.status = 'PUBLISHED'
           AND nc.language_code = (SELECT language_code FROM language WHERE is_fallback = TRUE)
         ORDER BY v.created_at DESC
         LIMIT 1`;
    const params = targetLang ? [poiId, targetLang] : [poiId];
    const result = await this.pool.query(query, params);
    const row = result.rows[0];
    if (!row) return undefined;
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
      audio: row.file_path ? { filePath: row.file_path, fileFormat: row.file_format, isValid: row.audio_valid, isOutdated: row.audio_outdated } : undefined,
      createdAt: row.created_at.toISOString(),
    };
  }

  async getPoiLanguages(poiId: number): Promise<{ code: string; name: string; isFallback: boolean; hasVoice: boolean }[]> {
    const result = await this.pool.query(
      `SELECT 
         l.language_code AS code,
         l.language_name AS name,
         l.is_fallback AS "isFallback",
         EXISTS(
           SELECT 1 
           FROM narration_content nc
           JOIN content_version v ON v.content_id = nc.content_id
           JOIN audio a ON a.version_id = v.version_id
           WHERE nc.poi_id = $1 
             AND nc.language_code = l.language_code
             AND v.status = 'PUBLISHED'
             AND a.file_path IS NOT NULL
             AND a.is_valid = TRUE
         ) AS "hasVoice"
       FROM language l
       WHERE l.is_active = TRUE
       ORDER BY l.is_fallback DESC, l.language_code ASC`,
      [poiId],
    );
    return result.rows.map((row) => ({
      code: row.code,
      name: row.name,
      isFallback: Boolean(row.isFallback),
      hasVoice: Boolean(row.hasVoice),
    }));
  }

  async resolveQr(qrId: number) {
    const result = await this.pool.query(
      `SELECT q.qr_id, q.poi_id, q.target_url, p.location_id, p.is_active AS poi_active, l.is_active AS location_active
       FROM qr_code q JOIN poi p ON p.poi_id = q.poi_id JOIN location l ON l.location_id = p.location_id
       WHERE q.qr_id = $1`,
      [qrId],
    );
    return result.rows[0];
  }

  async recordEvent(event: { eventId: string; eventType: string; poiId?: number; locationId?: number; languageCode?: string; durationMs?: number; anonymousSessionKey?: string }): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const inserted = await client.query(
        'INSERT INTO analytics_ingestion (event_id) VALUES ($1) ON CONFLICT DO NOTHING RETURNING event_id',
        [event.eventId],
      );
      if (inserted.rowCount === 1) {
        await client.query(
          `INSERT INTO activity_event (event_type, poi_id, location_id, language_code, duration_ms, anonymous_session_key)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [event.eventType, event.poiId ?? null, event.locationId ?? null, event.languageCode ?? null, event.durationMs ?? null, event.anonymousSessionKey ?? null],
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async recordPresence(presence: { anonymousSessionKey: string }): Promise<void> {
    await this.pool.query(
      `INSERT INTO visitor_presence (anonymous_session_key, last_seen_at)
       VALUES ($1, now())
       ON CONFLICT (anonymous_session_key) DO UPDATE
         SET last_seen_at = now()`,
      [presence.anonymousSessionKey],
    );
    await this.pool.query(`DELETE FROM visitor_presence WHERE last_seen_at < now() - interval '5 minutes'`);
  }

  async analyticsSummary() {
      const result = await this.pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE event_type = 'PAGE_VIEW')::int AS page_views,
           COUNT(*) FILTER (WHERE event_type = 'QR_OPEN')::int AS qr_opens,
           COUNT(*) FILTER (WHERE event_type = 'AUDIO_START')::int AS audio_starts,
           COALESCE(SUM(duration_ms) FILTER (WHERE event_type = 'AUDIO_PLAY_DURATION'), 0)::bigint AS listening_ms,
           COUNT(DISTINCT poi_id)::int AS active_pois,
           (SELECT COUNT(*)::int FROM visitor_presence
            WHERE last_seen_at >= now() - interval '2 minutes') AS active_visitors
         FROM activity_event
         WHERE occurred_at >= now() - interval '30 days'`,
      );
      const row = result.rows[0];
      return { pageViews: Number(row.page_views), qrOpens: Number(row.qr_opens), audioStarts: Number(row.audio_starts), listeningMs: Number(row.listening_ms), activePois: Number(row.active_pois), activeVisitors: Number(row.active_visitors), windowDays: 30 };
  }
}
