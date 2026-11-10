import { Inject, Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { DATABASE_POOL } from '../database/database.module';
import { Language, Location, Poi, QrCode, Translation, Voice } from './catalog.types';

type LanguageRow = {
  language_code: string;
  language_name: string;
  is_active: boolean;
  is_fallback: boolean;
  default_voice_id: string | null;
};

type TranslationRow = {
  entity_id: string;
  language_code: string;
  name: string;
  short_description: string | null;
};

type EntityRow = {
  id: string;
  is_active: boolean;
};

@Injectable()
export class CatalogRepository {
  private readonly pool: Pool;

  constructor(@Inject(DATABASE_POOL) pool: Pool) {
    this.pool = pool;
  }

  async listLanguages(): Promise<Language[]> {
    const result = await this.pool.query<LanguageRow>(
      `SELECT l.language_code, l.language_name, l.is_active, l.is_fallback,
              d.voice_id AS default_voice_id
       FROM language l
       LEFT JOIN language_default_voice d ON d.language_code = l.language_code
       ORDER BY l.language_name`,
    );
    return result.rows.map((row) => this.toLanguage(row));
  }

  async addLanguage(code: string, name: string, isActive: boolean): Promise<Language> {
    const result = await this.pool.query<LanguageRow>(
      `INSERT INTO language (language_code, language_name, is_active, is_fallback)
       VALUES ($1, $2, $3, FALSE)
       RETURNING language_code, language_name, is_active, is_fallback`,
      [code, name, isActive],
    );
    return this.toLanguage(result.rows[0]);
  }

  async listLocations(): Promise<Location[]> {
    const result = await this.pool.query<EntityRow>(
      `SELECT location_id AS id, is_active
       FROM location
       ORDER BY location_id`,
    );
    return this.withLocationTranslations(result.rows);
  }

  async getLocation(id: number): Promise<Location | undefined> {
    const result = await this.pool.query<EntityRow>(
      `SELECT location_id AS id, is_active
       FROM location
       WHERE location_id = $1`,
      [id],
    );
    const locations = await this.withLocationTranslations(result.rows);
    return locations[0];
  }

  async addLocation(translations: Translation[]): Promise<Location> {
    await this.assertTranslations(translations);
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const locationResult = await client.query<EntityRow>(
        `INSERT INTO location (is_active) VALUES (TRUE)
         RETURNING location_id AS id, is_active`,
      );
      const location = locationResult.rows[0];
      await this.insertTranslations(client, 'location_translation', 'location_id', location.id, translations);
      await client.query('COMMIT');
      return { id: Number(location.id), isActive: location.is_active, translations };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async listPois(locationId?: number): Promise<Poi[]> {
    const result = await this.pool.query<EntityRow & { location_id: string }>(
      `SELECT poi_id AS id, location_id, is_active
       FROM poi
       WHERE ($1::bigint IS NULL OR location_id = $1)
       ORDER BY poi_id`,
      [locationId ?? null],
    );
    return this.withPoiTranslations(result.rows);
  }

  async getPoi(id: number): Promise<Poi | undefined> {
    const result = await this.pool.query<EntityRow & { location_id: string }>(
      `SELECT poi_id AS id, location_id, is_active
       FROM poi
       WHERE poi_id = $1`,
      [id],
    );
    const pois = await this.withPoiTranslations(result.rows);
    return pois[0];
  }

  async addPoi(locationId: number, translations: Translation[], isActive: boolean): Promise<Poi> {
    await this.assertTranslations(translations);
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const poiResult = await client.query<EntityRow & { location_id: string }>(
        `INSERT INTO poi (location_id, is_active) VALUES ($1, $2)
         RETURNING poi_id AS id, location_id, is_active`,
        [locationId, isActive],
      );
      const poi = poiResult.rows[0];
      await this.insertTranslations(client, 'poi_translation', 'poi_id', poi.id, translations);
      await client.query('COMMIT');
      return {
        id: Number(poi.id),
        locationId: Number(poi.location_id),
        isActive: poi.is_active,
        translations,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async setLocationActive(id: number, isActive: boolean): Promise<Location | undefined> {
      await this.pool.query('UPDATE location SET is_active = $2 WHERE location_id = $1', [id, isActive]);
      return this.getLocation(id);
    }

  async setPoiActive(id: number, isActive: boolean): Promise<Poi | undefined> {
      await this.pool.query('UPDATE poi SET is_active = $2 WHERE poi_id = $1', [id, isActive]);
      return this.getPoi(id);
    }

  async listVoices(): Promise<Voice[]> {
      const result = await this.pool.query('SELECT voice_id AS id, language_code, provider_voice_key, is_available FROM voice ORDER BY language_code, voice_id');
      return result.rows.map((row) => ({ id: Number(row.id), languageCode: row.language_code, providerVoiceKey: row.provider_voice_key, isAvailable: row.is_available }));
    }

  async addVoice(languageCode: string, providerVoiceKey: string, isAvailable: boolean): Promise<Voice> {
      const result = await this.pool.query(
        `INSERT INTO voice (language_code, provider_voice_key, is_available)
         VALUES ($1, $2, $3)
         RETURNING voice_id AS id, language_code, provider_voice_key, is_available`,
        [languageCode, providerVoiceKey, isAvailable],
      );
      const row = result.rows[0];
      return { id: Number(row.id), languageCode: row.language_code, providerVoiceKey: row.provider_voice_key, isAvailable: row.is_available };
    }

  async setDefaultVoice(languageCode: string, voiceId: number): Promise<Language> {
    const result = await this.pool.query(
      `INSERT INTO language_default_voice (language_code, voice_id)
       SELECT $1::varchar, v.voice_id FROM voice v
       WHERE v.voice_id = $2 AND v.language_code = $1::varchar AND v.is_available = TRUE
       ON CONFLICT (language_code) DO UPDATE SET voice_id = EXCLUDED.voice_id
       RETURNING language_code`,
      [languageCode, voiceId],
    );
    if (!result.rows[0]) throw new Error('Voice is unavailable or does not match language');
    const language = (await this.listLanguages()).find((item) => item.code === languageCode);
    if (!language) throw new Error(`Language '${languageCode}' was not found`);
    return language;
  }

  async listQrCodes(): Promise<QrCode[]> {
      const result = await this.pool.query(
        `SELECT q.qr_id AS id, q.poi_id, q.target_url, q.image_path, q.created_at,
                COALESCE(pt.name, 'POI #' || q.poi_id) AS poi_name
         FROM qr_code q
         LEFT JOIN poi_translation pt ON pt.poi_id = q.poi_id AND pt.language_code = 'en'
         ORDER BY q.qr_id`,
      );
      return result.rows.map((row) => ({ id: Number(row.id), poiId: Number(row.poi_id), targetUrl: row.target_url, imagePath: row.image_path ?? undefined, createdAt: row.created_at.toISOString() }));
    }

  async upsertQr(poiId: number, targetUrl: string, imagePath?: string): Promise<QrCode> {
      const result = await this.pool.query(
        `INSERT INTO qr_code (poi_id, target_url, image_path) VALUES ($1, $2, $3)
         ON CONFLICT (poi_id) DO UPDATE SET target_url = EXCLUDED.target_url, image_path = EXCLUDED.image_path
         RETURNING qr_id AS id, poi_id, target_url, image_path, created_at`,
        [poiId, targetUrl, imagePath ?? null],
      );
      const row = result.rows[0];
      return { id: Number(row.id), poiId: Number(row.poi_id), targetUrl: row.target_url, imagePath: row.image_path ?? undefined, createdAt: row.created_at.toISOString() };
    }
  private async assertTranslations(translations: Translation[]): Promise<void> {
    if (translations.length === 0 || !translations.some((translation) => translation.languageCode === 'en')) {
      throw new Error('At least one translation in English is required');
    }
    const codes = translations.map((translation) => translation.languageCode);
    if (new Set(codes).size !== codes.length) {
      throw new Error('Duplicate translation languages are not allowed');
    }
    const result = await this.pool.query<{ language_code: string }>(
      `SELECT language_code
       FROM language
       WHERE is_active = TRUE AND language_code = ANY($1::varchar[])`,
      [codes],
    );
    if (result.rows.length !== codes.length) {
      throw new Error('Translation uses an unknown or inactive language');
    }
  }

  private async withLocationTranslations(rows: EntityRow[]): Promise<Location[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((row) => row.id);
    const result = await this.pool.query<TranslationRow>(
      `SELECT location_id::text AS entity_id, language_code, name, short_description
       FROM location_translation
       WHERE location_id = ANY($1::bigint[])
       ORDER BY location_id, language_code`,
      [ids],
    );
    const grouped = this.groupTranslations(result.rows);
    return rows.map((row) => ({
      id: Number(row.id),
      isActive: row.is_active,
      translations: grouped.get(row.id) ?? [],
    }));
  }

  private async withPoiTranslations(rows: (EntityRow & { location_id: string })[]): Promise<Poi[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((row) => row.id);
    const result = await this.pool.query<TranslationRow>(
      `SELECT poi_id::text AS entity_id, language_code, name, short_description
       FROM poi_translation
       WHERE poi_id = ANY($1::bigint[])
       ORDER BY poi_id, language_code`,
      [ids],
    );
    const grouped = this.groupTranslations(result.rows);
    return rows.map((row) => ({
      id: Number(row.id),
      locationId: Number(row.location_id),
      isActive: row.is_active,
      translations: grouped.get(row.id) ?? [],
    }));
  }

  private async insertTranslations(
    client: PoolClient,
    table: 'location_translation' | 'poi_translation',
    idColumn: 'location_id' | 'poi_id',
    id: string,
    translations: Translation[],
  ): Promise<void> {
    for (const translation of translations) {
      await client.query(
        `INSERT INTO ${table} (${idColumn}, language_code, name, short_description)
         VALUES ($1, $2, $3, $4)`,
        [id, translation.languageCode, translation.name, translation.shortDescription ?? null],
      );
    }
  }

  private groupTranslations(rows: TranslationRow[]): Map<string, Translation[]> {
    const grouped = new Map<string, Translation[]>();
    for (const row of rows) {
      const translations = grouped.get(row.entity_id) ?? [];
      translations.push({
        languageCode: row.language_code,
        name: row.name,
        shortDescription: row.short_description ?? undefined,
      });
      grouped.set(row.entity_id, translations);
    }
    return grouped;
  }

  private toLanguage(row: LanguageRow): Language {
    return {
      code: row.language_code,
      name: row.language_name,
      isActive: row.is_active,
      isFallback: row.is_fallback,
      defaultVoiceId: row.default_voice_id ? Number(row.default_voice_id) : undefined,
    };
  }
}
