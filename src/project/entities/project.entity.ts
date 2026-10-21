// Project Entity for Multi-Project / Multi-Tenant Isolation
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Role } from '../../role/entities/role.entity';

@Entity({ name: 'projects' })
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Index('idx_projects_slug', { unique: true })
  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @OneToMany(() => User, (user) => user.project)
  users: User[];

  @OneToMany(() => Role, (role) => role.project)
  roles: Role[];

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updated_at: Date;
}
