import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DynamicEndpointEntity } from './dynamic-endpoint.entity';
import { DynamicEndpointsService } from './dynamic-endpoints.service';
import { DynamicEndpointsController } from './dynamic-endpoints.controller';
import { DynamicDispatcherController } from './dynamic-dispatcher.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DynamicEndpointEntity])],
  providers: [DynamicEndpointsService],
  controllers: [
    DynamicEndpointsController,
    // Catch-all dispatcher — keep last so other controllers match first.
    DynamicDispatcherController,
  ],
})
export class DynamicEndpointsModule {}
