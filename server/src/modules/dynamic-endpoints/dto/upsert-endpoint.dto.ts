import { IsBoolean, IsIn, IsOptional, IsString, Matches } from 'class-validator';

const ALLOWED_METHODS = ['GET', 'POST', 'PATCH', 'DELETE'] as const;

export class UpsertEndpointDto {
  @IsIn(ALLOWED_METHODS as unknown as string[], { message: 'invalidMethod' })
  method!: 'GET' | 'POST' | 'PATCH' | 'DELETE';

  @IsString()
  @Matches(/^\/api\/[a-zA-Z0-9/_-]+$/u, { message: 'invalidPath' })
  path!: string;

  @IsIn(['static', 'db'], { message: 'invalidMode' })
  mode!: 'static' | 'db';

  @IsOptional()
  responseTemplate?: unknown;

  @IsOptional()
  dbQueryConfig?: unknown;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
