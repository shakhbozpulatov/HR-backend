import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { EmployeeScheduleAssignment } from './employee-schedule-assignment.entity';

export interface BreakTime {
  start_time: string;
  end_time: string;
  paid: boolean;
}

@Entity('schedule_templates')
export class ScheduleTemplate {
  @PrimaryGeneratedColumn('uuid')
  template_id: string;

  @Column()
  name: string;

  @Column({ type: 'json' })
  workdays: string[]; // e.g., ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

  @Column({ type: 'time' })
  start_time: string;

  @Column({ type: 'time' })
  end_time: string;

  @Column({ type: 'json', nullable: true })
  breaks?: BreakTime[];

  @Column({ type: 'integer', default: 5 })
  grace_in_min: number;

  @Column({ type: 'integer', default: 0 })
  grace_out_min: number;

  @Column({ type: 'integer', default: 5 })
  rounding_min: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(
    () => EmployeeScheduleAssignment,
    (assignment) => assignment.default_template,
  )
  assignments: EmployeeScheduleAssignment[];
}
