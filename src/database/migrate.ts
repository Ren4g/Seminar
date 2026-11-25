import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Pool } from 'pg';

async function migrate(): Promise<void> {
  const schemaPath = resolve(__dirname, '../../schema.sql');
  const schema = await readFile(schemaPath, 'utf8');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    host: process.env.PGHOST,
    port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
  });

  try {
    const existing = await pool.query<{ exists: boolean }>(
      `SELECT EXISTS (SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'app_user') AS exists`,
    );
    if (!existing.rows[0].exists) {
      await pool.query(schema);
    } else {
      console.log('Base schema already exists; skipping schema.sql');
    }
    const platformMigration = await readFile(resolve(__dirname, '../../migrations/001_platform.sql'), 'utf8');
    await pool.query(platformMigration);
    const visitorPresenceMigration = await readFile(resolve(__dirname, '../../migrations/002_visitor_presence.sql'), 'utf8');
    await pool.query(visitorPresenceMigration);
    const reviewHistoryMigration = await readFile(resolve(__dirname, '../../migrations/003_review_history_mark_reviewed.sql'), 'utf8');
    await pool.query(reviewHistoryMigration);
    const locationCoordinatesMigration = await readFile(resolve(__dirname, '../../migrations/004_location_coordinates.sql'), 'utf8');
    await pool.query(locationCoordinatesMigration);
    console.log(`Applied database schema from ${schemaPath}`);
  } finally {
    await pool.end();
  }
}

migrate().catch((error: unknown) => {
  console.error('Database migration failed', error);
  process.exitCode = 1;
});
