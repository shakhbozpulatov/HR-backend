import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum ProcessingType {
  DAILY_BATCH = 'daily_batch',
  SINGLE_RECORD = 'single_record',
  RANGE_REPROCESS = 'range_reprocess',
  MANUAL_TRIGGER = 'manual_trigger',
}

@Entity('attendance_processing_logs')
@Index(['processing_date', 'processing_type'])
@Index(['user_id', 'processing_date'])
export class AttendanceProcessingLog {
  @PrimaryGeneratedColumn('uuid')
  log_id: string;

  @Column({ type: 'uuid', nullable: true })
  user_id?: string;

  @Column({ type: 'date' })
  processing_date: Date;

  @Column({ type: 'enum', enum: ProcessingType })
  processing_type: ProcessingType;

  @Column({ type: 'integer', default: 0 })
  events_processed: number;

  @Column({ type: 'integer', default: 0 })
  records_created: number;

  @Column({ type: 'integer', default: 0 })
  records_updated: number;

  @Column({ type: 'boolean', default: true })
  success: boolean;

  @Column({ type: 'text', nullable: true })
  error_message?: string;

  @Column({ type: 'integer' })
  duration_ms: number;

  @Column({ type: 'varchar', nullable: true })
  triggered_by?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: any;

  @CreateDateColumn()
  created_at: Date;
}
