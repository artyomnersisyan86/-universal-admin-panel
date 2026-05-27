import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../users/user-role.enum';
import { DashboardService } from './dashboard.service';
import { UpsertWidgetDto } from './dto/upsert-widget.dto';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('dashboard/widgets')
export class DashboardController {
  constructor(private readonly svc: DashboardService) {}

  @Get()
  list() {
    return this.svc.list();
  }

  @Post()
  create(@Body() dto: UpsertWidgetDto) {
    return this.svc.create(dto);
  }

  @Patch('reorder')
  reorder(@Body() body: { ids: string[] }) {
    return this.svc.reorder(body.ids);
  }

  @Patch(':id')
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpsertWidgetDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.svc.remove(id);
  }
}
