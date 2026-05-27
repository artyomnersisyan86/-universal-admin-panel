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

export class UpdateSectionDto {
  @IsOptional()
  @IsString()
  @Matches(SLUG_PATTERN, { message: 'invalidSlug' })
  slug?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => MultilingualTextDto)
  name?: MultilingualTextDto;

  @IsOptional()
  @IsObject()
  layout?: Record<string, unknown>;

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
