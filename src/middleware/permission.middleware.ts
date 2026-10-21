// Dynamic Role & Permission Middleware
import { NextFunction, Request, Response } from 'express';
import { roleService } from '../role/services/role.service';
import { AuthException } from '../errors/auth.errors';
import { PermissionDeniedError } from '../errors/role.errors';

export const hasPermission = (...requiredPermissions: string[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthException('Authentication required');
      }

      // Super Admin bypass: Super Admin has all permissions automatically
      if (req.user.role === 'super_admin') {
        return next();
      }

      const projectId = req.projectId || req.user.project_id;
      const userPermissions = await roleService.getUserPermissions(projectId, req.user.role);

      const hasAll = requiredPermissions.every((perm) => userPermissions.includes(perm));

      if (!hasAll) {
        throw new PermissionDeniedError(
          'You do not have the required permissions to perform this action',
          requiredPermissions,
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
