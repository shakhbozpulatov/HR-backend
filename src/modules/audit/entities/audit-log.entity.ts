import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('audit_logs')
@Index(['actor', 'created_at'])
@Index(['target_type', 'target_id'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  log_id: string;

  @Column()
  actor: string;

  @Column()
  action: string;

  @Column()
  target_type: string;

  @Column()
  target_id: string;

  @Column({ type: 'json', nullable: true })
  before?: any;

  @Column({ type: 'json', nullable: true })
  after?: any;

  @CreateDateColumn()
  created_at: Date;
}
