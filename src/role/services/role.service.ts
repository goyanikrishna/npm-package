// Role and Permission Service for node-backend-toolkit
import { getDataSource } from '../../database/datasource';
import {
  DuplicateRoleError,
  RoleNotFoundError,
  SystemRoleProtectedError,
} from '../../errors/role.errors';
import { Permission } from '../entities/permission.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { Role } from '../entities/role.entity';
import { ICreateRoleDto, IUpdateRoleDto } from '../types';
import { In, Repository } from 'typeorm';

export { ICreateRoleDto, IUpdateRoleDto };

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

const getRoleRepo = (): Repository<Role> => getDataSource().getRepository(Role);
const getPermissionRepo = (): Repository<Permission> => getDataSource().getRepository(Permission);
const getRolePermissionRepo = (): Repository<RolePermission> => getDataSource().getRepository(RolePermission);

const seedDefaultPermissions = async (
  extraPermissions: { key: string; name: string; module: string }[] = [],
): Promise<Permission[]> => {
  const permRepo = getPermissionRepo();
  const all = [...DEFAULT_PERMISSIONS, ...extraPermissions];
  const results: Permission[] = [];

  for (const p of all) {
    let existing = await permRepo.findOne({ where: { key: p.key } });
    if (!existing) {
      existing = permRepo.create({
        key: p.key,
        name: p.name,
        module: p.module,
      });
      existing = await permRepo.save(existing);
    }
    results.push(existing);
  }

  return results;
};

const getRoleById = async (id: string): Promise<Role> => {
  const roleRepo = getRoleRepo();
  const role = await roleRepo.findOne({
    where: { id },
    relations: ['rolePermissions', 'rolePermissions.permission'],
  });

  if (!role) {
    throw new RoleNotFoundError(`Role with ID "${id}" not found`);
  }

  return role;
};

const getRoleByName = async (project_id: string, name: string): Promise<Role | null> => {
  const roleRepo = getRoleRepo();
  return roleRepo.findOne({
    where: { project_id, name },
    relations: ['rolePermissions', 'rolePermissions.permission'],
  });
};

const listRoles = async (project_id: string): Promise<Role[]> => {
  const roleRepo = getRoleRepo();
  return roleRepo.find({
    where: { project_id },
    relations: ['rolePermissions', 'rolePermissions.permission'],
    order: { created_at: 'ASC' },
  });
};

const assignPermissions = async (roleId: string, permission_keys: string[]): Promise<void> => {
  const rpRepo = getRolePermissionRepo();
  const permRepo = getPermissionRepo();

  // Delete existing permissions for role
  await rpRepo.delete({ role_id: roleId });

  if (!permission_keys || permission_keys.length === 0) return;

  const permissions = await permRepo.find({
    where: { key: In(permission_keys) },
  });

  const rolePermissions = permissions.map((p) =>
    rpRepo.create({
      role_id: roleId,
      permission_id: p.id,
    }),
  );

  if (rolePermissions.length > 0) {
    await rpRepo.save(rolePermissions);
  }
};

const createRole = async (project_id: string, dto: ICreateRoleDto): Promise<Role> => {
  const roleRepo = getRoleRepo();
  const existing = await roleRepo.findOne({
    where: { project_id, name: dto.name },
  });

  if (existing) {
    throw new DuplicateRoleError(`Role "${dto.name}" already exists in this project`);
  }

  const role = roleRepo.create({
    project_id,
    name: dto.name,
    description: dto.description || null,
    is_system: dto.is_system ?? false,
  });

  const savedRole = await roleRepo.save(role);

  if (dto.permission_keys && dto.permission_keys.length > 0) {
    await assignPermissions(savedRole.id, dto.permission_keys);
  }

  return getRoleById(savedRole.id);
};

const updateRole = async (id: string, project_id: string, dto: IUpdateRoleDto): Promise<Role> => {
  const roleRepo = getRoleRepo();
  const role = await getRoleById(id);

  if (role.project_id !== project_id) {
    throw new RoleNotFoundError(`Role not found in this project`);
  }

  if (role.is_system && dto.name && dto.name !== role.name) {
    throw new SystemRoleProtectedError('System role name cannot be modified');
  }

  if (dto.name && dto.name !== role.name) {
    const existing = await roleRepo.findOne({
      where: { project_id, name: dto.name },
    });
    if (existing && existing.id !== id) {
      throw new DuplicateRoleError(`Role "${dto.name}" already exists in this project`);
    }
    role.name = dto.name;
  }

  if (dto.description !== undefined) {
    role.description = dto.description;
  }

  await roleRepo.save(role);

  if (dto.permission_keys !== undefined) {
    await assignPermissions(id, dto.permission_keys);
  }

  return getRoleById(id);
};

const deleteRole = async (id: string, project_id: string): Promise<void> => {
  const roleRepo = getRoleRepo();
  const role = await getRoleById(id);

  if (role.project_id !== project_id) {
    throw new RoleNotFoundError(`Role not found in this project`);
  }

  if (role.is_system) {
    throw new SystemRoleProtectedError('System roles cannot be deleted');
  }

  await roleRepo.remove(role);
};

const getUserPermissions = async (project_id: string, roleName: string): Promise<string[]> => {
  const role = await getRoleByName(project_id, roleName);
  if (!role) return [];

  return (role.rolePermissions || [])
    .map((rp) => rp.permission?.key)
    .filter((k): k is string => Boolean(k));
};

export const roleService = {
  seedDefaultPermissions,
  createRole,
  getRoleById,
  getRoleByName,
  listRoles,
  assignPermissions,
  updateRole,
  deleteRole,
  getUserPermissions,
};
