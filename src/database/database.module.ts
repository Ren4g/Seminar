import { Global, Module } from '@nestjs/common';
import { Pool } from 'pg';

export const DATABASE_POOL = Symbol('DATABASE_POOL');

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_POOL,
      useFactory: (): Pool => {
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          host: process.env.PGHOST,
          port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
          database: process.env.PGDATABASE,
          user: process.env.PGUSER,
          password: process.env.PGPASSWORD,
          // Keep each Vercel function instance's pool small when using a
          // serverless Postgres pooler. Local persistent servers can use more.
          max: process.env.VERCEL ? 1 : 10,
        });
        pool.on('error', (error) => {
          console.error('Unexpected PostgreSQL pool error', error);
        });
        return pool;
      },
    },
  ],
  exports: [DATABASE_POOL],
})
export class DatabaseModule {}
