import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { UserRole } from '../users/user-role.enum';
import { SectionsService } from './sections.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('sections')
export class SectionsController {
  constructor(private readonly svc: SectionsService) {}

  // Reads are available to admins — the sidebar and per-section content
  // tables need the section list + layout. Mutations stay superadmin-only
  // (method-level @Roles overrides the class default).

  @Get()
  list() {
    return this.svc.list();
  }

  @Get(':id')
  get(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.svc.findOne(id);
  }

  @Post()
  @Roles(UserRole.SUPERADMIN)
  create(@Body() dto: CreateSectionDto, @CurrentUser() user: User) {
    return this.svc.create(dto, user.id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPERADMIN)
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateSectionDto,
  ) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.svc.remove(id);
  }
}
