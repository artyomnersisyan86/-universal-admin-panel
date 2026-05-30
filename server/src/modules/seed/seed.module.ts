import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { SectionsModule } from '../sections/sections.module';
import { EntriesModule } from '../entries/entries.module';
import { SeedService } from './seed.service';

@Module({
  imports: [UsersModule, SectionsModule, EntriesModule],
  providers: [SeedService],
})
export class SeedModule {}
