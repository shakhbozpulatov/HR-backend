import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { PayrollItem } from './payroll-item.entity';

export enum PeriodStatus {
  OPEN = 'OPEN',
  LOCKED = 'LOCKED',
  PROCESSED = 'PROCESSED',
}

@Entity('payroll_periods')
@Index(['start_date', 'end_date'], { unique: true })
export class PayrollPeriod {
  @PrimaryGeneratedColumn('uuid')
  period_id: string;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date' })
  end_date: Date;

  @Column({ type: 'enum', enum: PeriodStatus, default: PeriodStatus.OPEN })
  status: PeriodStatus;

  @Column({ type: 'timestamptz', nullable: true })
  close_date?: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => PayrollItem, (item) => item.period)
  items: PayrollItem[];
}
