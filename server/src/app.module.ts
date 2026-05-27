import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { FormSchemasModule } from './modules/form-schemas/form-schemas.module';
import { TablesModule } from './modules/tables/tables.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DynamicEndpointsModule } from './modules/dynamic-endpoints/dynamic-endpoints.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { HealthModule } from './modules/health/health.module';
import { SeedModule } from './modules/seed/seed.module';
import { SectionsModule } from './modules/sections/sections.module';
import { LayoutTemplatesModule } from './modules/layout-templates/layout-templates.module';
import { EntriesModule } from './modules/entries/entries.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync(typeOrmConfig),
    AuthModule,
    UsersModule,
    FormSchemasModule,
    TablesModule,
    DashboardModule,
    UploadsModule,
    HealthModule,
    SeedModule,
    // Static section/template CRUD — own fixed paths.
    SectionsModule,
    LayoutTemplatesModule,
    // EntriesModule registers SectionEntriesController with a `:sectionSlug`
    // param — must come AFTER all static `/api/*` controllers so they win the
    // route match, and BEFORE DynamicEndpointsModule's catch-all dispatcher.
    EntriesModule,
    // DynamicEndpointsModule registers a catch-all controller — keep last.
    DynamicEndpointsModule,
  ],
})
export class AppModule {}
