import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import * as path from 'node:path';
import * as fs from 'node:fs';

export const typeOrmConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (cfg: ConfigService) => {
    const databaseUrl = cfg.get<string>('DATABASE_URL');
    const isProd = cfg.get<string>('NODE_ENV') === 'production';
    const logging: ('error' | 'warn')[] = isProd ? ['error'] : ['error', 'warn'];

    // If DATABASE_URL is set and looks like Postgres, use it (Docker path).
    // Otherwise default to a local SQLite file — zero external setup.
    if (databaseUrl && databaseUrl.startsWith('postgres')) {
      return {
        type: 'postgres',
        url: databaseUrl,
        autoLoadEntities: true,
        synchronize: false,
        migrationsRun: true,
        migrations: [path.join(__dirname, '..', 'migrations', '*.{ts,js}')],
        logging,
      };
    }

    const dbPath =
      cfg.get<string>('SQLITE_PATH') ??
      path.resolve(process.cwd(), 'data', 'app.sqlite');
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });

    return {
      type: 'better-sqlite3',
      database: dbPath,
      autoLoadEntities: true,
      synchronize: !isProd,
      logging,
    };
  },
};
