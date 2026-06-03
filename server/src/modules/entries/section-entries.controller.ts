import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { UserRole } from '../users/user-role.enum';
import { SectionsService } from '../sections/sections.service';
import { SectionEntity } from '../sections/section.entity';
import { EntriesService, SerializedEntry } from './entries.service';
import { EntryStatus } from './entry-status.enum';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { ReorderEntriesDto } from './dto/reorder-entries.dto';
import { isLocale, type Locale } from './localize';

/**
 * Universal CRUD dispatcher exposing every section as `/api/:sectionSlug`.
 *
 * Public GETs honour `section.isPublic`; mutations always require JWT + admin.
 * Reserved slugs (auth, users, sections, …) are blocked at section-create time
 * by SectionsService, so a `:sectionSlug` lookup is safe to attempt.
 *
 * IMPORTANT: this controller must be registered AFTER all static `/api/*`
 * controllers in AppModule.imports but BEFORE the DynamicEndpoints catch-all.
 */
@Controller(':sectionSlug')
export class SectionEntriesController {
  constructor(
    private readonly sections: SectionsService,
    private readonly entries: EntriesService,
  ) {}

  // ---------- public/admin reads ----------

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  async list(
    @Param('sectionSlug') slug: string,
    @CurrentUser() user: User | undefined,
    @Query('lang') langParam?: string,
    @Query('status') statusParam?: string,
  ): Promise<SerializedEntry[]> {
    const section = await this.resolveSectionForRead(slug, user);
    const lang = this.parseLang(langParam);
    const isAdmin = this.isAdmin(user);

    const filter: { sectionId: string; status?: EntryStatus } = {
      sectionId: section.id,
    };
    if (isAdmin) {
      if (statusParam) {
        if (!this.isEntryStatus(statusParam)) {
          throw new BadRequestException({ errors: { status: 'invalidStatus' } });
        }
        filter.status = statusParam;
      }
    } else {
      filter.status = EntryStatus.PUBLISHED;
    }

    const items = await this.entries.list(filter);
    return items.map((e) => this.entries.serialize(e, section, lang));
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':entryId')
  async getOne(
    @Param('sectionSlug') slug: string,
    @Param('entryId', new ParseUUIDPipe()) entryId: string,
    @CurrentUser() user: User | undefined,
    @Query('lang') langParam?: string,
  ): Promise<SerializedEntry> {
    const section = await this.resolveSectionForRead(slug, user);
    const lang = this.parseLang(langParam);
    const entry = await this.entries.findOneInSection(section.id, entryId);
    if (!this.isAdmin(user) && entry.status !== EntryStatus.PUBLISHED) {
      throw new NotFoundException({ errors: { id: 'notFound' } });
    }
    return this.entries.serialize(entry, section, lang);
  }

  // ---------- admin mutations ----------

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  async create(
    @Param('sectionSlug') slug: string,
    @Body() dto: CreateEntryDto,
    @CurrentUser() user: User,
  ): Promise<SerializedEntry> {
    const section = await this.resolveSectionForWrite(slug);
    const entry = await this.entries.create(section.id, dto, user.id);
    return this.entries.serialize(entry, section);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':entryId')
  async update(
    @Param('sectionSlug') slug: string,
    @Param('entryId', new ParseUUIDPipe()) entryId: string,
    @Body() dto: UpdateEntryDto,
  ): Promise<SerializedEntry> {
    const section = await this.resolveSectionForWrite(slug);
    const entry = await this.entries.update(section.id, entryId, dto);
    return this.entries.serialize(entry, section);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post(':entryId/publish')
  @HttpCode(HttpStatus.OK)
  async publish(
    @Param('sectionSlug') slug: string,
    @Param('entryId', new ParseUUIDPipe()) entryId: string,
  ): Promise<SerializedEntry> {
    const section = await this.resolveSectionForWrite(slug);
    const entry = await this.entries.publish(section.id, entryId);
    return this.entries.serialize(entry, section);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  async reorder(
    @Param('sectionSlug') slug: string,
    @Body() dto: ReorderEntriesDto,
  ): Promise<void> {
    const section = await this.resolveSectionForWrite(slug);
    await this.entries.reorder(section.id, dto.ids);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':entryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('sectionSlug') slug: string,
    @Param('entryId', new ParseUUIDPipe()) entryId: string,
  ): Promise<void> {
    const section = await this.resolveSectionForWrite(slug);
    await this.entries.remove(section.id, entryId);
  }

  // ---------- helpers ----------

  private async resolveSectionForRead(
    slug: string,
    user: User | undefined,
  ): Promise<SectionEntity> {
    const section = await this.sections.findBySlug(slug);
    if (!section) throw new NotFoundException({ errors: { section: 'notFound' } });
    if (!section.isPublic) {
      if (!user) throw new UnauthorizedException();
      if (!this.isAdmin(user)) throw new ForbiddenException();
    }
    return section;
  }

  private async resolveSectionForWrite(slug: string): Promise<SectionEntity> {
    const section = await this.sections.findBySlug(slug);
    if (!section) throw new NotFoundException({ errors: { section: 'notFound' } });
    return section;
  }

  private isAdmin(user: User | undefined): boolean {
    return (
      !!user &&
      (user.role === UserRole.ADMIN || user.role === UserRole.SUPERADMIN)
    );
  }

  private parseLang(value?: string): Locale | undefined {
    if (!value) return undefined;
    if (!isLocale(value)) {
      throw new BadRequestException({ errors: { lang: 'invalidLocale' } });
    }
    return value;
  }

  private isEntryStatus(value: string): value is EntryStatus {
    return value === EntryStatus.DRAFT || value === EntryStatus.PUBLISHED;
  }
}
