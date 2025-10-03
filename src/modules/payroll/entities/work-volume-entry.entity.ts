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
import { User } from '@/modules/users/entities/user.entity';

@Entity('work_volume_entries')
@Index(['user_id', 'date', 'work_type'])
export class WorkVolumeEntry {
  @PrimaryGeneratedColumn('uuid')
  entry_id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'date' })
  date: Date;

  @Column()
  work_type: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unit_rate: number;

  @Column({ type: 'boolean', default: false })
  approved: boolean;

  @Column({ type: 'uuid', nullable: true })
  approved_by?: string;

  @Column({ type: 'timestamptz', nullable: true })
  approved_at?: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.work_volume_entries)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
