import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { TerminalDevice } from '@/modules/terminals/entities/terminal-device.entity';
import { User } from '@/modules/users/entities/user.entity';

export enum EventType {
  CLOCK_IN = 'clock_in',
  CLOCK_OUT = 'clock_out',
}

@Entity('attendance_events')
@Index(['ingestion_idempotency_key'], { unique: true })
@Index(['user_id', 'ts_local'])
@Index(['device_id', 'ts_local'])
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

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.attendance_events, {
    nullable: true,
  })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne(() => TerminalDevice)
  @JoinColumn({ name: 'device_id' })
  device: TerminalDevice;
}
