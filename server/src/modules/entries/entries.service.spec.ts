import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { EntriesService } from './entries.service';
import { EntryEntity } from './entry.entity';
import { EntryStatus } from './entry-status.enum';
import { SectionEntity } from '../sections/section.entity';

function makeMockRepo() {
  const store = new Map<string, EntryEntity>();
  let counter = 0;
  return {
    __store: store,
    find: jest.fn(async ({ where, order: _order }: { where?: Partial<EntryEntity>; order?: unknown } = {}) => {
      const items = Array.from(store.values());
      if (!where) return items;
      return items.filter((e) =>
        Object.entries(where).every(([k, v]) => (e as unknown as Record<string, unknown>)[k] === v),
      );
    }),
    findOne: jest.fn(async ({ where }: { where: Partial<EntryEntity> }) => {
      for (const v of store.values()) {
        if (
          Object.entries(where).every(
            ([k, val]) => (v as unknown as Record<string, unknown>)[k] === val,
          )
        ) {
          return v;
        }
      }
      return null;
    }),
    create: jest.fn((data: Partial<EntryEntity>) => ({ ...data }) as EntryEntity),
    save: jest.fn(async (data: EntryEntity) => {
      counter += 1;
      const id = data.id ?? `entry-${counter}`;
      const now = new Date('2026-01-01T00:00:00Z');
      const persisted: EntryEntity = {
        ...data,
        id,
        createdAt: data.createdAt ?? now,
        updatedAt: now,
      } as EntryEntity;
      store.set(id, persisted);
      return persisted;
    }),
    delete: jest.fn(async (where: Partial<EntryEntity>) => {
      let removed = 0;
      for (const [k, v] of store) {
        if (
          Object.entries(where).every(
            ([key, val]) => (v as unknown as Record<string, unknown>)[key] === val,
          )
        ) {
          store.delete(k);
          removed += 1;
        }
      }
      return { affected: removed };
    }),
  };
}

const sampleSection: SectionEntity = {
  id: 'sec-1',
  slug: 'news',
  name: { hy: 'Նոր', ru: 'Нов', en: 'News' },
  layout: { blocks: [] },
  isPublic: true,
  displayOrder: 0,
  icon: null,
  createdBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('EntriesService', () => {
  let svc: EntriesService;
  let repo: ReturnType<typeof makeMockRepo>;

  beforeEach(async () => {
    repo = makeMockRepo();
    const moduleRef = await Test.createTestingModule({
      providers: [
        EntriesService,
        { provide: getRepositoryToken(EntryEntity), useValue: repo },
      ],
    }).compile();
    svc = moduleRef.get(EntriesService);
  });

  it('defaults new entries to draft and leaves publishedAt null', async () => {
    const e = await svc.create('sec-1', { data: { title: 'x' } }, 'user-1');
    expect(e.status).toBe(EntryStatus.DRAFT);
    expect(e.publishedAt).toBeNull();
    expect(e.createdBy).toBe('user-1');
  });

  it('sets publishedAt when explicitly created as published', async () => {
    const e = await svc.create('sec-1', {
      data: {},
      status: EntryStatus.PUBLISHED,
    });
    expect(e.status).toBe(EntryStatus.PUBLISHED);
    expect(e.publishedAt).toBeInstanceOf(Date);
  });

  it('publish() transitions draft → published once and is idempotent', async () => {
    const created = await svc.create('sec-1', { data: {} });
    const published = await svc.publish('sec-1', created.id);
    expect(published.status).toBe(EntryStatus.PUBLISHED);
    expect(published.publishedAt).toBeInstanceOf(Date);

    const firstStamp = published.publishedAt!.getTime();
    const second = await svc.publish('sec-1', created.id);
    expect(second.publishedAt!.getTime()).toBe(firstStamp);
  });

  it('update() can promote draft to published and stamps publishedAt', async () => {
    const created = await svc.create('sec-1', { data: {} });
    const updated = await svc.update('sec-1', created.id, {
      status: EntryStatus.PUBLISHED,
    });
    expect(updated.status).toBe(EntryStatus.PUBLISHED);
    expect(updated.publishedAt).toBeInstanceOf(Date);
  });

  it('findOneInSection refuses entries belonging to another section', async () => {
    const a = await svc.create('sec-1', { data: {} });
    await expect(svc.findOneInSection('sec-OTHER', a.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('list() filters by sectionId and status', async () => {
    await svc.create('sec-1', { data: { n: 1 } });
    await svc.create('sec-1', { data: { n: 2 }, status: EntryStatus.PUBLISHED });
    await svc.create('sec-2', { data: { n: 3 }, status: EntryStatus.PUBLISHED });

    const published1 = await svc.list({ sectionId: 'sec-1', status: EntryStatus.PUBLISHED });
    expect(published1).toHaveLength(1);
    expect((published1[0].data as { n: number }).n).toBe(2);
  });

  it('serialize() applies the requested locale to multilingual fields', async () => {
    const e = await svc.create('sec-1', {
      data: { title: { hy: 'A', ru: 'B', en: 'C' }, slug: 'plain' },
    });
    const serialized = svc.serialize(e, sampleSection, 'ru');
    expect(serialized.sectionSlug).toBe('news');
    expect(serialized.data).toEqual({ title: 'B', slug: 'plain' });
  });

  it('serialize() without lang returns multilingual values verbatim', async () => {
    const e = await svc.create('sec-1', {
      data: { title: { hy: 'A', ru: 'B', en: 'C' } },
    });
    const serialized = svc.serialize(e, sampleSection);
    expect(serialized.data).toEqual({ title: { hy: 'A', ru: 'B', en: 'C' } });
  });

  it('removeBySection wipes only that section\'s entries', async () => {
    await svc.create('sec-1', { data: {} });
    await svc.create('sec-1', { data: {} });
    await svc.create('sec-2', { data: {} });
    await svc.removeBySection('sec-1');
    const remaining = await svc.list();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].sectionId).toBe('sec-2');
  });
});
