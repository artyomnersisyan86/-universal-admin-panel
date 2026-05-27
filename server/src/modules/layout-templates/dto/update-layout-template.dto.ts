import { IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateLayoutTemplateDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'required' })
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  layout?: Record<string, unknown>;
}
