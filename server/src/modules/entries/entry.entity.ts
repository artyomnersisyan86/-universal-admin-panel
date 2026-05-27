import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntryStatus } from './entry-status.enum';

const isoDateTransformer = {
  to: (value?: Date | null): string | null => (value ? value.toISOString() : null),
  from: (value?: string | null): Date | null => (value ? new Date(value) : null),
};

@Entity('entries')
@Index(['sectionId', 'status'])
@Index(['sectionId', 'createdAt'])
export class EntryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', name: 'section_id' })
  sectionId!: string;

  @Column({ type: 'text', default: EntryStatus.DRAFT })
  status!: EntryStatus;

  @Column({ type: 'simple-json' })
  data!: Record<string, unknown>;

  @Column({
    type: 'varchar',
    name: 'published_at',
    nullable: true,
    transformer: isoDateTransformer,
  })
  publishedAt?: Date | null;

  @Column({ type: 'varchar', name: 'created_by', nullable: true })
  createdBy?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
