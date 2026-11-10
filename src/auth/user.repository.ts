import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';

export type UserSummary = { id: number; username: string; email: string; role: string; isActive: boolean };

@Injectable()
export class UserRepository {
  private readonly pool: Pool;

  constructor(@Inject(DATABASE_POOL) pool: Pool) {
    this.pool = pool;
  }

  async list(): Promise<UserSummary[]> {
    const result = await this.pool.query(
      `SELECT u.user_id AS id, u.username, u.email, u.is_active, r.role_name AS role
       FROM app_user u JOIN role r ON r.role_id = u.role_id ORDER BY u.user_id`,
    );
    return result.rows.map((row) => ({ id: Number(row.id), username: row.username, email: row.email, role: row.role, isActive: row.is_active }));
  }

  async create(username: string, email: string, passwordHash: string, roleName: string): Promise<UserSummary> {
    const result = await this.pool.query(
      `INSERT INTO app_user (role_id, username, email, password_hash)
       SELECT role_id, $1, $2, $3 FROM role WHERE role_name = $4
       RETURNING user_id AS id, username, email, is_active`,
      [username, email, passwordHash, roleName],
    );
    if (!result.rows[0]) throw new Error(`Role '${roleName}' does not exist`);
    return { ...result.rows[0], id: Number(result.rows[0].id), role: roleName, isActive: result.rows[0].is_active };
  }

  async setActive(id: number, isActive: boolean): Promise<UserSummary | undefined> {
    const result = await this.pool.query(
      `UPDATE app_user u SET is_active = $2
       WHERE user_id = $1
       RETURNING user_id AS id, username, email, is_active`,
      [id, isActive],
    );
    if (!result.rows[0]) return undefined;
    const role = await this.pool.query('SELECT r.role_name FROM role r JOIN app_user u ON u.role_id = r.role_id WHERE u.user_id = $1', [id]);
    return { ...result.rows[0], id: Number(result.rows[0].id), role: role.rows[0].role_name, isActive: result.rows[0].is_active };
  }

  async assignLocation(userId: number, locationId: number): Promise<void> {
    await this.pool.query(
      `INSERT INTO user_location_assignment (user_id, location_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [userId, locationId],
    );
  }

  async listAssignments(userId: number): Promise<number[]> {
    const result = await this.pool.query('SELECT location_id FROM user_location_assignment WHERE user_id = $1 ORDER BY location_id', [userId]);
    return result.rows.map((row) => Number(row.location_id));
  }
}
