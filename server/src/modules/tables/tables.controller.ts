import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../users/user-role.enum';
import { TablesService } from './tables.service';
import { ReorderRowsDto, UpsertRowDto, UpsertTableDto } from './dto/upsert-table.dto';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('tables')
export class TablesController {
  constructor(private readonly svc: TablesService) {}

  @Get()
  listTables() {
    return this.svc.listTables();
  }

  @Post()
  createTable(@Body() dto: UpsertTableDto) {
    return this.svc.createTable(dto);
  }

  @Patch(':id')
  updateTable(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpsertTableDto) {
    return this.svc.updateTable(id, dto);
  }

  @Delete(':id')
  removeTable(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.svc.removeTable(id);
  }

  @Get(':id/rows')
  rows(
    @Param('id', new ParseUUIDPipe()) tableId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '25',
    @Query('q') q?: string,
    @Query('sort') sort?: string,
  ) {
    return this.svc.listRows(tableId, Number(page) || 1, Number(limit) || 25, q, sort);
  }

  @Post(':id/rows')
  addRow(@Param('id', new ParseUUIDPipe()) tableId: string, @Body() dto: UpsertRowDto) {
    return this.svc.addRow(tableId, dto);
  }

  @Patch(':id/rows/reorder')
  reorder(@Param('id', new ParseUUIDPipe()) tableId: string, @Body() dto: ReorderRowsDto) {
    return this.svc.reorderRows(tableId, dto);
  }

  @Patch(':id/rows/:rowId')
  updateRow(@Param('rowId', new ParseUUIDPipe()) rowId: string, @Body() dto: UpsertRowDto) {
    return this.svc.updateRow(rowId, dto);
  }

  @Delete(':id/rows/:rowId')
  removeRow(@Param('rowId', new ParseUUIDPipe()) rowId: string) {
    return this.svc.removeRow(rowId);
  }
}
