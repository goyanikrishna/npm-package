// Role and Permission Service for node-backend-toolkit
import { In, Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { getDataSource } from '../../database/datasource';
import {
  DuplicateRoleError,
  RoleNotFoundError,
  SystemRoleProtectedError,
} from '../../errors/role.errors';

export interface ICreateRoleDto {
  name: string;
  description?: string;
  isSystem?: boolean;
  permissionKeys?: string[];
}

export interface IUpdateRoleDto {
  name?: string;
  description?: string;
  permissionKeys?: string[];
}

export const DEFAULT_PERMISSIONS = [
  { key: 'users:create', name: 'Create Users', module: 'users' },
  { key: 'users:view', name: 'View User Details', module: 'users' },
  { key: 'users:list', name: 'List Users', module: 'users' },
  { key: 'users:update', name: 'Update Users', module: 'users' },
  { key: 'users:delete', name: 'Delete Users', module: 'users' },
  { key: 'roles:create', name: 'Create Roles', module: 'roles' },
  { key: 'roles:view', name: 'View Role Details', module: 'roles' },
  { key: 'roles:list', name: 'List Roles', module: 'roles' },
  { key: 'roles:update', name: 'Update Roles', module: 'roles' },
  { key: 'roles:delete', name: 'Delete Roles', module: 'roles' },
];

export class RoleService {
  private get roleRepo(): Repository<Role> {
    return getDataSource().getRepository(Role);
  }

  private get permissionRepo(): Repository<Permission> {
    return getDataSource().getRepository(Permission);
  }

  private get rolePermissionRepo(): Repository<RolePermission> {
    return getDataSource().getRepository(RolePermission);
  }

  public async seedDefaultPermissions(
    extraPermissions: { key: string; name: string; module: string }[] = [],
  ): Promise<Permission[]> {
    const all = [...DEFAULT_PERMISSIONS, ...extraPermissions];
    const results: Permission[] = [];

    for (const p of all) {
      let existing = await this.permissionRepo.findOne({ where: { key: p.key } });
      if (!existing) {
        existing = this.permissionRepo.create({
          key: p.key,
          name: p.name,
          module: p.module,
        });
        existing = await this.permissionRepo.save(existing);
      }
      results.push(existing);
    }

    return results;
  }

  public async createRole(projectId: string, dto: ICreateRoleDto): Promise<Role> {
    const existing = await this.roleRepo.findOne({
      where: { project_id: projectId, name: dto.name },
    });

    if (existing) {
      throw new DuplicateRoleError(`Role "${dto.name}" already exists in this project`);
    }

    const role = this.roleRepo.create({
      project_id: projectId,
      name: dto.name,
      description: dto.description || null,
      is_system: dto.isSystem ?? false,
    });

    const savedRole = await this.roleRepo.save(role);

    if (dto.permissionKeys && dto.permissionKeys.length > 0) {
      await this.assignPermissions(savedRole.id, dto.permissionKeys);
    }

    return this.getRoleById(savedRole.id);
  }

  public async getRoleById(id: string): Promise<Role> {
    const role = await this.roleRepo.findOne({
      where: { id },
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });

    if (!role) {
      throw new RoleNotFoundError(`Role with ID "${id}" not found`);
    }

    return role;
  }

  public async getRoleByName(projectId: string, name: string): Promise<Role | null> {
    return this.roleRepo.findOne({
      where: { project_id: projectId, name },
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });
  }

  public async listRoles(projectId: string): Promise<Role[]> {
    return this.roleRepo.find({
      where: { project_id: projectId },
      relations: ['rolePermissions', 'rolePermissions.permission'],
      order: { created_at: 'ASC' },
    });
  }

  public async assignPermissions(roleId: string, permissionKeys: string[]): Promise<void> {
    // Delete existing permissions for role
    await this.rolePermissionRepo.delete({ role_id: roleId });

    if (!permissionKeys || permissionKeys.length === 0) return;

    const permissions = await this.permissionRepo.find({
      where: { key: In(permissionKeys) },
    });

    const rolePermissions = permissions.map((p) =>
      this.rolePermissionRepo.create({
        role_id: roleId,
        permission_id: p.id,
      }),
    );

    if (rolePermissions.length > 0) {
      await this.rolePermissionRepo.save(rolePermissions);
    }
  }

  public async updateRole(id: string, projectId: string, dto: IUpdateRoleDto): Promise<Role> {
    const role = await this.getRoleById(id);

    if (role.project_id !== projectId) {
      throw new RoleNotFoundError(`Role not found in this project`);
    }

    if (role.is_system && dto.name && dto.name !== role.name) {
      throw new SystemRoleProtectedError('System role name cannot be modified');
    }

    if (dto.name && dto.name !== role.name) {
      const existing = await this.roleRepo.findOne({
        where: { project_id: projectId, name: dto.name },
      });
      if (existing && existing.id !== id) {
        throw new DuplicateRoleError(`Role "${dto.name}" already exists in this project`);
      }
      role.name = dto.name;
    }

    if (dto.description !== undefined) {
      role.description = dto.description;
    }

    await this.roleRepo.save(role);

    if (dto.permissionKeys !== undefined) {
      await this.assignPermissions(id, dto.permissionKeys);
    }

    return this.getRoleById(id);
  }

  public async deleteRole(id: string, projectId: string): Promise<void> {
    const role = await this.getRoleById(id);

    if (role.project_id !== projectId) {
      throw new RoleNotFoundError(`Role not found in this project`);
    }

    if (role.is_system) {
      throw new SystemRoleProtectedError('System roles cannot be deleted');
    }

    await this.roleRepo.remove(role);
  }

  public async getUserPermissions(projectId: string, roleName: string): Promise<string[]> {
    const role = await this.getRoleByName(projectId, roleName);
    if (!role) return [];

    return (role.rolePermissions || [])
      .map((rp) => rp.permission?.key)
      .filter((k): k is string => Boolean(k));
  }
}

export const roleService = new RoleService();
