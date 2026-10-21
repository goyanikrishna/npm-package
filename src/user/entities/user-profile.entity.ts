// UserProfile Entity for Dynamic Fields (Decision D01)
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'user_profiles' })
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_user_profiles_user_id', { unique: true })
  @Column({ type: 'uuid', name: 'user_id', unique: true })
  user_id: string;

  @Index('idx_user_profiles_project_id')
  @Column({ type: 'uuid', name: 'project_id' })
  project_id: string;

  @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updated_at: Date;

  // Index signature allowing dynamic columns defined at runtime/migration
  [key: string]: unknown;
}
