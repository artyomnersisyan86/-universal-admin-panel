import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class UpsertWidgetDto {
  @IsIn(['line', 'bar'], { message: 'invalid' })
  type!: 'line' | 'bar';

  @IsString()
  @MinLength(1, { message: 'required' })
  title!: string;

  @IsString()
  dataEndpoint!: string;

  @IsOptional()
  config?: unknown;
}
