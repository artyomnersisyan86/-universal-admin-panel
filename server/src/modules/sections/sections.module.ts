import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SectionEntity } from './section.entity';
import { SectionsService } from './sections.service';
import { SectionsController } from './sections.controller';
import { EntryEntity } from '../entries/entry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SectionEntity, EntryEntity])],
  providers: [SectionsService],
  controllers: [SectionsController],
  exports: [SectionsService],
})
export class SectionsModule {}
