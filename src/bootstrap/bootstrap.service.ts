// Bootstrap Service for initializing multi-project backend, roles, and Super Admin
import { DataSource } from 'typeorm';
import { Router } from 'express';
import { IBackendConfig } from '../config/types';
import { configManager } from '../config/config.manager';
import { initializeDataSource } from '../database/datasource';
import { projectService } from '../project/services/project.service';
import { roleService } from '../role/services/role.service';
import { Project } from '../project/entities/project.entity';
import { User } from '../user/entities/user.entity';
import { UserProfile } from '../user/entities/user-profile.entity';
import { slugify } from '../utils/slug.util';
import { normalizeEmail } from '../utils/email-normalizer.util';
import { passwordService } from '../auth/services/password.service';
import { createBackendRouter } from '../adapters/express/routes';

export interface IBootstrapResult {
  dataSource: DataSource;
  project: Project;
  router: Router;
}

export const initializeBackend = async (config: IBackendConfig): Promise<IBootstrapResult> => {
  // 1. Initialize configuration manager
  configManager.initialize(config);

  // 2. Initialize database connection
  const dataSource = await initializeDataSource();

  // 3. Resolve or create project
  const projectConfig = configManager.getProject();
  const slug = projectConfig.slug ? slugify(projectConfig.slug) : slugify(projectConfig.name);

  let project: Project;
  try {
    project = await projectService.getProjectBySlug(slug);
  } catch {
    project = await projectService.createProject({
      name: projectConfig.name,
      slug,
      description: projectConfig.description,
    });
  }

  // 4. Seed default permissions
  const permissions = await roleService.seedDefaultPermissions();
  const allPermissionKeys = permissions.map((p) => p.key);

  // 5. Bootstrap Super Admin role (is_system = true)
  let superAdminRole = await roleService.getRoleByName(project.id, 'super_admin');
  if (!superAdminRole) {
    superAdminRole = await roleService.createRole(project.id, {
      name: 'super_admin',
      description: 'Full system administrator with unrestricted access',
      isSystem: true,
      permissionKeys: allPermissionKeys,
    });
  } else {
    // Ensure all permissions are assigned to Super Admin role
    await roleService.assignPermissions(superAdminRole.id, allPermissionKeys);
  }

  // 6. Bootstrap user-configured custom roles
  const customRoles = configManager.getRoles();
  for (const r of customRoles) {
    if (r.name === 'super_admin') continue;
    let existingRole = await roleService.getRoleByName(project.id, r.name);
    if (!existingRole) {
      await roleService.createRole(project.id, {
        name: r.name,
        description: r.description,
        isSystem: r.isSystem ?? false,
        permissionKeys: r.permissions,
      });
    }
  }

  // 7. Bootstrap Super Admin user (idempotent, transactional)
  const saConfig = configManager.getSuperAdmin();
  const saEmail = normalizeEmail(saConfig.email);

  await dataSource.transaction(async (manager) => {
    let saUser = await manager.findOne(User, {
      where: { project_id: project.id, email: saEmail },
    });

    if (!saUser) {
      const hashedPassword = await passwordService.hashPassword(saConfig.password);

      saUser = manager.create(User, {
        project_id: project.id,
        email: saEmail,
        first_name: saConfig.firstName,
        last_name: saConfig.lastName,
        phone: saConfig.phone || null,
        password: hashedPassword,
        role: 'super_admin',
        status: 'active',
        language: 'en',
      });

      const savedSa = await manager.save(saUser);

      const profile = manager.create(UserProfile, {
        user_id: savedSa.id,
        project_id: project.id,
      });

      await manager.save(profile);
    } else {
      // Ensure existing Super Admin has active status and super_admin role
      saUser.role = 'super_admin';
      saUser.status = 'active';
      await manager.save(saUser);
    }
  });

  // 8. Create Express Router
  const router = createBackendRouter();

  return {
    dataSource,
    project,
    router,
  };
};
