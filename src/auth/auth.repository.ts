import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  role: string;
  isActive: boolean;
};

type UserRow = {
  user_id: string;
  username: string;
  email: string;
  password_hash: string;
  role_name: string;
  is_active: boolean;
};

@Injectable()
export class AuthRepository {
  private readonly pool: Pool;

  constructor(@Inject(DATABASE_POOL) pool: Pool) {
    this.pool = pool;
  }

  async findByUsername(username: string): Promise<AuthUser | undefined> {
    const result = await this.pool.query<UserRow>(
      `SELECT u.user_id, u.username, u.email, u.password_hash, u.is_active, r.role_name
       FROM app_user u
       JOIN role r ON r.role_id = u.role_id
       WHERE u.username = $1`,
      [username],
    );
    const row = result.rows[0];
    if (!row) return undefined;
    return {
      id: Number(row.user_id),
      username: row.username,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role_name,
      isActive: row.is_active,
    };
  }

  async findById(id: number): Promise<AuthUser | undefined> {
    const result = await this.pool.query<UserRow>(
      `SELECT u.user_id, u.username, u.email, u.password_hash, u.is_active, r.role_name
       FROM app_user u JOIN role r ON r.role_id = u.role_id WHERE u.user_id = $1`,
      [id],
    );
    const row = result.rows[0];
    return row ? { id: Number(row.user_id), username: row.username, email: row.email, passwordHash: row.password_hash, role: row.role_name, isActive: row.is_active } : undefined;
  }

  async recordLogin(userId: number): Promise<void> {
    await this.pool.query('UPDATE app_user SET last_login_at = now() WHERE user_id = $1', [userId]);
  }

  async updatePassword(userId: number, passwordHash: string): Promise<void> {
    await this.pool.query('UPDATE app_user SET password_hash = $2 WHERE user_id = $1', [userId, passwordHash]);
  }
}
