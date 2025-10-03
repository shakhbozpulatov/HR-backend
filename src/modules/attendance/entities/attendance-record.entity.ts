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
}

export interface ManualAdjustment {
  id: string;
  type: 'CLOCK_TIME_EDIT' | 'MARK_ABSENT_PAID' | 'MARK_ABSENT_UNPAID';
  reason: string;
  before_value?: any;
  after_value?: any;
  created_by: string;
  created_at: Date;
}

export interface Approval {
  approved_by: string;
  approved_at: Date;
  locked: boolean;
}

@Entity('attendance_records')
@Index(['user_id', 'date'], { unique: true })
@Index(['date', 'status'])
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

  @Column({ type: 'integer', default: 0 })
  worked_minutes: number;

  @Column({ type: 'integer', default: 0 })
  late_minutes: number;

  @Column({ type: 'integer', default: 0 })
  early_leave_minutes: number;

  @Column({ type: 'integer', default: 0 })
  overtime_minutes: number;

  @Column({ type: 'integer', default: 0, nullable: true })
  night_minutes?: number;

  @Column({ type: 'integer', default: 0, nullable: true })
  holiday_minutes?: number;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.OK,
  })
  status: AttendanceStatus;

  @Column({ type: 'json', nullable: true })
  event_ids?: string[];

  @Column({ type: 'json', nullable: true })
  manual_adjustments?: ManualAdjustment[];

  @Column({ type: 'json', nullable: true })
  approvals?: Approval[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.attendance_records)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => AttendanceEvent, (event) => event.user)
  events: AttendanceEvent[];
}
