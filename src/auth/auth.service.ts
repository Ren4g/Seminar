import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import { LoginDto } from './auth.dto';
import { ChangePasswordDto, ForgotPasswordDto, ResetPasswordDto } from './password.dto';
import { AuthRepository } from './auth.repository';

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const RESET_TOKEN_LIFETIME_MS = 30 * 60 * 1000; // 30 phút theo đặc tả UC04

function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken.trim()).digest('hex');
}

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

  async changePassword(userId: number, dto: ChangePasswordDto): Promise<{ changed: true; message: string }> {
    const user = await this.repository.findById(userId);
    if (!user || !(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    await this.repository.updatePassword(userId, await bcrypt.hash(dto.newPassword, 12));
    return { changed: true, message: 'Đổi mật khẩu thành công' };
  }

  // [TÍNH NĂNG: UC04 - Yêu cầu khôi phục mật khẩu qua email]
  async forgotPassword(dto: ForgotPasswordDto): Promise<{
    success: true;
    message: string;
    resetToken?: string;
  }> {
    const user = await this.repository.findByEmail(dto.email);
    // Theo PRD UC04: Không tiết lộ email có tồn tại trong hệ thống hay không
    const genericMessage = 'Nếu email tồn tại trong hệ thống, hướng dẫn khôi phục mật khẩu đã được gửi.';

    if (!user || !user.isActive) {
      return { success: true, message: genericMessage };
    }

    // Sinh mã token 8 ký tự (hoặc 16 hex chars) có thời hạn 30 phút
    const rawToken = randomBytes(4).toString('hex').toUpperCase();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_LIFETIME_MS);

    await this.repository.createPasswordResetToken(user.id, tokenHash, expiresAt);

    // Trong môi trường dev/demo, gửi kèm token để hỗ trợ kiểm thử giao diện thuận tiện
    return {
      success: true,
      message: genericMessage,
      resetToken: rawToken,
    };
  }

  // [TÍNH NĂNG: UC04 - Xác thực mã và đặt lại mật khẩu mới]
  async resetPassword(dto: ResetPasswordDto): Promise<{ reset: true; message: string }> {
    const tokenHash = hashToken(dto.token);
    const tokenRecord = await this.repository.findValidPasswordResetToken(tokenHash);

    if (!tokenRecord) {
      throw new BadRequestException('Mã khôi phục không hợp lệ hoặc đã hết hạn (thời hạn 30 phút).');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.repository.updatePassword(tokenRecord.userId, newPasswordHash);
    await this.repository.markPasswordResetTokenUsed(tokenRecord.tokenId);

    return {
      reset: true,
      message: 'Khôi phục mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.',
    };
  }
}
