import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as path from 'node:path';

const databaseUrl = process.env.DATABASE_URL;
const isPostgres = !!databaseUrl && databaseUrl.startsWith('postgres');

export default new DataSource(
  isPostgres
    ? {
        type: 'postgres',
        url: databaseUrl,
        entities: ['src/**/*.entity.ts'],
        migrations: ['src/migrations/*.ts'],
      }
    : {
        type: 'better-sqlite3',
        database:
          process.env.SQLITE_PATH ?? path.resolve(process.cwd(), 'data', 'app.sqlite'),
        entities: ['src/**/*.entity.ts'],
        migrations: ['src/migrations/*.ts'],
      },
);
