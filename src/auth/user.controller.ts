import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Roles, } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { CreateUserDto, UpdateUserStatusDto } from './user.dto';
import { UserService } from './user.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class UserController {
  private readonly service: UserService;
  constructor(service: UserService) { this.service = service; }

  @Get()
  list() { return this.service.list(); }

  @Post()
  create(@Body() dto: CreateUserDto) { return this.service.create(dto); }

  @Patch(':id/status')
  setActive(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserStatusDto) { return this.service.setActive(id, dto); }

  @Post(':id/locations/:locationId')
  assignLocation(@Param('id', ParseIntPipe) id: number, @Param('locationId', ParseIntPipe) locationId: number) {
    return this.service.assignLocation(id, locationId);
  }

  @Get(':id/locations')
  listAssignments(@Param('id', ParseIntPipe) id: number) { return this.service.listAssignments(id); }
}
