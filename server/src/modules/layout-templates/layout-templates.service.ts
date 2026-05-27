import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LayoutTemplateEntity } from './layout-template.entity';
import { CreateLayoutTemplateDto } from './dto/create-layout-template.dto';
import { UpdateLayoutTemplateDto } from './dto/update-layout-template.dto';
import { CreateFromSectionDto } from './dto/create-from-section.dto';
import { SectionsService } from '../sections/sections.service';

@Injectable()
export class LayoutTemplatesService {
  constructor(
    @InjectRepository(LayoutTemplateEntity)
    private readonly repo: Repository<LayoutTemplateEntity>,
    private readonly sections: SectionsService,
  ) {}

  list() {
    return this.repo.find({ order: { updatedAt: 'DESC' } });
  }

  async findOne(id: string): Promise<LayoutTemplateEntity> {
    const tpl = await this.repo.findOne({ where: { id } });
    if (!tpl) throw new NotFoundException({ errors: { id: 'notFound' } });
    return tpl;
  }

  create(
    dto: CreateLayoutTemplateDto,
    createdBy?: string,
  ): Promise<LayoutTemplateEntity> {
    return this.repo.save(
      this.repo.create({
        name: dto.name,
        description: dto.description ?? null,
        layout: dto.layout,
        createdBy: createdBy ?? null,
      }),
    );
  }

  async createFromSection(
    dto: CreateFromSectionDto,
    createdBy?: string,
  ): Promise<LayoutTemplateEntity> {
    const section = await this.sections.findOne(dto.sectionId);
    return this.repo.save(
      this.repo.create({
        name: dto.name,
        description: dto.description ?? null,
        layout: section.layout,
        createdBy: createdBy ?? null,
      }),
    );
  }

  async update(
    id: string,
    dto: UpdateLayoutTemplateDto,
  ): Promise<LayoutTemplateEntity> {
    const tpl = await this.findOne(id);
    if (dto.name !== undefined) tpl.name = dto.name;
    if (dto.description !== undefined) tpl.description = dto.description;
    if (dto.layout !== undefined) tpl.layout = dto.layout;
    return this.repo.save(tpl);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repo.delete({ id });
  }
}
