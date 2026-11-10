import { IsBoolean, IsEmail, IsIn, IsNotEmpty, IsString, MinLength } from 'class-validator';

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
}

export class UpdateUserStatusDto {
  @IsBoolean()
  isActive!: boolean;
}
