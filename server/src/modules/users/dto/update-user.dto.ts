import { IsEmail, IsEnum, IsOptional, MinLength } from 'class-validator';
import { UserRole } from '../user-role.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: 'invalidEmail' })
  email?: string;

  @IsOptional()
  @MinLength(6, { message: 'tooShort' })
  password?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'invalidRole' })
  role?: UserRole;
}
