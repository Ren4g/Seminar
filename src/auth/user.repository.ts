import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';

export type AssignedLocationInfo = {
  locationId: number;
  name: string;
};

export type UserSummary = {
  id: number;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  failedLoginCount: number;
  lockedUntil: Date | null;
  lastLoginAt: Date | null;
  assignedLocations: AssignedLocationInfo[];
};

@Injectable()
export class UserRepository {
  private readonly pool: Pool;

  constructor(@Inject(DATABASE_POOL) pool: Pool) {
    this.pool = pool;
  }

  async list(): Promise<UserSummary[]> {
    const result = await this.pool.query(
      `SELECT u.user_id AS id, u.username, u.email, u.is_active, u.failed_login_count, u.locked_until, u.last_login_at, r.role_name AS role,
              COALESCE(
                (
                  SELECT json_agg(json_build_object(
                    'locationId', ula.location_id,
                    'name', COALESCE(
                      (SELECT lt.name FROM location_translation lt WHERE lt.location_id = ula.location_id ORDER BY CASE WHEN lt.language_code = 'vi' THEN 1 ELSE 2 END LIMIT 1),
                      'Địa điểm #' || ula.location_id
                    )
                  ))
                  FROM user_location_assignment ula
                  WHERE ula.user_id = u.user_id
                ),
                '[]'::json
              ) AS assigned_locations
       FROM app_user u
       JOIN role r ON r.role_id = u.role_id
       ORDER BY u.user_id`,
    );
    return result.rows.map((row) => ({
      id: Number(row.id),
      username: row.username,
      email: row.email,
      role: row.role,
      isActive: Boolean(row.is_active),
      failedLoginCount: Number(row.failed_login_count ?? 0),
      lockedUntil: row.locked_until ? new Date(row.locked_until) : null,
      lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : null,
      assignedLocations: Array.isArray(row.assigned_locations)
        ? row.assigned_locations.map((loc: { locationId: number; name: string }) => ({
            locationId: Number(loc.locationId),
            name: String(loc.name),
          }))
        : [],
    }));
  }

  async findById(id: number): Promise<UserSummary | undefined> {
    const result = await this.pool.query(
      `SELECT u.user_id AS id, u.username, u.email, u.is_active, u.failed_login_count, u.locked_until, u.last_login_at, r.role_name AS role,
              COALESCE(
                (
                  SELECT json_agg(json_build_object(
                    'locationId', ula.location_id,
                    'name', COALESCE(
                      (SELECT lt.name FROM location_translation lt WHERE lt.location_id = ula.location_id ORDER BY CASE WHEN lt.language_code = 'vi' THEN 1 ELSE 2 END LIMIT 1),
                      'Địa điểm #' || ula.location_id
                    )
                  ))
                  FROM user_location_assignment ula
                  WHERE ula.user_id = u.user_id
                ),
                '[]'::json
              ) AS assigned_locations
       FROM app_user u
       JOIN role r ON r.role_id = u.role_id
       WHERE u.user_id = $1`,
      [id],
    );
    const row = result.rows[0];
    if (!row) return undefined;
    return {
      id: Number(row.id),
      username: row.username,
      email: row.email,
      role: row.role,
      isActive: Boolean(row.is_active),
      failedLoginCount: Number(row.failed_login_count ?? 0),
      lockedUntil: row.locked_until ? new Date(row.locked_until) : null,
      lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : null,
      assignedLocations: Array.isArray(row.assigned_locations)
        ? row.assigned_locations.map((loc: { locationId: number; name: string }) => ({
            locationId: Number(loc.locationId),
            name: String(loc.name),
          }))
        : [],
    };
  }

  async create(username: string, email: string, passwordHash: string, roleName: string): Promise<UserSummary> {
    const result = await this.pool.query(
      `INSERT INTO app_user (role_id, username, email, password_hash)
       SELECT role_id, $1, $2, $3 FROM role WHERE role_name = $4
       RETURNING user_id AS id, username, email, is_active, failed_login_count, locked_until, last_login_at`,
      [username, email, passwordHash, roleName],
    );
    if (!result.rows[0]) throw new Error(`Role '${roleName}' does not exist`);
    return {
      id: Number(result.rows[0].id),
      username: result.rows[0].username,
      email: result.rows[0].email,
      role: roleName,
      isActive: Boolean(result.rows[0].is_active),
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: null,
      assignedLocations: [],
    };
  }

  async update(id: number, data: { email?: string; roleName?: string }): Promise<UserSummary | undefined> {
    if (data.roleName) {
      const roleRes = await this.pool.query('SELECT role_id FROM role WHERE role_name = $1', [data.roleName]);
      if (!roleRes.rows[0]) throw new Error(`Role '${data.roleName}' does not exist`);
      await this.pool.query('UPDATE app_user SET role_id = $2 WHERE user_id = $1', [id, roleRes.rows[0].role_id]);
    }
    if (data.email) {
      await this.pool.query('UPDATE app_user SET email = $2 WHERE user_id = $1', [id, data.email]);
    }
    return this.findById(id);
  }

  async setActive(id: number, isActive: boolean): Promise<UserSummary | undefined> {
    await this.pool.query('UPDATE app_user SET is_active = $2 WHERE user_id = $1', [id, isActive]);
    return this.findById(id);
  }

  async unlock(id: number): Promise<UserSummary | undefined> {
    await this.pool.query(
      'UPDATE app_user SET failed_login_count = 0, locked_until = NULL, is_active = TRUE WHERE user_id = $1',
      [id],
    );
    return this.findById(id);
  }

  async adminResetPassword(id: number, passwordHash: string): Promise<void> {
    await this.pool.query(
      'UPDATE app_user SET password_hash = $2, failed_login_count = 0, locked_until = NULL WHERE user_id = $1',
      [id, passwordHash],
    );
  }

  async assignLocation(userId: number, locationId: number): Promise<void> {
    await this.pool.query(
      `INSERT INTO user_location_assignment (user_id, location_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [userId, locationId],
    );
  }

  async removeLocation(userId: number, locationId: number): Promise<void> {
    await this.pool.query(
      `DELETE FROM user_location_assignment WHERE user_id = $1 AND location_id = $2`,
      [userId, locationId],
    );
  }

  async countPendingReviewsForLocation(locationId: number): Promise<number> {
    const result = await this.pool.query(
      `SELECT COUNT(*)::int AS count
       FROM content_version cv
       JOIN poi p ON p.poi_id = cv.poi_id
       WHERE p.location_id = $1 AND cv.status = 'PENDING_REVIEW'`,
      [locationId],
    );
    return Number(result.rows[0]?.count ?? 0);
  }

  async listAssignments(userId: number): Promise<number[]> {
    const result = await this.pool.query(
      'SELECT location_id FROM user_location_assignment WHERE user_id = $1 ORDER BY location_id',
      [userId],
    );
    return result.rows.map((row) => Number(row.location_id));
  }

  async countActiveAdmins(): Promise<number> {
    const result = await this.pool.query(
      `SELECT COUNT(*)::int AS count
       FROM app_user u
       JOIN role r ON r.role_id = u.role_id
       WHERE r.role_name = 'ADMIN' AND u.is_active = TRUE`,
    );
    return Number(result.rows[0]?.count ?? 0);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM app_user WHERE user_id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
