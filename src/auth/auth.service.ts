import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './auth.dto';
import { ChangePasswordDto } from './password.dto';
import { AuthRepository } from './auth.repository';

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
    if (!user || !user.isActive || !(await bcrypt.compare(dto.password, user.passwordHash))) {
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
