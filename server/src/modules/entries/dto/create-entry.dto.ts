import { IsEnum, IsObject, IsOptional } from 'class-validator';
import { EntryStatus } from '../entry-status.enum';

export class CreateEntryDto {
  @IsObject()
  data!: Record<string, unknown>;

  @IsOptional()
  @IsEnum(EntryStatus, { message: 'invalidStatus' })
  status?: EntryStatus;
}
