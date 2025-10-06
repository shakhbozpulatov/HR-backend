import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '@/modules/users/entities/user.entity';
import { Holiday } from '@/modules/holidays/entities/holiday.entity';
import { Department } from './department.entity';
import { ScheduleTemplate } from '@/modules/schedules/entities/schedule-template.entity';

export enum CompanyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum SubscriptionPlan {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

@Entity('companies')
@Index(['code'], { unique: true })
@Index(['tax_id'], { unique: true, where: 'tax_id IS NOT NULL' })
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string; // COM001, COM002

  @Column()
  name: string;

  @Column({ nullable: true })
  legal_name?: string;

  @Column({ nullable: true })
  tax_id?: string; // STIR (Soliq to'lovchi identifikatsion raqami)

  @Column({ nullable: true })
  registration_number?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  website?: string;

  @Column({ type: 'enum', enum: CompanyStatus, default: CompanyStatus.ACTIVE })
  status: CompanyStatus;

  @Column({
    type: 'enum',
    enum: SubscriptionPlan,
    default: SubscriptionPlan.FREE,
  })
  subscription_plan: SubscriptionPlan;

  @Column({ type: 'date', nullable: true })
  subscription_start_date?: Date;

  @Column({ type: 'date', nullable: true })
  subscription_end_date?: Date;

  @Column({ type: 'integer', default: 10 })
  max_employees: number; // Subscription limitga qarab

  @Column({ type: 'json', nullable: true })
  settings?: {
    timezone: string;
    currency: string;
    date_format: string;
    time_format: string;
    week_start: string;
    fiscal_year_start: string;
    default_language: string;
  };

  @Column({ type: 'json', nullable: true })
  payroll_settings?: {
    overtime_multiplier: number;
    grace_in_minutes: number;
    grace_out_minutes: number;
    rounding_minutes: number;
    overtime_threshold_minutes: number;
  };

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @OneToMany(() => User, (user) => user.company)
  users: User[];

  @OneToMany(() => Holiday, (holiday) => holiday.company)
  holidays: Holiday[];

  @OneToMany(() => Department, (department) => department.company)
  departments: Department[];

  @OneToMany(() => ScheduleTemplate, (template) => template.company)
  schedule_templates: ScheduleTemplate[];
}
