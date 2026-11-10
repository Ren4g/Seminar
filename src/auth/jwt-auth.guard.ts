import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthPrincipal } from './auth.types';

type AuthenticatedRequest = Request & { user?: AuthPrincipal };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly jwt: JwtService;

  constructor(jwt: JwtService) {
    this.jwt = jwt;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('Bearer token required');
    try {
      const payload = await this.jwt.verifyAsync<{ sub: number; username: string; role: string }>(header.slice(7));
      request.user = { userId: Number(payload.sub), username: payload.username, role: payload.role };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
