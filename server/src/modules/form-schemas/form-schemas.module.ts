import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormSchemaEntity } from './form-schema.entity';
import { FormSchemasService } from './form-schemas.service';
import { FormSchemasController } from './form-schemas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FormSchemaEntity])],
  providers: [FormSchemasService],
  controllers: [FormSchemasController],
})
export class FormSchemasModule {}
