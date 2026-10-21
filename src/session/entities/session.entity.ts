// Session Entity for Refresh Token Rotation & Invalidation (Decision D04)
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
import { User } from '../../user/entities/user.entity';
import { Project } from '../../project/entities/project.entity';

@Entity({ name: 'sessions' })
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_sessions_user_id')
  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Index('idx_sessions_project_id')
  @Column({ type: 'uuid', name: 'project_id' })
  project_id: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Index('idx_sessions_refresh_token', { unique: true })
  @Column({ type: 'varchar', length: 500, unique: true, name: 'refresh_token' })
  refresh_token: string;

  @Column({ type: 'varchar', length: 45, nullable: true, name: 'ip_address' })
  ip_address: string | null;

  @Column({ type: 'text', nullable: true, name: 'user_agent' })
  user_agent: string | null;

  @Column({ type: 'boolean', default: false, name: 'is_revoked' })
  is_revoked: boolean;

  @Column({ type: 'timestamp with time zone', name: 'expires_at' })
  expires_at: Date;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updated_at: Date;
}
