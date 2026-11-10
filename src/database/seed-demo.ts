import 'dotenv/config';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

async function seedDemo(): Promise<void> {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    host: process.env.PGHOST,
    port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
  });
  const passwordHash = await bcrypt.hash(process.env.DEMO_ADMIN_PASSWORD ?? 'Admin123!', 12);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO role (role_name) VALUES ('ADMIN'), ('CONTENT_MANAGER')
       ON CONFLICT (role_name) DO NOTHING`,
    );
    await client.query(
      `UPDATE app_user SET role_id = (SELECT role_id FROM role WHERE role_name = 'CONTENT_MANAGER')
       WHERE role_id IN (SELECT role_id FROM role WHERE role_name IN ('EDITOR', 'REVIEWER'))`,
    );
    await client.query(`DELETE FROM role WHERE role_name IN ('EDITOR', 'REVIEWER')`);
    const role = await client.query<{ role_id: string }>(
      `SELECT role_id FROM role WHERE role_name = 'ADMIN'`,
    );
    await client.query(
      `INSERT INTO app_user (role_id, username, email, password_hash, is_active)
       VALUES ($1, 'admin', 'admin@audio-guide.local', $2, TRUE)
       ON CONFLICT (username) DO UPDATE SET role_id = EXCLUDED.role_id, password_hash = EXCLUDED.password_hash, is_active = TRUE`,
      [role.rows[0].role_id, passwordHash],
    );

    let location = await client.query<{ id: string }>(
      `SELECT l.location_id AS id FROM location l
       JOIN location_translation t ON t.location_id = l.location_id
       WHERE t.language_code = 'en' AND t.name = 'Imperial Citadel' LIMIT 1`,
    );
    if (!location.rows[0]) {
      location = await client.query<{ id: string }>('INSERT INTO location (is_active) VALUES (TRUE) RETURNING location_id AS id');
      await client.query(
        `INSERT INTO location_translation (location_id, language_code, name, short_description)
         VALUES ($1, 'en', 'Imperial Citadel', 'Historic audio-guide demo location'),
                ($1, 'vi', 'Hoàng Thành', 'Địa điểm demo thuyết minh')`,
        [location.rows[0].id],
      );
    }

    let poi = await client.query<{ id: string }>(
      `SELECT p.poi_id AS id FROM poi p
       JOIN poi_translation t ON t.poi_id = p.poi_id
       WHERE p.location_id = $1 AND t.language_code = 'en' AND t.name = 'Eastern Gate' LIMIT 1`,
      [location.rows[0].id],
    );
    if (!poi.rows[0]) {
      poi = await client.query<{ id: string }>('INSERT INTO poi (location_id, is_active) VALUES ($1, TRUE) RETURNING poi_id AS id', [location.rows[0].id]);
      await client.query(
        `INSERT INTO poi_translation (poi_id, language_code, name, short_description)
         VALUES ($1, 'en', 'Eastern Gate', 'The eastern entrance'),
                ($1, 'vi', 'Cổng thành phía Đông', 'Lối vào phía Đông')`,
        [poi.rows[0].id],
      );
    }

    const voices = [
      ['en', '21m00Tcm4TlvDq8ikWAM'],
      ['vi', 'pNInz6obpgDQGcFmaJgB'],
    ];
    for (const [languageCode, voiceKey] of voices) {
      await client.query(
        `INSERT INTO voice (language_code, provider_voice_key, is_available)
         VALUES ($1, $2, TRUE)
         ON CONFLICT (language_code, provider_voice_key) DO UPDATE SET is_available = TRUE`,
        [languageCode, voiceKey],
      );
    }
    const viVoice = await client.query<{ id: string }>(
      `SELECT voice_id AS id FROM voice WHERE language_code = 'vi' AND provider_voice_key = 'pNInz6obpgDQGcFmaJgB'`,
    );
    const content = await client.query<{ id: string }>(
      `INSERT INTO narration_content (poi_id, language_code, needs_review)
       VALUES ($1, 'vi', FALSE)
       ON CONFLICT (poi_id, language_code) DO UPDATE SET needs_review = FALSE
       RETURNING content_id AS id`,
      [poi.rows[0].id],
    );
    let version = await client.query<{ id: string }>(
      `SELECT version_id AS id FROM content_version
       WHERE content_id = $1 AND title = 'Cổng thành phía Đông'
       ORDER BY version_number DESC LIMIT 1`,
      [content.rows[0].id],
    );
    if (!version.rows[0]) {
      version = await client.query<{ id: string }>(
        `INSERT INTO content_version (content_id, version_number, title, narration_text, status, selected_voice_id)
         SELECT $1, COALESCE(MAX(version_number), 0) + 1,
                'Cổng thành phía Đông',
                'Bạn đang đứng trước cổng thành phía Đông, lối vào từng đón những đoàn khách đầu tiên của kinh thành.',
                'PUBLISHED', $2
         FROM content_version WHERE content_id = $1
         RETURNING version_id AS id`,
        [content.rows[0].id, viVoice.rows[0].id],
      );
    } else {
      await client.query(
        `UPDATE content_version
         SET status = 'PUBLISHED', selected_voice_id = $2,
             narration_text = 'Bạn đang đứng trước cổng thành phía Đông, lối vào từng đón những đoàn khách đầu tiên của kinh thành.'
         WHERE version_id = $1`,
        [version.rows[0].id, viVoice.rows[0].id],
      );
    }
    await client.query(
      `INSERT INTO audio (version_id, source_type, voice_id, file_path, file_format, file_size, is_valid, is_outdated)
       VALUES ($1, 'TTS', $2, $3, 'mp3', 1024, TRUE, FALSE)
       ON CONFLICT (version_id) DO UPDATE SET is_valid = TRUE, is_outdated = FALSE`,
      [version.rows[0].id, viVoice.rows[0].id, `mock://tts/content-${version.rows[0].id}.mp3`],
    );
    await client.query('COMMIT');
    console.log('Demo data ready.');
    console.log('Username: admin');
    console.log(`Password: ${process.env.DEMO_ADMIN_PASSWORD ?? 'Admin123!'}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedDemo().catch((error: unknown) => {
  console.error('Demo seed failed', error);
  process.exitCode = 1;
});
