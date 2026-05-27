import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DashboardWidgetEntity } from './dashboard-widget.entity';
import { UpsertWidgetDto } from './dto/upsert-widget.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(DashboardWidgetEntity)
    private readonly repo: Repository<DashboardWidgetEntity>,
  ) {}

  list() {
    return this.repo.find({ order: { order: 'ASC' } });
  }

  async findOne(id: string) {
    const w = await this.repo.findOne({ where: { id } });
    if (!w) throw new NotFoundException({ errors: { id: 'notFound' } });
    return w;
  }

  async create(dto: UpsertWidgetDto) {
    const max = (await this.repo.maximum('order')) ?? 0;
    return this.repo.save(this.repo.create({ ...dto, order: max + 1 }));
  }

  async update(id: string, dto: UpsertWidgetDto) {
    const w = await this.findOne(id);
    Object.assign(w, dto);
    return this.repo.save(w);
  }

  async reorder(ids: string[]) {
    await Promise.all(ids.map((id, idx) => this.repo.update({ id }, { order: idx })));
    return { ok: true };
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.repo.delete({ id });
  }
}
