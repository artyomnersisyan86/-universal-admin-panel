import { IsArray, IsObject, IsString, MinLength } from 'class-validator';

export class UpsertTableDto {
  @IsString()
  @MinLength(1, { message: 'required' })
  name!: string;

  @IsArray()
  columns!: unknown[];
}

export class ReorderRowsDto {
  @IsArray()
  ids!: string[];
}

export class UpsertRowDto {
  @IsObject()
  data!: Record<string, unknown>;
}
