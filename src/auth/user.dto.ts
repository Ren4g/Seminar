import { IsArray, IsBoolean, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsIn(['ADMIN', 'CONTENT_MANAGER'])
  roleName!: string;

  @IsOptional()
  @IsArray()
  locationIds?: number[];
}

export class UpdateUserStatusDto {
  @IsBoolean()
  isActive!: boolean;
}

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsIn(['ADMIN', 'CONTENT_MANAGER'])
  roleName?: string;
}

export class AdminResetPasswordDto {
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
