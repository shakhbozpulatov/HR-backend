import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { AttendanceEvent } from './attendance-event.entity';
import { User } from '@/modules/users/entities/user.entity';

export enum AttendanceStatus {
  OK = 'OK',
  MISSING = 'MISSING',
  INCOMPLETE = 'INCOMPLETE',
  ABSENT = 'ABSENT',
  HOLIDAY = 'HOLIDAY',
  LEAVE = 'LEAVE',
  WEEKEND = 'WEEKEND',
}

export interface ManualAdjustment {
  id: string;
  type:
    | 'CLOCK_TIME_EDIT'
    | 'MARK_ABSENT_PAID'
    | 'MARK_ABSENT_UNPAID'
    | 'OVERRIDE_STATUS'
    | 'ADD_MINUTES'
    | 'REMOVE_MINUTES';
  reason: string;
  before_value?: any;
  after_value?: any;
  created_by: string;
  created_at: Date;
  approved_by?: string;
  approved_at?: Date;
}

export interface Approval {
  level: number;
  approved_by: string;
  approved_at: Date;
  locked: boolean;
  comments?: string;
}

export interface WorkSession {
  session_id: string;
  clock_in_event_id: string;
  clock_out_event_id?: string;
  clock_in_time: Date;
  clock_out_time?: Date;
  worked_minutes?: number;
  is_complete: boolean;
}

@Entity('attendance_records')
@Index(['user_id', 'date'], { unique: true })
@Index(['date', 'status'])
@Index(['user_id', 'date', 'status'])
@Index(['is_locked', 'date'])
export class AttendanceRecord {
  @PrimaryGeneratedColumn('uuid')
  record_id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'time', nullable: true })
  scheduled_start?: string;

  @Column({ type: 'time', nullable: true })
  scheduled_end?: string;

  @Column({ type: 'integer', nullable: true })
  scheduled_minutes?: number;

  @Column({ type: 'time', nullable: true })
  first_clock_in?: string;

  @Column({ type: 'time', nullable: true })
  last_clock_out?: string;

  @Column({ type: 'integer', default: 0 })
  worked_minutes: number;

  @Column({ type: 'integer', default: 0 })
  late_minutes: number;

  @Column({ type: 'integer', default: 0 })
  early_leave_minutes: number;

  @Column({ type: 'integer', default: 0 })
  overtime_minutes: number;

  @Column({ type: 'integer', default: 0 })
  night_minutes: number;

  @Column({ type: 'integer', default: 0 })
  holiday_minutes: number;

  @Column({ type: 'integer', default: 0 })
  break_minutes: number;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.OK,
  })
  status: AttendanceStatus;

  @Column({ type: 'json', nullable: true })
  event_ids?: string[];

  @Column({ type: 'json', nullable: true })
  work_sessions?: WorkSession[];

  @Column({ type: 'json', nullable: true })
  manual_adjustments?: ManualAdjustment[];

  @Column({ type: 'json', nullable: true })
  approvals?: Approval[];

  @Column({ type: 'boolean', default: false })
  is_locked: boolean;

  @Column({ type: 'boolean', default: false })
  requires_approval: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  last_processed_at?: Date;

  @Column({ type: 'varchar', nullable: true })
  processed_by?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.attendance_records, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => AttendanceEvent, (event) => event.user)
  events: AttendanceEvent[];
}
