import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SectionEntity } from './section.entity';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { RESERVED_SLUGS, SLUG_PATTERN } from './reserved-slugs.const';
import { EntryEntity } from '../entries/entry.entity';

@Injectable()
export class SectionsService {
  constructor(
    @InjectRepository(SectionEntity)
    private readonly repo: Repository<SectionEntity>,
    @InjectRepository(EntryEntity)
    private readonly entriesRepo: Repository<EntryEntity>,
  ) {}

  list() {
    return this.repo.find({ order: { displayOrder: 'ASC', createdAt: 'ASC' } });
  }

  async findOne(id: string): Promise<SectionEntity> {
    const section = await this.repo.findOne({ where: { id } });
    if (!section) throw new NotFoundException({ errors: { id: 'notFound' } });
    return section;
  }

  async findBySlug(slug: string): Promise<SectionEntity | null> {
    return this.repo.findOne({ where: { slug } });
  }

  async create(dto: CreateSectionDto, createdBy?: string): Promise<SectionEntity> {
    this.assertSlugValid(dto.slug);
    const existing = await this.repo.findOne({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException({ errors: { slug: 'alreadyExists' } });
    }

    const section = this.repo.create({
      slug: dto.slug,
      name: dto.name,
      layout: dto.layout,
      isPublic: dto.isPublic ?? true,
      displayOrder: dto.displayOrder ?? 0,
      icon: dto.icon ?? null,
      createdBy: createdBy ?? null,
    });
    return this.repo.save(section);
  }

  async update(id: string, dto: UpdateSectionDto): Promise<SectionEntity> {
    const section = await this.findOne(id);

    if (dto.slug !== undefined && dto.slug !== section.slug) {
      this.assertSlugValid(dto.slug);
      const taken = await this.repo.findOne({ where: { slug: dto.slug } });
      if (taken && taken.id !== id) {
        throw new ConflictException({ errors: { slug: 'alreadyExists' } });
      }
      section.slug = dto.slug;
    }
    if (dto.name !== undefined) section.name = dto.name;
    if (dto.layout !== undefined) section.layout = dto.layout;
    if (dto.isPublic !== undefined) section.isPublic = dto.isPublic;
    if (dto.displayOrder !== undefined) section.displayOrder = dto.displayOrder;
    if (dto.icon !== undefined) section.icon = dto.icon;

    return this.repo.save(section);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.entriesRepo.delete({ sectionId: id });
    await this.repo.delete({ id });
  }

  private assertSlugValid(slug: string): void {
    if (!SLUG_PATTERN.test(slug)) {
      throw new BadRequestException({ errors: { slug: 'invalidSlug' } });
    }
    if (RESERVED_SLUGS.has(slug)) {
      throw new ConflictException({ errors: { slug: 'reserved' } });
    }
  }
}
