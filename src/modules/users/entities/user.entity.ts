import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Company } from '@/modules/company/entities/company.entity';
import { Department } from '@/modules/company/entities/department.entity';
import { AttendanceEvent } from '@/modules/attendance/entities/attendance-event.entity';
import { AttendanceRecord } from '@/modules/attendance/entities/attendance-record.entity';
import { UserScheduleAssignment } from '@/modules/schedules/entities/employee-schedule-assignment.entity';
import { PayrollItem } from '@/modules/payroll/entities/payroll-item.entity';
import { WorkVolumeEntry } from '@/modules/payroll/entities/work-volume-entry.entity';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN', // Platform admin (barcha companylarni ko'radi)
  COMPANY_OWNER = 'COMPANY_OWNER', // Company owner
  ADMIN = 'ADMIN', // Company admin
  HR_MANAGER = 'HR_MANAGER',
  PAYROLL = 'PAYROLL',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

export enum TariffType {
  HOURLY = 'HOURLY',
  MONTHLY = 'MONTHLY',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('users')
@Index(['company_id', 'email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  company_id?: string; // ← QO'SHILDI (SUPER_ADMIN uchun null bo'lishi mumkin)

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column()
  email: string;

  @Column()
  password_hash: string;

  @Column({ type: 'uuid', nullable: true })
  employee_id?: string;

  @Column({ type: 'boolean', default: false })
  mfa_enabled: boolean;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ nullable: true })
  first_name: string;

  @Column({ nullable: true })
  last_name: string;

  @Column({ nullable: true })
  middle_name?: string;

  @Column({ type: 'date', nullable: true })
  dob?: Date;

  @Column({ nullable: true })
  phone?: string;

  // Organization
  @Column({ type: 'uuid', nullable: true })
  department_id?: string; // ← Department entity'ga bog'lanadi

  @Column({ nullable: true })
  department?: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ type: 'uuid', nullable: true })
  manager_id?: string;

  @Column({ nullable: true })
  position?: string;

  @Column({ type: 'date', nullable: true })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date?: Date;

  @Column({ type: 'enum', enum: TariffType, nullable: true })
  tariff_type: TariffType;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  hourly_rate?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  monthly_salary?: number;

  @Column({ nullable: true })
  terminal_user_id?: string;

  @Column({ type: 'json', nullable: true })
  external_ids?: Record<string, string>;

  // Relations
  @ManyToOne(() => Company, (company) => company.users, { nullable: true })
  @JoinColumn({ name: 'company_id' })
  company?: Company; // ← QO'SHILDI

  // @ManyToOne(() => Employee, { nullable: true })
  // @JoinColumn({ name: 'employee_id' })
  // employee?: Employee;

  @ManyToOne(() => Department, (department) => department.users, {
    nullable: true,
  })
  @JoinColumn({ name: 'department_id' })
  department_entity?: Department; // ← QO'SHILDI

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'manager_id' })
  manager: User;

  @OneToMany(() => AttendanceEvent, (event) => event.user)
  attendance_events: AttendanceEvent[];

  @OneToMany(() => AttendanceRecord, (record) => record.user)
  attendance_records: AttendanceRecord[];

  @OneToMany(() => UserScheduleAssignment, (assignment) => assignment.user)
  schedule_assignments: UserScheduleAssignment[];

  @OneToMany(() => PayrollItem, (item) => item.user)
  payroll_items: PayrollItem[];

  @OneToMany(() => WorkVolumeEntry, (entry) => entry.user)
  work_volume_entries: WorkVolumeEntry[];
}
