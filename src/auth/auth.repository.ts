import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import { DATABASE_POOL } from '../database/database.module';

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  role: string;
  isActive: boolean;
  failedLoginCount: number;
  lockedUntil: Date | null;
};

type UserRow = {
  user_id: string;
  username: string;
  email: string;
  password_hash: string;
  role_name: string;
  is_active: boolean;
  failed_login_count?: string | number | null;
  locked_until?: string | Date | null;
};

type ResetTokenRow = {
  token_id: string;
  user_id: string;
  expires_at: string | Date;
};

@Injectable()
export class AuthRepository {
  private readonly pool: Pool;

  constructor(@Inject(DATABASE_POOL) pool: Pool) {
    this.pool = pool;
  }

  async findByUsername(username: string): Promise<AuthUser | undefined> {
    const result = await this.pool.query<UserRow>(
      `SELECT u.user_id, u.username, u.email, u.password_hash, u.is_active, u.failed_login_count, u.locked_until, r.role_name
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
      failedLoginCount: Number(row.failed_login_count ?? 0),
      lockedUntil: row.locked_until ? new Date(row.locked_until) : null,
    };
  }

  async findByEmail(email: string): Promise<AuthUser | undefined> {
    const result = await this.pool.query<UserRow>(
      `SELECT u.user_id, u.username, u.email, u.password_hash, u.is_active, u.failed_login_count, u.locked_until, r.role_name
       FROM app_user u
       JOIN role r ON r.role_id = u.role_id
       WHERE LOWER(u.email) = LOWER($1)`,
      [email],
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
      failedLoginCount: Number(row.failed_login_count ?? 0),
      lockedUntil: row.locked_until ? new Date(row.locked_until) : null,
    };
  }

  async findById(id: number): Promise<AuthUser | undefined> {
    const result = await this.pool.query<UserRow>(
      `SELECT u.user_id, u.username, u.email, u.password_hash, u.is_active, u.failed_login_count, u.locked_until, r.role_name
       FROM app_user u JOIN role r ON r.role_id = u.role_id WHERE u.user_id = $1`,
      [id],
    );
    const row = result.rows[0];
    return row
      ? {
          id: Number(row.user_id),
          username: row.username,
          email: row.email,
          passwordHash: row.password_hash,
          role: row.role_name,
          isActive: row.is_active,
          failedLoginCount: Number(row.failed_login_count ?? 0),
          lockedUntil: row.locked_until ? new Date(row.locked_until) : null,
        }
      : undefined;
  }

  async recordLogin(userId: number): Promise<void> {
    await this.pool.query(
      'UPDATE app_user SET last_login_at = now(), failed_login_count = 0, locked_until = NULL WHERE user_id = $1',
      [userId],
    );
  }

  async recordFailedLogin(userId: number, failedCount: number, lockedUntil: Date | null): Promise<void> {
    await this.pool.query(
      'UPDATE app_user SET failed_login_count = $2, locked_until = $3 WHERE user_id = $1',
      [userId, failedCount, lockedUntil],
    );
  }

  async updatePassword(userId: number, passwordHash: string): Promise<void> {
    await this.pool.query(
      'UPDATE app_user SET password_hash = $2, failed_login_count = 0, locked_until = NULL WHERE user_id = $1',
      [userId, passwordHash],
    );
  }

  async createPasswordResetToken(userId: number, tokenHash: string, expiresAt: Date): Promise<string> {
    const tokenId = randomUUID();
    await this.pool.query(
      `INSERT INTO password_reset_token (token_id, user_id, token_hash, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [tokenId, userId, tokenHash, expiresAt],
    );
    return tokenId;
  }

  async findValidPasswordResetToken(
    tokenHash: string,
  ): Promise<{ tokenId: string; userId: number; expiresAt: Date } | undefined> {
    const result = await this.pool.query<ResetTokenRow>(
      `SELECT token_id, user_id, expires_at
       FROM password_reset_token
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()`,
      [tokenHash],
    );
    const row = result.rows[0];
    if (!row) return undefined;
    return {
      tokenId: row.token_id,
      userId: Number(row.user_id),
      expiresAt: new Date(row.expires_at),
    };
  }

  async markPasswordResetTokenUsed(tokenId: string): Promise<void> {
    await this.pool.query('UPDATE password_reset_token SET used_at = now() WHERE token_id = $1', [tokenId]);
  }
}
