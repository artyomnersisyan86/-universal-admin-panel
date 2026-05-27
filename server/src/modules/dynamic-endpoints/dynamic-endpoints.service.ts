import { ConflictException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DynamicEndpointEntity } from './dynamic-endpoint.entity';
import { UpsertEndpointDto } from './dto/upsert-endpoint.dto';

interface DbQueryConfig {
  table: string;
  columns?: string[];
  where?: Record<string, string | number | boolean>;
  limit?: number;
  orderBy?: string;
  direction?: 'asc' | 'desc';
}

@Injectable()
export class DynamicEndpointsService implements OnModuleInit {
  /** In-memory cache: "METHOD:/path" → entity */
  private cache = new Map<string, DynamicEndpointEntity>();

  constructor(
    @InjectRepository(DynamicEndpointEntity)
    private readonly repo: Repository<DynamicEndpointEntity>,
    private readonly ds: DataSource,
  ) {}

  async onModuleInit() {
    await this.refreshCache();
  }

  private cacheKey(method: string, p: string) {
    return `${method.toUpperCase()}:${p}`;
  }

  async refreshCache() {
    const all = await this.repo.find();
    this.cache.clear();
    for (const ep of all) {
      if (!ep.enabled) continue;
      this.cache.set(this.cacheKey(ep.method, ep.path), ep);
    }
  }

  match(method: string, path: string): DynamicEndpointEntity | undefined {
    return this.cache.get(this.cacheKey(method, path));
  }

  async list() {
    return this.repo.find({ order: { updatedAt: 'DESC' } });
  }

  async findOne(id: string) {
    const ep = await this.repo.findOne({ where: { id } });
    if (!ep) throw new NotFoundException({ errors: { id: 'notFound' } });
    return ep;
  }

  async create(dto: UpsertEndpointDto, createdBy?: string) {
    const dup = await this.repo.findOne({
      where: { method: dto.method, path: dto.path },
    });
    if (dup) throw new ConflictException({ errors: { path: 'alreadyExists' } });
    const ep = this.repo.create({ ...dto, enabled: dto.enabled ?? true, createdBy });
    const saved = await this.repo.save(ep);
    await this.refreshCache();
    return saved;
  }

  async update(id: string, dto: UpsertEndpointDto) {
    const ep = await this.findOne(id);
    Object.assign(ep, dto);
    const saved = await this.repo.save(ep);
    await this.refreshCache();
    return saved;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.repo.delete({ id });
    await this.refreshCache();
  }

  // ---- DB query mode ----
  async runDbQuery(config: unknown): Promise<unknown> {
    if (!config || typeof config !== 'object') return null;
    const cfg = config as DbQueryConfig;
    if (!cfg.table || !this.isSafeIdent(cfg.table)) {
      throw new Error('invalidTable');
    }
    const cols = (cfg.columns ?? ['*']).filter((c) => c === '*' || this.isSafeIdent(c));
    const colsSql = cols.length === 0 ? '*' : cols.map(this.q).join(', ');
    const params: unknown[] = [];
    const whereSqlParts: string[] = [];

    const isPostgres = this.ds.options.type === 'postgres';
    const placeholder = (i: number) => (isPostgres ? `$${i}` : '?');

    if (cfg.where) {
      for (const [k, v] of Object.entries(cfg.where)) {
        if (!this.isSafeIdent(k)) continue;
        params.push(v);
        whereSqlParts.push(`${this.q(k)} = ${placeholder(params.length)}`);
      }
    }

    const whereSql = whereSqlParts.length ? `WHERE ${whereSqlParts.join(' AND ')}` : '';
    const orderSql =
      cfg.orderBy && this.isSafeIdent(cfg.orderBy)
        ? `ORDER BY ${this.q(cfg.orderBy)} ${cfg.direction === 'desc' ? 'DESC' : 'ASC'}`
        : '';
    const limit = Math.min(Math.max(Number(cfg.limit ?? 100), 1), 1000);
    const sql = `SELECT ${colsSql} FROM ${this.q(cfg.table)} ${whereSql} ${orderSql} LIMIT ${limit}`;

    return this.ds.query(sql, params);
  }

  private isSafeIdent(s: string): boolean {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s);
  }

  private q(ident: string): string {
    return `"${ident.replace(/"/g, '""')}"`;
  }
}
