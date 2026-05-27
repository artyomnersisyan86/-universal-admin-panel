import { IsArray, IsString, MinLength } from 'class-validator';

export class UpsertFormSchemaDto {
  @IsString()
  @MinLength(1, { message: 'required' })
  name!: string;

  @IsArray()
  schema!: unknown[];
}
