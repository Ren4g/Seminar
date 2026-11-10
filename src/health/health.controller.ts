import { Controller, Get, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';

type HealthResponse = {
  status: 'ok' | 'degraded';
  service: string;
  timestamp: string;
  database: 'up' | 'down';
};

@Controller('health')
export class HealthController {
  private readonly pool: Pool;

  constructor(@Inject(DATABASE_POOL) pool: Pool) {
    this.pool = pool;
  }

  @Get()
  async getHealth(): Promise<HealthResponse> {
    let database: HealthResponse['database'] = 'up';
    try {
      await this.pool.query('SELECT 1');
    } catch (error) {
      database = 'down';
      console.error('Database health check failed', error);
    }

    return {
      status: database === 'up' ? 'ok' : 'degraded',
      service: 'audio-guide-api',
      timestamp: new Date().toISOString(),
      database,
    };
  }
}
