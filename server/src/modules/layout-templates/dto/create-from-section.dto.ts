import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateFromSectionDto {
  @IsUUID()
  sectionId!: string;

  @IsString()
  @MinLength(1, { message: 'required' })
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
