import 'reflect-metadata';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { ValidationExceptionFilter } from '../src/common/filters/validation-exception.filter';

/**
 * Spin up the full Nest app against a throwaway SQLite file.
 * Each call creates a fresh DB so test suites don't bleed into each other.
 */
export async function createE2EApp(): Promise<{
  app: INestApplication;
  dbPath: string;
}> {
  const dbDir = path.resolve(__dirname, '..', 'data', 'e2e');
  fs.mkdirSync(dbDir, { recursive: true });
  const dbPath = path.join(
    dbDir,
    `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.sqlite`,
  );

  process.env.SQLITE_PATH = dbPath;
  process.env.JWT_SECRET = 'test-secret';
  process.env.SEED_SUPERADMIN_EMAIL = 'super@test.local';
  process.env.SEED_SUPERADMIN_PASSWORD = 'super-pass';

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }),
  );
  app.useGlobalFilters(new ValidationExceptionFilter());
  await app.init();

  return { app, dbPath };
}

export async function closeE2EApp(
  app: INestApplication,
  dbPath: string,
): Promise<void> {
  await app.close();
  try {
    fs.unlinkSync(dbPath);
  } catch {
    /* best-effort cleanup */
  }
}

export interface LoggedUser {
  token: string;
  userId: string;
  email: string;
  role: 'superadmin' | 'admin' | 'user';
}
