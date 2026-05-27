import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../users/user-role.enum';
import { EntriesService } from './entries.service';
import { EntryStatus } from './entry-status.enum';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Admin-only views over entries across sections — used by the Tables UI
 * to list/filter records without going through the per-section dispatcher.
 *
 * Mutations and per-section reads are handled by SectionEntriesController.
 */
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('entries')
export class EntriesController {
  constructor(private readonly svc: EntriesService) {}

  @Get()
  list(
    @Query('sectionId') sectionId?: string,
    @Query('status') status?: string,
  ) {
    if (sectionId !== undefined && !UUID_RE.test(sectionId)) {
      throw new BadRequestException({ errors: { sectionId: 'invalidUuid' } });
    }
    let validStatus: EntryStatus | undefined;
    if (status !== undefined) {
      if (status !== EntryStatus.DRAFT && status !== EntryStatus.PUBLISHED) {
        throw new BadRequestException({ errors: { status: 'invalidStatus' } });
      }
      validStatus = status;
    }
    return this.svc.list({ sectionId, status: validStatus });
  }

  @Get(':id')
  get(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.svc.findOne(id);
  }
}
