import { IsString } from 'class-validator';

export class MultilingualTextDto {
  @IsString()
  hy!: string;

  @IsString()
  ru!: string;

  @IsString()
  en!: string;
}
