import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LayoutTemplateEntity } from './layout-template.entity';
import { LayoutTemplatesService } from './layout-templates.service';
import { LayoutTemplatesController } from './layout-templates.controller';
import { SectionsModule } from '../sections/sections.module';

@Module({
  imports: [TypeOrmModule.forFeature([LayoutTemplateEntity]), SectionsModule],
  providers: [LayoutTemplatesService],
  controllers: [LayoutTemplatesController],
})
export class LayoutTemplatesModule {}
