import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TableDefinitionEntity } from './table-definition.entity';
import { TableRowEntity } from './table-row.entity';
import { ReorderRowsDto, UpsertRowDto, UpsertTableDto } from './dto/upsert-table.dto';

@Injectable()
export class TablesService {
  constructor(
    @InjectRepository(TableDefinitionEntity)
    private readonly tables: Repository<TableDefinitionEntity>,
    @InjectRepository(TableRowEntity)
    private readonly rows: Repository<TableRowEntity>,
  ) {}

  // ---- table definitions ----
  listTables() {
    return this.tables.find({ order: { updatedAt: 'DESC' } });
  }

  async getTable(id: string) {
    const t = await this.tables.findOne({ where: { id } });
    if (!t) throw new NotFoundException({ errors: { id: 'notFound' } });
    return t;
  }

  createTable(dto: UpsertTableDto) {
    return this.tables.save(this.tables.create(dto));
  }

  async updateTable(id: string, dto: UpsertTableDto) {
    const t = await this.getTable(id);
    Object.assign(t, dto);
    return this.tables.save(t);
  }

  async removeTable(id: string) {
    await this.getTable(id);
    await this.rows.delete({ tableId: id });
    await this.tables.delete({ id });
  }

  // ---- rows ----
  async listRows(tableId: string, page = 1, limit = 25, q?: string, sort?: string) {
    await this.getTable(tableId);
    const qb = this.rows
      .createQueryBuilder('r')
      .where('r.table_id = :tableId', { tableId });

    if (q) {
      // `data` is stored as JSON text (simple-json) → substring match works cross-DB.
      qb.andWhere('LOWER(r.data) LIKE LOWER(:q)', { q: `%${q}%` });
    }

    // Default order: row position. Field-level sort happens after fetch
    // (cross-DB JSON path access is non-trivial; sort full page in JS).
    qb.orderBy('r.order_index', 'ASC');

    qb.skip((page - 1) * limit).take(limit);
    // eslint-disable-next-line prefer-const
    let [items, total] = await qb.getManyAndCount();

    if (sort) {
      const [field, dirRaw] = sort.split(':');
      const dir = dirRaw?.toLowerCase() === 'desc' ? -1 : 1;
      items = [...items].sort((a, b) => {
        const av = String(a.data?.[field] ?? '');
        const bv = String(b.data?.[field] ?? '');
        return av.localeCompare(bv) * dir;
      });
    }

    return { items, total, page, limit };
  }

  async addRow(tableId: string, dto: UpsertRowDto) {
    await this.getTable(tableId);
    const max = await this.rows.maximum('order', { tableId });
    return this.rows.save(
      this.rows.create({ tableId, data: dto.data, order: (max ?? 0) + 1 }),
    );
  }

  async updateRow(rowId: string, dto: UpsertRowDto) {
    const r = await this.rows.findOne({ where: { id: rowId } });
    if (!r) throw new NotFoundException({ errors: { id: 'notFound' } });
    r.data = dto.data;
    return this.rows.save(r);
  }

  async removeRow(rowId: string) {
    const r = await this.rows.findOne({ where: { id: rowId } });
    if (!r) throw new NotFoundException({ errors: { id: 'notFound' } });
    await this.rows.delete({ id: rowId });
  }

  async reorderRows(tableId: string, dto: ReorderRowsDto) {
    await this.getTable(tableId);
    await Promise.all(
      dto.ids.map((id, idx) =>
        this.rows.update({ id, tableId }, { order: idx }),
      ),
    );
    return { ok: true };
  }
}
