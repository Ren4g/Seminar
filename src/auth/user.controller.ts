import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { AuthenticatedRequest } from './request.types';
import { AdminResetPasswordDto, CreateUserDto, UpdateUserDto, UpdateUserStatusDto } from './user.dto';
import { UserService } from './user.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class UserController {
  private readonly service: UserService;

  constructor(service: UserService) {
    this.service = service;
  }

  // [TÍNH NĂNG: UC05 - Xem danh sách tài khoản nhân sự]
  @Get()
  list() {
    return this.service.list();
  }

  // [TÍNH NĂNG: UC05 - Tạo tài khoản mới]
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.service.create(dto);
  }

  // [TÍNH NĂNG: UC05 - Cập nhật thông tin & đổi vai trò]
  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.service.update(request.user.userId, id, dto);
  }

  // [TÍNH NĂNG: UC05 - Khóa hoặc kích hoạt tài khoản]
  @Patch(':id/status')
  setActive(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.service.setActive(request.user.userId, id, dto);
  }

  // [TÍNH NĂNG: UC05 - Mở khóa tài khoản bị khóa do sai mật khẩu]
  @Post(':id/unlock')
  unlock(@Param('id', ParseIntPipe) id: number) {
    return this.service.unlock(id);
  }

  // [TÍNH NĂNG: UC05 - Đặt lại mật khẩu tài khoản bởi Administrator]
  @Post(':id/reset-password')
  adminResetPassword(@Param('id', ParseIntPipe) id: number, @Body() dto: AdminResetPasswordDto) {
    return this.service.adminResetPassword(id, dto);
  }

  // [TÍNH NĂNG: UC05 - Phân công địa điểm phụ trách]
  @Post(':id/locations/:locationId')
  assignLocation(
    @Param('id', ParseIntPipe) id: number,
    @Param('locationId', ParseIntPipe) locationId: number,
  ) {
    return this.service.assignLocation(id, locationId);
  }

  // [TÍNH NĂNG: UC05 - Thu hồi phân công địa điểm]
  @Delete(':id/locations/:locationId')
  removeLocation(
    @Param('id', ParseIntPipe) id: number,
    @Param('locationId', ParseIntPipe) locationId: number,
  ) {
    return this.service.removeLocation(id, locationId);
  }

  // [TÍNH NĂNG: UC05 - Xem danh sách địa điểm phân công]
  @Get(':id/locations')
  listAssignments(@Param('id', ParseIntPipe) id: number) {
    return this.service.listAssignments(id);
  }

  // [TÍNH NĂNG: UC05 - Xóa tài khoản nhân sự]
  @Delete(':id')
  delete(@Req() request: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.service.delete(request.user.userId, id);
  }
}
