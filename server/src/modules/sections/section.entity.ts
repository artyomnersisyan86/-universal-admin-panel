import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface MultilingualText {
  hy: string;
  ru: string;
  en: string;
}

@Entity('sections')
export class SectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'text' })
  slug!: string;

  @Column({ type: 'simple-json' })
  name!: MultilingualText;

  @Column({ type: 'simple-json' })
  layout!: unknown;

  @Column({ type: 'boolean', name: 'is_public', default: true })
  isPublic!: boolean;

  @Column({ type: 'int', name: 'display_order', default: 0 })
  displayOrder!: number;

  @Column({ type: 'text', nullable: true })
  icon?: string | null;

  @Column({ type: 'varchar', name: 'created_by', nullable: true })
  createdBy?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
