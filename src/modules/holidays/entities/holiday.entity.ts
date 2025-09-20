import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('holidays')
@Index(['date', 'location_scope'])
export class Holiday {
  @PrimaryGeneratedColumn('uuid')
  holiday_id: string;

  @Column()
  name: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ default: 'global' })
  location_scope: string;

  @Column({ type: 'boolean', default: true })
  paid: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
