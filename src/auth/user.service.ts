import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto, UpdateUserStatusDto } from './user.dto';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  private readonly repository: UserRepository;

  constructor(repository: UserRepository) { this.repository = repository; }

  list() { return this.repository.list(); }

  async create(dto: CreateUserDto) {
    try { return await this.repository.create(dto.username, dto.email, await bcrypt.hash(dto.password, 12), dto.roleName); }
    catch (error) { throw new BadRequestException(error instanceof Error ? error.message : 'Unable to create user'); }
  }

  async setActive(id: number, dto: UpdateUserStatusDto) {
    const user = await this.repository.setActive(id, dto.isActive);
    if (!user) throw new NotFoundException(`User '${id}' was not found`);
    return user;
  }

  assignLocation(userId: number, locationId: number) { return this.repository.assignLocation(userId, locationId); }
  listAssignments(userId: number) { return this.repository.listAssignments(userId); }
}
