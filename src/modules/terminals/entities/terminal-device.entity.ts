import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Company } from '@/modules/company/entities/company.entity';

export enum DeviceStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  MAINTENANCE = 'MAINTENANCE',
}

@Entity('terminal_devices')
export class TerminalDevice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  company_id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ type: 'enum', enum: DeviceStatus, default: DeviceStatus.OFFLINE })
  status: DeviceStatus;

  @Column({ type: 'timestamptz', nullable: true })
  last_seen_at?: Date;

  @Column({ nullable: true })
  vendor: string;

  @Column({ type: 'json', nullable: true })
  metadata?: any;

  // HC Cabinet Integration Fields
  @Column({ nullable: true, unique: true })
  hc_device_id?: string;

  @Column({ nullable: true })
  hc_access_level_id?: string;

  @Column({ nullable: true })
  serial_number?: string;

  @Column({ nullable: true })
  ip_address?: string;

  @Column({ nullable: true })
  port?: number;

  @Column({ type: 'boolean', default: false })
  is_hc_synced: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  // Note: AttendanceEvent relation removed - using HC string IDs instead of UUID relations
}
