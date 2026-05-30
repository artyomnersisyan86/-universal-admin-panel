import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/user-role.enum';
import { SectionsService } from '../sections/sections.service';
import { EntriesService } from '../entries/entries.service';
import { EntryStatus } from '../entries/entry-status.enum';

type Multilingual = { hy: string; ru: string; en: string };

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly users: UsersService,
    private readonly cfg: ConfigService,
    private readonly sections: SectionsService,
    private readonly entries: EntriesService,
  ) {}

  async onModuleInit() {
    const superadminId = await this.seedSuperadmin();
    await this.seedDemoContent(superadminId);
  }

  // -------------------------------------------------------------------------

  private async seedSuperadmin(): Promise<string | undefined> {
    const email = this.cfg.get<string>('SEED_SUPERADMIN_EMAIL');
    const password = this.cfg.get<string>('SEED_SUPERADMIN_PASSWORD');
    if (!email || !password) return undefined;

    const existing = await this.users.findByEmail(email).catch(() => null);
    if (existing) return existing.id;

    const created = await this.users.create({
      email,
      password,
      role: UserRole.SUPERADMIN,
    });
    this.logger.log(`Seeded superadmin: ${email}`);
    return created.id;
  }

  /**
   * Seed two demonstrative sections (with published entries) so a fresh install
   * has something to look at: `news` shows typography + flex row + richtext +
   * image; `products` adds a switch and a per-entry slider. Runs only when no
   * sections exist yet, so it never overwrites real content.
   */
  private async seedDemoContent(createdBy?: string): Promise<void> {
    if (!this.demoSeedEnabled()) return;

    const existing = await this.sections.list();
    if (existing.length > 0) return;

    await this.seedNews(createdBy);
    await this.seedProducts(createdBy);
    this.logger.log('Seeded demo sections: news, products');
  }

  /**
   * Demo content is for hands-on/visual exploration: enabled in dev by default,
   * off in tests and production. `SEED_DEMO_CONTENT=true|false` overrides.
   */
  private demoSeedEnabled(): boolean {
    const flag = this.cfg.get<string>('SEED_DEMO_CONTENT');
    if (flag !== undefined) return flag === 'true' || flag === '1';
    const env = process.env.NODE_ENV;
    return env !== 'production' && env !== 'test';
  }

  private async seedNews(createdBy?: string): Promise<void> {
    const titleField = fieldNode('title', 'text', ml('Վերնագիր', 'Заголовок', 'Title'), {
      multilingual: true,
      required: true,
      width: '50%',
    });
    const authorField = fieldNode('author', 'text', ml('Հեղինակ', 'Автор', 'Author'), {
      width: '50%',
    });
    const bodyField = fieldNode('body', 'richtext', ml('Տեքստ', 'Текст', 'Body'), {});
    const coverField = fieldNode('cover', 'image', ml('Շապիկ', 'Обложка', 'Cover'), {});

    const layout = {
      version: 1,
      root: [
        typographyNode('h1', ml('Նորություններ', 'Новости', 'Latest news'), true),
        containerRow([titleField, authorField]),
        bodyField,
        coverField,
      ],
    };

    const section = await this.sections.create(
      {
        slug: 'news',
        name: ml('Նորություններ', 'Новости', 'News'),
        layout,
        isPublic: true,
        displayOrder: 1,
        icon: '📰',
      },
      createdBy,
    );

    await this.entries.create(
      section.id,
      {
        status: EntryStatus.PUBLISHED,
        data: {
          title: ml(
            'Հարթակը գործարկված է',
            'Платформа запущена',
            'The platform is live',
          ),
          author: 'Artyom',
          body: '<p>The block-based content builder now ships a REST API for every section.</p>',
          cover: 'https://picsum.photos/seed/news1/800/400',
        },
      },
      createdBy,
    );

    await this.entries.create(
      section.id,
      {
        status: EntryStatus.PUBLISHED,
        data: {
          title: ml('Երկրորդ գրառում', 'Вторая запись', 'Second post'),
          author: 'Team',
          body: '<p>Drag blocks, fill data, hit publish — done.</p>',
          cover: 'https://picsum.photos/seed/news2/800/400',
        },
      },
      createdBy,
    );
  }

  private async seedProducts(createdBy?: string): Promise<void> {
    const nameField = fieldNode('name', 'text', ml('Անվանում', 'Название', 'Name'), {
      multilingual: true,
      required: true,
    });
    const priceField = fieldNode('price', 'text', ml('Գին', 'Цена', 'Price'), {});
    const stockField = fieldNode('inStock', 'switch', ml('Առկա է', 'В наличии', 'In stock'), {});
    const gallery = sliderNode();

    const layout = {
      version: 1,
      root: [
        typographyNode('h2', ml('Ապրանք', 'Товар', 'Product'), true),
        containerRow([nameField, priceField]),
        stockField,
        gallery,
      ],
    };

    const section = await this.sections.create(
      {
        slug: 'products',
        name: ml('Ապրանքներ', 'Товары', 'Products'),
        layout,
        isPublic: true,
        displayOrder: 2,
        icon: '🛍',
      },
      createdBy,
    );

    await this.entries.create(
      section.id,
      {
        status: EntryStatus.PUBLISHED,
        data: {
          name: ml('Դասական շապիկ', 'Классическая футболка', 'Classic T-Shirt'),
          price: '$29',
          inStock: true,
          // Slider content is per-entry, keyed by the slider block id.
          [gallery.id]: [
            {
              id: randomUUID(),
              title: 'Front',
              image: { desktop: 'https://picsum.photos/seed/prod-a/900/500' },
            },
            {
              id: randomUUID(),
              title: 'Back',
              image: { desktop: 'https://picsum.photos/seed/prod-b/900/500' },
            },
          ],
        },
      },
      createdBy,
    );

    await this.entries.create(
      section.id,
      {
        status: EntryStatus.DRAFT,
        data: {
          name: ml('Գլխարկ', 'Кепка', 'Cap'),
          price: '$15',
          inStock: false,
          [gallery.id]: [],
        },
      },
      createdBy,
    );
  }
}

// ---------------------------------------------------------------------------
// Tiny block/layout builders — mirror the client `BlockNode` shapes. Kept local
// to the seed so the server has no dependency on client types.
// ---------------------------------------------------------------------------

function ml(hy: string, ru: string, en: string): Multilingual {
  return { hy, ru, en };
}

function typographyNode(variant: string, text: Multilingual, multilingual: boolean) {
  return {
    id: randomUUID(),
    type: 'typography' as const,
    props: { variant, text, multilingual },
  };
}

interface FieldOpts {
  multilingual?: boolean;
  required?: boolean;
  width?: '100%' | '50%' | '33%' | 'auto';
}

function fieldNode(name: string, type: string, label: Multilingual, opts: FieldOpts) {
  return {
    id: randomUUID(),
    type: 'field' as const,
    props: {
      field: {
        id: randomUUID(),
        type,
        name,
        // Field labels are plain strings in the layout; English is used here.
        label: label.en,
        required: opts.required ?? false,
        multilingual: opts.multilingual ?? false,
      },
      ...(opts.width ? { width: opts.width } : {}),
    },
  };
}

function containerRow(children: unknown[]) {
  return {
    id: randomUUID(),
    type: 'container' as const,
    props: { layout: { direction: 'row', gap: 'var(--space-3)', wrap: 'wrap' } },
    children,
  };
}

function sliderNode() {
  return {
    id: randomUUID(),
    type: 'slider' as const,
    props: { slides: [] },
  };
}
