import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  UpdateDateColumn,
} from 'typeorm';

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
@Index(['user_id', 'ts_local'])
@Index(['device_id', 'ts_local'])
@Index(['processing_status', 'created_at'])
@Index(['terminal_user_id', 'device_id'])
export class AttendanceEvent {
  @PrimaryGeneratedColumn('uuid')
  event_id: string;

  @Column({ type: 'varchar', nullable: true })
  user_id?: string;

  @Column({ nullable: true })
  terminal_user_id?: string;

  @Column({ type: 'varchar' })
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

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  // Note: user_id and device_id are now string IDs from HC system
  // Relations removed to allow non-UUID foreign keys
}
