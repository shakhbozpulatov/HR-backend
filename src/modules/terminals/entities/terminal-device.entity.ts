import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AttendanceEvent } from '@/modules/attendance/entities/attendance-event.entity';
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

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @OneToMany(() => AttendanceEvent, (event) => event.device)
  events: AttendanceEvent[];
}
