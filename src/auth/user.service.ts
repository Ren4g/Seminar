import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AdminResetPasswordDto, CreateUserDto, UpdateUserDto, UpdateUserStatusDto } from './user.dto';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  private readonly repository: UserRepository;

  constructor(repository: UserRepository) {
    this.repository = repository;
  }

  list() {
    return this.repository.list();
  }

  async create(dto: CreateUserDto) {
    // [TÍNH NĂNG: UC05 - Kiểm tra điều kiện tạo Content Manager bắt buộc phải phân công địa điểm]
    if (dto.roleName === 'CONTENT_MANAGER' && (!dto.locationIds || dto.locationIds.length === 0)) {
      throw new BadRequestException('Content Manager bắt buộc phải được phân công ít nhất một địa điểm phụ trách.');
    }

    try {
      const user = await this.repository.create(
        dto.username,
        dto.email,
        await bcrypt.hash(dto.password, 12),
        dto.roleName,
      );

      if (dto.locationIds && dto.locationIds.length > 0) {
        for (const locId of dto.locationIds) {
          await this.repository.assignLocation(user.id, locId);
        }
      }

      return await this.repository.findById(user.id);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Unable to create user');
    }
  }

  // [TÍNH NĂNG: UC05 - Cập nhật thông tin và đổi vai trò tài khoản]
  async update(currentUserId: number, targetUserId: number, dto: UpdateUserDto) {
    const user = await this.repository.findById(targetUserId);
    if (!user) throw new NotFoundException(`User '${targetUserId}' was not found`);

    // Bảo vệ quản trị viên cuối cùng: Không cho tự hạ quyền nếu là Admin duy nhất
    if (user.role === 'ADMIN' && dto.roleName === 'CONTENT_MANAGER') {
      const activeAdmins = await this.repository.countActiveAdmins();
      if (activeAdmins <= 1) {
        throw new BadRequestException('Không thể hạ quyền quản trị viên cuối cùng của hệ thống.');
      }
    }

    return this.repository.update(targetUserId, dto);
  }

  // [TÍNH NĂNG: UC05 - Khóa hoặc mở khóa tài khoản với bảo vệ tài khoản quản trị cuối]
  async setActive(currentUserId: number, targetUserId: number, dto: UpdateUserStatusDto) {
    if (currentUserId === targetUserId && !dto.isActive) {
      throw new BadRequestException('Bạn không thể tự khóa tài khoản của chính mình.');
    }

    const user = await this.repository.findById(targetUserId);
    if (!user) throw new NotFoundException(`User '${targetUserId}' was not found`);

    if (user.role === 'ADMIN' && !dto.isActive) {
      const activeAdmins = await this.repository.countActiveAdmins();
      if (activeAdmins <= 1) {
        throw new BadRequestException('Không thể khóa quản trị viên cuối cùng của hệ thống.');
      }
    }

    return this.repository.setActive(targetUserId, dto.isActive);
  }

  // [TÍNH NĂNG: UC05 - Mở khóa tài khoản bị khóa tạm do đăng nhập sai nhiều lần]
  async unlock(targetUserId: number) {
    const user = await this.repository.unlock(targetUserId);
    if (!user) throw new NotFoundException(`User '${targetUserId}' was not found`);
    return user;
  }

  // [TÍNH NĂNG: UC05 - Đặt lại mật khẩu tài khoản bởi Administrator]
  async adminResetPassword(targetUserId: number, dto: AdminResetPasswordDto) {
    const user = await this.repository.findById(targetUserId);
    if (!user) throw new NotFoundException(`User '${targetUserId}' was not found`);

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.repository.adminResetPassword(targetUserId, passwordHash);
    return { success: true, message: `Đã đặt lại mật khẩu cho tài khoản ${user.username}.` };
  }

  // [TÍNH NĂNG: UC05 - Phân công địa điểm phụ trách cho Content Manager]
  assignLocation(userId: number, locationId: number) {
    return this.repository.assignLocation(userId, locationId);
  }

  // [TÍNH NĂNG: UC05 - Thu hồi phân công địa điểm kèm kiểm tra nội dung chờ duyệt]
  async removeLocation(userId: number, locationId: number) {
    const pendingCount = await this.repository.countPendingReviewsForLocation(locationId);
    await this.repository.removeLocation(userId, locationId);
    return {
      success: true,
      pendingCount,
      warning:
        pendingCount > 0
          ? `Địa điểm này đang có ${pendingCount} bài viết chờ duyệt. Các bài viết này vẫn do Administrator xử lý.`
          : undefined,
    };
  }

  listAssignments(userId: number) {
    return this.repository.listAssignments(userId);
  }

  // [TÍNH NĂNG: UC05 - Xóa tài khoản nhân sự có bảo vệ]
  async delete(currentUserId: number, targetUserId: number) {
    if (currentUserId === targetUserId) {
      throw new BadRequestException('Bạn không thể tự xóa tài khoản của chính mình.');
    }
    const user = await this.repository.findById(targetUserId);
    if (!user) throw new NotFoundException(`User '${targetUserId}' was not found`);

    if (user.role === 'ADMIN') {
      const activeAdmins = await this.repository.countActiveAdmins();
      if (activeAdmins <= 1) {
        throw new BadRequestException('Không thể xóa quản trị viên cuối cùng của hệ thống.');
      }
    }

    const deleted = await this.repository.delete(targetUserId);
    return { deleted };
  }
}
