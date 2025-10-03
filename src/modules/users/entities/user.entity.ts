import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Employee } from '@/modules/employees/entities/employee.entity';
import { Company } from '@/modules/company/entities/company.entity';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN', // Platform admin (barcha companylarni ko'radi)
  COMPANY_OWNER = 'COMPANY_OWNER', // Company owner
  ADMIN = 'ADMIN', // Company admin
  HR_MANAGER = 'HR_MANAGER',
  PAYROLL = 'PAYROLL',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

@Entity('users')
@Index(['company_id', 'email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  user_id: string;

  @Column({ type: 'uuid', nullable: true })
  company_id?: string; // ← QO'SHILDI (SUPER_ADMIN uchun null bo'lishi mumkin)

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column()
  email: string;

  @Column()
  password_hash: string;

  @Column({ type: 'uuid', nullable: true })
  employee_id?: string;

  @Column({ type: 'boolean', default: false })
  mfa_enabled: boolean;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => Company, (company) => company.users, { nullable: true })
  @JoinColumn({ name: 'company_id' })
  company?: Company; // ← QO'SHILDI

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'employee_id' })
  employee?: Employee;
}
