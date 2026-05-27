import { IsEmail, IsEnum, IsOptional, MinLength } from 'class-validator';
import { UserRole } from '../user-role.enum';

export class CreateUserDto {
  @IsEmail({}, { message: 'invalidEmail' })
  email!: string;

  @MinLength(6, { message: 'tooShort' })
  password!: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'invalidRole' })
  role?: UserRole;
}
