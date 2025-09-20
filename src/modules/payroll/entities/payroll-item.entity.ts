import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Employee } from '../../employees/entities/employee.entity';
import { PayrollPeriod } from './payroll-period.entity';

export enum PayrollItemType {
  EARNING = 'EARNING',
  DEDUCTION = 'DEDUCTION',
}

export enum PayrollItemCode {
  BASE_HOURLY = 'BASE_HOURLY',
  BASE_MONTHLY = 'BASE_MONTHLY',
  OVERTIME = 'OVERTIME',
  HOLIDAY_PREMIUM = 'HOLIDAY_PREMIUM',
  PIECEWORK = 'PIECEWORK',
  BONUS = 'BONUS',
  PENALTY = 'PENALTY',
}

export enum PayrollItemSource {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL',
  IMPORT = 'IMPORT',
}

@Entity('payroll_items')
@Index(['employee_id', 'period_id', 'code'])
export class PayrollItem {
  @PrimaryGeneratedColumn('uuid')
  item_id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  @Column({ type: 'uuid' })
  period_id: string;

  @Column({ type: 'enum', enum: PayrollItemType })
  type: PayrollItemType;

  @Column({ type: 'enum', enum: PayrollItemCode })
  code: PayrollItemCode;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  rate: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount: number;

  @Column({ nullable: true })
  note?: string;

  @Column({
    type: 'enum',
    enum: PayrollItemSource,
    default: PayrollItemSource.AUTO,
  })
  source: PayrollItemSource;

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @ManyToOne(() => Employee, (employee) => employee.payroll_items)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @ManyToOne(() => PayrollPeriod, (period) => period.items)
  @JoinColumn({ name: 'period_id' })
  period: PayrollPeriod;
}
