import { ToolkitError } from './base.error';

export class RoleNotFoundError extends ToolkitError {
  constructor(message: string = 'Role not found') {
    super(404, message, 'ROLE_NOT_FOUND');
  }
}

export class DuplicateRoleError extends ToolkitError {
  constructor(message: string = 'Role already exists in this project') {
    super(409, message, 'DUPLICATE_ROLE');
  }
}

export class PermissionDeniedError extends ToolkitError {
  constructor(message: string = 'Permission denied', requiredPermissions?: string[]) {
    super(
      403,
      message,
      'PERMISSION_DENIED',
      requiredPermissions ? { required_permissions: requiredPermissions } : undefined,
    );
  }
}

export const ForbiddenException = PermissionDeniedError;
export type ForbiddenException = PermissionDeniedError;

export class SystemRoleProtectedError extends ToolkitError {
  constructor(message: string = 'System role cannot be modified or deleted') {
    super(403, message, 'SYSTEM_ROLE_PROTECTED');
  }
}
