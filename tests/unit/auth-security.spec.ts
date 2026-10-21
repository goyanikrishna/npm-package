// Security & Authorization Middleware Unit Tests
import { projectContextMiddleware } from '../../src/middleware/project-context.middleware';
import { authorizeMiddleware } from '../../src/middleware/authorize.middleware';
import { hasPermission } from '../../src/middleware/permission.middleware';
import { jwtService } from '../../src/auth/services/jwt.service';
import { userService } from '../../src/user/services/user.service';
import { roleService } from '../../src/role/services/role.service';
import { projectService } from '../../src/project/services/project.service';
import { AuthException } from '../../src/errors/auth.errors';
import { ProjectMismatchError, ProjectNotFoundError } from '../../src/errors/project.errors';
import { PermissionDeniedError } from '../../src/errors/role.errors';

describe('Security & Authorization Middleware', () => {
  describe('Project Context Middleware', () => {
    it('should throw ProjectNotFoundError if project parameter is missing', async () => {
      const req: any = { params: {}, headers: {} };
      const res: any = {};
      const next = jest.fn();

      await projectContextMiddleware(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(ProjectNotFoundError));
    });

    it('should resolve project from params and attach to req', async () => {
      const mockProject = { id: 'proj-123', name: 'Alpha', slug: 'alpha' };
      jest.spyOn(projectService, 'resolveProject').mockResolvedValue(mockProject as any);

      const req: any = { params: { project_slug: 'alpha' }, headers: {} };
      const res: any = {};
      const next = jest.fn();

      await projectContextMiddleware(req, res, next);
      expect(req.project).toEqual(mockProject);
      expect(req.projectId).toBe('proj-123');
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('Authorize Middleware & Cross-Project Isolation', () => {
    it('should throw AuthException if Authorization header is missing', async () => {
      const req: any = { headers: {} };
      const res: any = {};
      const next = jest.fn();

      await authorizeMiddleware(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AuthException));
    });

    it('should throw ProjectMismatchError if token project_id does not match req.projectId', async () => {
      jest.spyOn(jwtService, 'verifyAccessToken').mockReturnValue({
        id: 'user-1',
        project_id: 'project-A',
        email: 'alice@example.com',
        role: 'user',
      });

      const req: any = {
        headers: { authorization: 'Bearer valid.jwt.token' },
        projectId: 'project-B', // Different project!
      };
      const res: any = {};
      const next = jest.fn();

      await authorizeMiddleware(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(ProjectMismatchError));
    });

    it('should authorize active user and attach user to req when project matches', async () => {
      jest.spyOn(jwtService, 'verifyAccessToken').mockReturnValue({
        id: 'user-1',
        project_id: 'project-A',
        email: 'alice@example.com',
        role: 'user',
      });

      const mockUser = {
        id: 'user-1',
        project_id: 'project-A',
        email: 'alice@example.com',
        status: 'active',
        role: 'user',
      };
      jest.spyOn(userService, 'getUserById').mockResolvedValue(mockUser as any);

      const req: any = {
        headers: { authorization: 'Bearer valid.jwt.token' },
        projectId: 'project-A',
      };
      const res: any = {};
      const next = jest.fn();

      await authorizeMiddleware(req, res, next);
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('Permission Middleware & Super Admin Bypass', () => {
    it('should immediately allow Super Admin without querying permissions', async () => {
      const req: any = {
        user: { id: 'admin-1', role: 'super_admin', project_id: 'proj-1' },
      };
      const res: any = {};
      const next = jest.fn();

      const middleware = hasPermission('users:delete', 'system:manage');
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should allow user if role has all required permissions', async () => {
      jest
        .spyOn(roleService, 'getUserPermissions')
        .mockResolvedValue(['users:create', 'users:view']);

      const req: any = {
        user: { id: 'manager-1', role: 'manager', project_id: 'proj-1' },
      };
      const res: any = {};
      const next = jest.fn();

      const middleware = hasPermission('users:view');
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should throw PermissionDeniedError if user lacks any required permission', async () => {
      jest
        .spyOn(roleService, 'getUserPermissions')
        .mockResolvedValue(['users:view']);

      const req: any = {
        user: { id: 'user-1', role: 'user', project_id: 'proj-1' },
      };
      const res: any = {};
      const next = jest.fn();

      const middleware = hasPermission('users:delete');
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(PermissionDeniedError));
    });
  });
});
