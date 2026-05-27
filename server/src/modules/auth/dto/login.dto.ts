import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'invalidEmail' })
  email!: string;

  @IsString()
  @MinLength(1, { message: 'required' })
  password!: string;
}
