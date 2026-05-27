import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('dashboard_widgets')
export class DashboardWidgetEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  type!: 'line' | 'bar';

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text', name: 'data_endpoint' })
  dataEndpoint!: string;

  @Column({ type: 'simple-json', nullable: true })
  config?: unknown;

  @Column({ type: 'int', default: 0, name: 'order_index' })
  order!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
