import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { SectionsService } from './sections.service';
import { SectionEntity } from './section.entity';
import { EntryEntity } from '../entries/entry.entity';

type MockRepo<T extends object> = {
  find: jest.Mock;
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  delete: jest.Mock;
  __store: Map<string, T>;
};

function mockRepo<T extends { id: string }>(): MockRepo<T> {
  const store = new Map<string, T>();
  return {
    __store: store,
    find: jest.fn(async ({ order: _order }: { order?: unknown } = {}) =>
      Array.from(store.values()),
    ),
    findOne: jest.fn(async ({ where }: { where: Partial<T> }) => {
      for (const v of store.values()) {
        if (Object.entries(where).every(([k, val]) => (v as Record<string, unknown>)[k] === val)) {
          return v;
        }
      }
      return null;
    }),
    create: jest.fn((data: Partial<T>) => ({ ...data }) as T),
    save: jest.fn(async (data: T) => {
      const id = data.id ?? `id-${store.size + 1}`;
      const persisted = { ...data, id } as T;
      store.set(id, persisted);
      return persisted;
    }),
    delete: jest.fn(async (where: Partial<T>) => {
      let removed = 0;
      for (const [k, v] of store) {
        if (Object.entries(where).every(([key, val]) => (v as Record<string, unknown>)[key] === val)) {
          store.delete(k);
          removed += 1;
        }
      }
      return { affected: removed };
    }),
  };
}

describe('SectionsService', () => {
  let svc: SectionsService;
  let sectionsRepo: MockRepo<SectionEntity>;
  let entriesRepo: MockRepo<EntryEntity>;

  beforeEach(async () => {
    sectionsRepo = mockRepo<SectionEntity>();
    entriesRepo = mockRepo<EntryEntity>();
    const moduleRef = await Test.createTestingModule({
      providers: [
        SectionsService,
        { provide: getRepositoryToken(SectionEntity), useValue: sectionsRepo },
        { provide: getRepositoryToken(EntryEntity), useValue: entriesRepo },
      ],
    }).compile();
    svc = moduleRef.get(SectionsService);
  });

  const baseDto = {
    slug: 'news',
    name: { hy: 'Նորություններ', ru: 'Новости', en: 'News' },
    layout: { blocks: [] as unknown[] },
  };

  it('creates a section with sane defaults', async () => {
    const created = await svc.create(baseDto, 'user-1');
    expect(created.slug).toBe('news');
    expect(created.isPublic).toBe(true);
    expect(created.displayOrder).toBe(0);
    expect(created.createdBy).toBe('user-1');
    expect(created.icon).toBeNull();
  });

  it('rejects an invalid slug shape', async () => {
    await expect(svc.create({ ...baseDto, slug: 'Bad Slug' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects a reserved slug', async () => {
    await expect(svc.create({ ...baseDto, slug: 'users' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects duplicate slugs', async () => {
    await svc.create(baseDto);
    await expect(svc.create(baseDto)).rejects.toBeInstanceOf(ConflictException);
  });

  it('preserves layout on partial update', async () => {
    const created = await svc.create(baseDto);
    const layout = created.layout;
    const updated = await svc.update(created.id, { displayOrder: 5 });
    expect(updated.layout).toEqual(layout);
    expect(updated.displayOrder).toBe(5);
  });

  it('rejects update to a slug that is already taken by another section', async () => {
    await svc.create(baseDto);
    const other = await svc.create({ ...baseDto, slug: 'products' });
    await expect(svc.update(other.id, { slug: 'news' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('allows update keeping the same slug', async () => {
    const created = await svc.create(baseDto);
    const updated = await svc.update(created.id, { slug: 'news' });
    expect(updated.slug).toBe('news');
  });

  it('findOne throws NotFound for missing id', async () => {
    await expect(svc.findOne('missing-id')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('remove cascades to entries for that section', async () => {
    const section = await svc.create(baseDto);
    entriesRepo.__store.set('e1', { id: 'e1', sectionId: section.id } as EntryEntity);
    entriesRepo.__store.set('e2', { id: 'e2', sectionId: 'other-section' } as EntryEntity);

    await svc.remove(section.id);

    expect(sectionsRepo.__store.has(section.id)).toBe(false);
    expect(entriesRepo.__store.has('e1')).toBe(false);
    expect(entriesRepo.__store.has('e2')).toBe(true);
  });
});
