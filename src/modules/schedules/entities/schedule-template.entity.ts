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
import { UserScheduleAssignment } from './employee-schedule-assignment.entity';
import { IsBoolean, IsString } from 'class-validator';
import { Company } from '@/modules/company/entities/company.entity';

export class BreakTime {
  @IsString()
  start_time: string;

  @IsString()
  end_time: string;

  @IsBoolean()
  paid: boolean;
}

@Entity('schedule_templates')
export class ScheduleTemplate {
  @PrimaryGeneratedColumn('uuid')
  template_id: string;

  @Column({ type: 'uuid', nullable: true })
  company_id: string;

  @Column()
  name: string;

  @Column({ type: 'json' })
  workdays: string[]; // e.g., ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

  @Column({ type: 'time' })
  start_time: string;

  @Column({ type: 'time' })
  end_time: string;

  @Column({ type: 'jsonb', nullable: true })
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
    () => UserScheduleAssignment,
    (assignment) => assignment.default_template,
  )
  assignments: UserScheduleAssignment[];

  @ManyToOne(() => Company, (company) => company.schedule_templates, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'company_id' })
  company: Company;
}
