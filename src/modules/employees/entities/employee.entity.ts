import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  Index,
} from 'typeorm';
import { AttendanceEvent } from '../../attendance/entities/attendance-event.entity';
import { AttendanceRecord } from '../../attendance/entities/attendance-record.entity';
import { EmployeeScheduleAssignment } from '../../schedules/entities/employee-schedule-assignment.entity';
import { PayrollItem } from '../../payroll/entities/payroll-item.entity';
import { WorkVolumeEntry } from '../../payroll/entities/work-volume-entry.entity';

export enum TariffType {
  HOURLY = 'HOURLY',
  MONTHLY = 'MONTHLY',
}

export enum EmployeeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('employees')
@Index(['code'], { unique: true })
@Index(['email'], { unique: true, where: 'email IS NOT NULL' })
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  employee_id: string;

  @Column({ unique: true })
  code: string;

  @Column({
    type: 'enum',
    enum: EmployeeStatus,
    default: EmployeeStatus.ACTIVE,
  })
  status: EmployeeStatus;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ nullable: true })
  middle_name?: string;

  @Column({ type: 'date', nullable: true })
  dob?: Date;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  department?: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ type: 'uuid', nullable: true })
  manager_id?: string;

  @Column({ nullable: true })
  position?: string;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date?: Date;

  @Column({ type: 'enum', enum: TariffType })
  tariff_type: TariffType;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  hourly_rate?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  monthly_salary?: number;

  @Column({ nullable: true })
  terminal_user_id?: string;

  @Column({ type: 'json', nullable: true })
  external_ids?: Record<string, string>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => Employee, { nullable: true })
  manager: Employee;

  @OneToMany(() => AttendanceEvent, (event) => event.employee)
  attendance_events: AttendanceEvent[];

  @OneToMany(() => AttendanceRecord, (record) => record.employee)
  attendance_records: AttendanceRecord[];

  @OneToMany(
    () => EmployeeScheduleAssignment,
    (assignment) => assignment.employee,
  )
  schedule_assignments: EmployeeScheduleAssignment[];

  @OneToMany(() => PayrollItem, (item) => item.employee)
  payroll_items: PayrollItem[];

  @OneToMany(() => WorkVolumeEntry, (entry) => entry.employee)
  work_volume_entries: WorkVolumeEntry[];
}
