import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntryEntity } from './entry.entity';
import { EntriesService } from './entries.service';
import { EntriesController } from './entries.controller';
import { SectionEntriesController } from './section-entries.controller';
import { SectionsModule } from '../sections/sections.module';

@Module({
  imports: [TypeOrmModule.forFeature([EntryEntity]), SectionsModule],
  providers: [EntriesService],
  controllers: [EntriesController, SectionEntriesController],
  exports: [EntriesService],
})
export class EntriesModule {}
