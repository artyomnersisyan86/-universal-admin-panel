import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EntryEntity } from './entry.entity';
import { EntryStatus } from './entry-status.enum';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { SectionEntity } from '../sections/section.entity';
import { localize, type Locale } from './localize';

export interface ListEntriesFilter {
  sectionId?: string;
  status?: EntryStatus;
}

export interface SerializedEntry {
  id: string;
  sectionId: string;
  sectionSlug: string;
  status: EntryStatus;
  data: unknown;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class EntriesService {
  constructor(
    @InjectRepository(EntryEntity)
    private readonly repo: Repository<EntryEntity>,
  ) {}

  list(filter: ListEntriesFilter = {}): Promise<EntryEntity[]> {
    const where: Partial<Pick<EntryEntity, 'sectionId' | 'status'>> = {};
    if (filter.sectionId) where.sectionId = filter.sectionId;
    if (filter.status) where.status = filter.status;
    return this.repo.find({ where, order: { displayOrder: 'ASC', createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<EntryEntity> {
    const entry = await this.repo.findOne({ where: { id } });
    if (!entry) throw new NotFoundException({ errors: { id: 'notFound' } });
    return entry;
  }

  async findOneInSection(sectionId: string, id: string): Promise<EntryEntity> {
    const entry = await this.repo.findOne({ where: { id, sectionId } });
    if (!entry) throw new NotFoundException({ errors: { id: 'notFound' } });
    return entry;
  }

  create(sectionId: string, dto: CreateEntryDto, createdBy?: string): Promise<EntryEntity> {
    const status = dto.status ?? EntryStatus.DRAFT;
    const entry = this.repo.create({
      sectionId,
      status,
      data: dto.data,
      publishedAt: status === EntryStatus.PUBLISHED ? new Date() : null,
      createdBy: createdBy ?? null,
    });
    return this.repo.save(entry);
  }

  async update(sectionId: string, id: string, dto: UpdateEntryDto): Promise<EntryEntity> {
    const entry = await this.findOneInSection(sectionId, id);

    if (dto.data !== undefined) entry.data = dto.data;
    if (dto.status !== undefined) {
      const movingToPublished =
        dto.status === EntryStatus.PUBLISHED && entry.status !== EntryStatus.PUBLISHED;
      entry.status = dto.status;
      if (movingToPublished && !entry.publishedAt) {
        entry.publishedAt = new Date();
      }
    }
    return this.repo.save(entry);
  }

  async publish(sectionId: string, id: string): Promise<EntryEntity> {
    const entry = await this.findOneInSection(sectionId, id);
    if (entry.status !== EntryStatus.PUBLISHED) {
      entry.status = EntryStatus.PUBLISHED;
      if (!entry.publishedAt) entry.publishedAt = new Date();
    }
    return this.repo.save(entry);
  }

  async remove(sectionId: string, id: string): Promise<void> {
    await this.findOneInSection(sectionId, id);
    await this.repo.delete({ id, sectionId });
  }

  async removeBySection(sectionId: string): Promise<void> {
    await this.repo.delete({ sectionId });
  }

  async reorder(sectionId: string, orderedIds: string[]): Promise<void> {
    const existing = await this.repo.find({
      where: { sectionId, id: In(orderedIds) },
      select: ['id'],
    });
    if (existing.length !== orderedIds.length) {
      throw new BadRequestException({ errors: { ids: 'someIdsNotFound' } });
    }
    await Promise.all(
      orderedIds.map((id, index) =>
        this.repo.update({ id, sectionId }, { displayOrder: index }),
      ),
    );
  }

  serialize(entry: EntryEntity, section: SectionEntity, lang?: Locale): SerializedEntry {
    const data = lang ? localize(entry.data, lang) : entry.data;
    return {
      id: entry.id,
      sectionId: entry.sectionId,
      sectionSlug: section.slug,
      status: entry.status,
      data,
      publishedAt: entry.publishedAt ?? null,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }
}
