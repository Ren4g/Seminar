import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthenticatedRequest } from './request.types';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ChangePasswordDto, ForgotPasswordDto, ResetPasswordDto } from './password.dto';
import { LoginDto } from './auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  private readonly service: AuthService;

  constructor(service: AuthService) {
    this.service = service;
  }

  // [TÍNH NĂNG: UC01 - Đăng nhập tài khoản]
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.service.login(dto);
  }

  // [TÍNH NĂNG: UC03 - Đổi mật khẩu tài khoản đang đăng nhập]
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(@Req() request: AuthenticatedRequest, @Body() dto: ChangePasswordDto) {
    return this.service.changePassword(request.user.userId, dto);
  }

  // [TÍNH NĂNG: UC04 - Yêu cầu khôi phục mật khẩu qua email]
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.service.forgotPassword(dto);
  }

  // [TÍNH NĂNG: UC04 - Xác thực mã và hoàn tất đặt mật khẩu mới]
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.service.resetPassword(dto);
  }
}
