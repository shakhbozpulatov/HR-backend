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
import { ScheduleTemplate } from './schedule-template.entity';
import { User } from '@/modules/users/entities/user.entity';

export interface ScheduleException {
  date?: string;
  start_date?: string;
  end_date?: string;
  template_id?: string;
  type: 'OFF' | 'ALTERNATE_TEMPLATE';
}

@Entity('user_schedule_assignments')
@Index(['user_id', 'effective_from'], { unique: true })
export class UserScheduleAssignment {
  @PrimaryGeneratedColumn('uuid')
  assignment_id: string;

  @Column({ type: 'uuid' })
  user_id: string;

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
  @ManyToOne(() => User, (user) => user.schedule_assignments)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => ScheduleTemplate, (template) => template.assignments)
  @JoinColumn({ name: 'default_template_id' })
  default_template: ScheduleTemplate;
}
