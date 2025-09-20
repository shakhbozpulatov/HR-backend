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
import { Employee } from '../../employees/entities/employee.entity';
import { ScheduleTemplate } from './schedule-template.entity';

export interface ScheduleException {
  date?: string;
  start_date?: string;
  end_date?: string;
  template_id?: string;
  type: 'OFF' | 'ALTERNATE_TEMPLATE';
}

@Entity('employee_schedule_assignments')
@Index(['employee_id', 'effective_from'], { unique: true })
export class EmployeeScheduleAssignment {
  @PrimaryGeneratedColumn('uuid')
  assignment_id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  @Column({ type: 'uuid' })
  default_template_id: string;

  @Column({ type: 'date' })
  effective_from: Date;

  @Column({ type: 'date', nullable: true })
  effective_to?: Date;

  @Column({ type: 'json', nullable: true })
  exceptions?: ScheduleException[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => Employee, (employee) => employee.schedule_assignments)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @ManyToOne(() => ScheduleTemplate, (template) => template.assignments)
  @JoinColumn({ name: 'default_template_id' })
  default_template: ScheduleTemplate;
}
