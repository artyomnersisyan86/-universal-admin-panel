import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FormSchemaEntity } from './form-schema.entity';
import { UpsertFormSchemaDto } from './dto/upsert-form-schema.dto';

@Injectable()
export class FormSchemasService {
  constructor(
    @InjectRepository(FormSchemaEntity)
    private readonly repo: Repository<FormSchemaEntity>,
  ) {}

  list() {
    return this.repo.find({ order: { updatedAt: 'DESC' } });
  }

  async findOne(id: string) {
    const fs = await this.repo.findOne({ where: { id } });
    if (!fs) throw new NotFoundException({ errors: { id: 'notFound' } });
    return fs;
  }

  create(dto: UpsertFormSchemaDto, createdBy?: string) {
    return this.repo.save(this.repo.create({ ...dto, createdBy }));
  }

  async update(id: string, dto: UpsertFormSchemaDto) {
    const fs = await this.findOne(id);
    Object.assign(fs, dto);
    return this.repo.save(fs);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.repo.delete({ id });
  }
}
