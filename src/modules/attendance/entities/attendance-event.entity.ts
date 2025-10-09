import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  UpdateDateColumn,
} from 'typeorm';
import { TerminalDevice } from '@/modules/terminals/entities/terminal-device.entity';
import { User } from '@/modules/users/entities/user.entity';

export enum EventType {
  CLOCK_IN = 'clock_in',
  CLOCK_OUT = 'clock_out',
}

export enum EventSource {
  BIOMETRIC_DEVICE = 'biometric_device',
  MOBILE_APP = 'mobile_app',
  WEB_APP = 'web_app',
  MANUAL_ENTRY = 'manual_entry',
  IMPORTED = 'imported',
}

export enum ProcessingStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  FAILED = 'failed',
  QUARANTINED = 'quarantined',
}

@Entity('attendance_events')
@Index(['ingestion_idempotency_key'], { unique: true })
@Index(['user_id', 'ts_local'])
@Index(['device_id', 'ts_local'])
@Index(['processing_status', 'created_at'])
@Index(['terminal_user_id', 'device_id'])
export class AttendanceEvent {
  @PrimaryGeneratedColumn('uuid')
  event_id: string;

  @Column({ type: 'uuid', nullable: true })
  user_id?: string;

  @Column({ nullable: true })
  terminal_user_id?: string;

  @Column({ type: 'uuid' })
  device_id: string;

  @Column({ type: 'enum', enum: EventType })
  event_type: EventType;

  @Column({
    type: 'enum',
    enum: EventSource,
    default: EventSource.BIOMETRIC_DEVICE,
  })
  event_source: EventSource;

  @Column({ type: 'timestamptz' })
  ts_utc: Date;

  @Column({ type: 'timestamptz' })
  ts_local: Date;

  @Column({ type: 'json', nullable: true })
  source_payload?: any;

  @Column({ unique: true })
  ingestion_idempotency_key: string;

  @Column({ type: 'boolean', default: true })
  signature_valid: boolean;

  @Column({ type: 'varchar', nullable: true })
  signature_hash?: string;

  @Column({
    type: 'enum',
    enum: ProcessingStatus,
    default: ProcessingStatus.PENDING,
  })
  processing_status: ProcessingStatus;

  @Column({ type: 'timestamptz', nullable: true })
  processed_at?: Date;

  @Column({ type: 'text', nullable: true })
  processing_error?: string;

  @Column({ type: 'integer', default: 0 })
  retry_count: number;

  @Column({ type: 'varchar', nullable: true })
  resolved_by?: string;

  @Column({ type: 'timestamptz', nullable: true })
  resolved_at?: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.attendance_events, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne(() => TerminalDevice, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'device_id' })
  device: TerminalDevice;
}
