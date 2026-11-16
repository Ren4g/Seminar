import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './auth.dto';
import { ChangePasswordDto } from './password.dto';
import { AuthRepository } from './auth.repository';

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly repository: AuthRepository;
  private readonly jwt: JwtService;

  constructor(repository: AuthRepository, jwt: JwtService) {
    this.repository = repository;
    this.jwt = jwt;
  }

  async login(dto: LoginDto) {
    const user = await this.repository.findByUsername(dto.username);
    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive or disabled');
    }

    const now = new Date();
    if (user.lockedUntil && user.lockedUntil > now) {
      throw new UnauthorizedException(`Account is temporarily locked until ${user.lockedUntil.toISOString()}`);
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      const isPreviousLockExpired = Boolean(user.lockedUntil && user.lockedUntil <= now);
      const currentFailed = isPreviousLockExpired ? 0 : user.failedLoginCount;
      const nextFailed = currentFailed + 1;

      if (nextFailed >= MAX_FAILED_LOGIN_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
        await this.repository.recordFailedLogin(user.id, nextFailed, lockedUntil);
        throw new UnauthorizedException(`Account is temporarily locked until ${lockedUntil.toISOString()}`);
      }

      await this.repository.recordFailedLogin(user.id, nextFailed, null);
      throw new UnauthorizedException('Invalid username or password');
    }

    await this.repository.recordLogin(user.id);
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      username: user.username,
      role: user.role,
    });
    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  async changePassword(userId: number, dto: ChangePasswordDto): Promise<{ changed: true }> {
    const user = await this.repository.findByUsername((await this.repository.findById(userId))?.username ?? '');
    if (!user || !(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    await this.repository.updatePassword(userId, await bcrypt.hash(dto.newPassword, 12));
    return { changed: true };
  }
}
