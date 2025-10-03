import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Company } from '@/modules/company/entities/company.entity';

@Entity('holidays')
@Index(['date', 'location_scope'])
@Index(['company_id', 'date'])
export class Holiday {
  @PrimaryGeneratedColumn('uuid')
  holiday_id: string;

  @Column({ type: 'uuid', nullable: true })
  company_id?: string; // null = global holiday (barcha companylar uchun)

  @Column()
  name: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ default: 'global' })
  location_scope: string;

  @Column({ type: 'boolean', default: true })
  paid: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => Company, (company) => company.holidays, { nullable: true })
  @JoinColumn({ name: 'company_id' })
  company?: Company;
}
