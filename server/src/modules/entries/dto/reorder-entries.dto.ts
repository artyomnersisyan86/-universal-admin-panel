import { IsArray, IsUUID } from 'class-validator';

export class ReorderEntriesDto {
  @IsArray()
  @IsUUID('all', { each: true })
  ids!: string[];
}
