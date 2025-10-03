import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from '@/modules/company/entities/company.entity';
import { Employee } from '@/modules/employees/entities/employee.entity';

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn('uuid')
  department_id: string;

  @Column({ type: 'uuid' })
  company_id: string;

  @Column()
  code: string; // IT, HR, FIN

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'uuid', nullable: true })
  manager_id?: string; // Department manager

  @Column({ type: 'uuid', nullable: true })
  parent_department_id?: string; // Hierarchical departments

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  //Relations
  @ManyToOne(() => Company, (company) => company.departments)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @OneToMany(() => Employee, (employee) => employee.department)
  employees: Employee[];

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'parent_department_id' })
  parent_department?: Department;

  @OneToMany(() => Department, (department) => department.parent_department)
  sub_departments: Department[];
}
