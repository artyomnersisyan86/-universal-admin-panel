import { IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateLayoutTemplateDto {
  @IsString()
  @MinLength(1, { message: 'required' })
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsObject()
  layout!: Record<string, unknown>;
}
