import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardWidgetEntity } from './dashboard-widget.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DashboardWidgetEntity])],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
