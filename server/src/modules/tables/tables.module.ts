import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TableDefinitionEntity } from './table-definition.entity';
import { TableRowEntity } from './table-row.entity';
import { TablesService } from './tables.service';
import { TablesController } from './tables.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TableDefinitionEntity, TableRowEntity])],
  providers: [TablesService],
  controllers: [TablesController],
})
export class TablesModule {}
