import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '@/modules/users/entities/user.entity';
import { TerminalDevice } from '@/modules/terminals/entities/terminal-device.entity';

export enum EnrollmentStatus {
  PENDING = 'pending',
  PENDING_BIOMETRIC = 'pending_biometric',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DISABLED = 'disabled',
}

@Entity('user_device_mappings')
@Index(['terminal_user_id', 'device_id'], { unique: true })
@Index(['user_id', 'device_id'])
@Index(['device_id', 'enrollment_status'])
export class UserDeviceMapping {
  @PrimaryGeneratedColumn('uuid')
  mapping_id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'varchar' })
  terminal_user_id: string;

  @Column({ type: 'uuid' })
  device_id: string;

  @Column({
    type: 'enum',
    enum: EnrollmentStatus,
    default: EnrollmentStatus.PENDING,
  })
  enrollment_status: EnrollmentStatus;

  @Column({ type: 'boolean', default: false })
  fingerprint_enrolled: boolean;

  @Column({ type: 'integer', default: 0 })
  fingerprint_count: number;

  @Column({ type: 'boolean', default: false })
  face_enrolled: boolean;

  @Column({ type: 'varchar', nullable: true })
  card_number?: string;

  @Column({ type: 'varchar', nullable: true })
  pin_code?: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'varchar', nullable: true })
  enrolled_by?: string;

  @Column({ type: 'timestamptz', nullable: true })
  enrolled_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  last_sync_at?: Date;

  @Column({ type: 'json', nullable: true })
  sync_metadata?: any;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => TerminalDevice, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'device_id' })
  device: TerminalDevice;
}
