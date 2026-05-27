import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('dynamic_endpoints')
@Index(['method', 'path'], { unique: true })
export class DynamicEndpointEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  method!: 'GET' | 'POST' | 'PATCH' | 'DELETE';

  @Column({ type: 'text' })
  path!: string;

  @Column({ type: 'text' })
  mode!: 'static' | 'db';

  @Column({ type: 'simple-json', nullable: true, name: 'response_template' })
  responseTemplate?: unknown;

  @Column({ type: 'simple-json', nullable: true, name: 'db_query_config' })
  dbQueryConfig?: unknown;

  @Column({ type: 'boolean', default: true })
  enabled!: boolean;

  @Column({ type: 'varchar', nullable: true, name: 'created_by' })
  createdBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
