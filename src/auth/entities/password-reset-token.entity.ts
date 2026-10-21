// Password Reset Token Entity
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from '../../project/entities/project.entity';

@Entity({ name: 'password_reset_tokens' })
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_password_reset_tokens_project_id')
  @Column({ type: 'uuid', name: 'project_id' })
  project_id: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Index('idx_password_reset_tokens_email')
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Index('idx_password_reset_tokens_token', { unique: true })
  @Column({ type: 'varchar', length: 255, unique: true })
  token: string;

  @Column({ type: 'boolean', default: false, name: 'is_used' })
  is_used: boolean;

  @Column({ type: 'timestamp with time zone', name: 'expires_at' })
  expires_at: Date;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updated_at: Date;
}
