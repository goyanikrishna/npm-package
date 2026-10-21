// RolePermission Join Entity
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from './role.entity';
import { Permission } from './permission.entity';

@Entity({ name: 'role_permissions' })
@Index('idx_role_permissions_unique', ['role_id', 'permission_id'], { unique: true })
export class RolePermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_role_permissions_role_id')
  @Column({ type: 'uuid', name: 'role_id' })
  role_id: string;

  @ManyToOne(() => Role, (role) => role.rolePermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Index('idx_role_permissions_permission_id')
  @Column({ type: 'uuid', name: 'permission_id' })
  permission_id: string;

  @ManyToOne(() => Permission, (permission) => permission.rolePermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  created_at: Date;
}
