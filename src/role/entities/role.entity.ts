// Role Entity
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from '../../project/entities/project.entity';
import { RolePermission } from './role-permission.entity';

@Entity({ name: 'roles' })
@Index('idx_roles_project_name_unique', ['project_id', 'name'], { unique: true })
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_roles_project_id')
  @Column({ type: 'uuid', name: 'project_id' })
  project_id: string;

  @ManyToOne(() => Project, (project) => project.roles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: false, name: 'is_system' })
  is_system: boolean;

  @OneToMany(() => RolePermission, (rp) => rp.role, { cascade: true })
  rolePermissions: RolePermission[];

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updated_at: Date;
}
