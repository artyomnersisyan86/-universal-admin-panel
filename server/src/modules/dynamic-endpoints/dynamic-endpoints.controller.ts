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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { UserRole } from '../users/user-role.enum';
import { DynamicEndpointsService } from './dynamic-endpoints.service';
import { UpsertEndpointDto } from './dto/upsert-endpoint.dto';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.SUPERADMIN)
@Controller('dynamic-endpoints')
export class DynamicEndpointsController {
  constructor(private readonly svc: DynamicEndpointsService) {}

  @Get()
  list() {
    return this.svc.list();
  }

  @Post()
  create(@Body() dto: UpsertEndpointDto, @CurrentUser() user: User) {
    return this.svc.create(dto, user.id);
  }

  @Patch(':id')
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpsertEndpointDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.svc.remove(id);
  }
}
