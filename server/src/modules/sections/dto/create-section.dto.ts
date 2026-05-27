import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { SLUG_PATTERN } from '../reserved-slugs.const';
import { MultilingualTextDto } from './multilingual-text.dto';

export class CreateSectionDto {
  @IsString()
  @Matches(SLUG_PATTERN, { message: 'invalidSlug' })
  slug!: string;

  @ValidateNested()
  @Type(() => MultilingualTextDto)
  name!: MultilingualTextDto;

  @IsObject()
  layout!: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsString()
  icon?: string;
}
