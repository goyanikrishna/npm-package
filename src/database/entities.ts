// Export all package entities
import { Project } from '../project/entities/project.entity';
import { User } from '../user/entities/user.entity';
import { UserProfile } from '../user/entities/user-profile.entity';
import { Role } from '../role/entities/role.entity';
import { Permission } from '../role/entities/permission.entity';
import { RolePermission } from '../role/entities/role-permission.entity';
import { Session } from '../session/entities/session.entity';
import { PasswordResetToken } from '../auth/entities/password-reset-token.entity';

export {
  Project,
  User,
  UserProfile,
  Role,
  Permission,
  RolePermission,
  Session,
  PasswordResetToken,
};

export const PACKAGE_ENTITIES = [
  Project,
  User,
  UserProfile,
  Role,
  Permission,
  RolePermission,
  Session,
  PasswordResetToken,
];
