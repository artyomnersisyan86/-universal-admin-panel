import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('table_rows')
@Index(['tableId', 'order'])
export class TableRowEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', name: 'table_id' })
  tableId!: string;

  @Column({ type: 'simple-json' })
  data!: Record<string, unknown>;

  @Column({ type: 'int', default: 0, name: 'order_index' })
  order!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
