// Express Router Factory for @node-backend-toolkit
import { Router } from 'express';
import { projectContextMiddleware } from '../../middleware/project-context.middleware';
import { authorizeMiddleware } from '../../middleware/authorize.middleware';
import { hasPermission } from '../../middleware/permission.middleware';
import { authController } from '../../auth/controllers/auth.controller';
import { userController } from '../../user/controllers/user.controller';
import { authParams } from '../../validators/auth.validator';
import { userParams } from '../../validators/user.validator';
import { validate } from '../../validators/validate.middleware';

export interface IRouterOptions {
  includeProjectContext?: boolean; // default: true
}

export const createBackendRouter = (options: IRouterOptions = {}): Router => {
  const router = Router();
  const includeProjectContext = options.includeProjectContext !== false;

  if (includeProjectContext) {
    router.use(projectContextMiddleware);
  }

  // --- Auth Routes ---
  router.post('/auth/register', validate(authParams.register), authController.register);
  router.post('/auth/login', validate(authParams.login), authController.login);
  router.post(
    '/auth/refresh-token',
    validate(authParams.refreshToken),
    authController.refreshToken,
  );
  router.post(
    '/auth/forgot-password',
    validate(authParams.forgotPassword),
    authController.forgotPassword,
  );
  router.post(
    '/auth/reset-password',
    validate(authParams.resetPassword),
    authController.resetPassword,
  );

  // Protected Auth Routes
  router.get('/auth/profile', authorizeMiddleware, authController.getProfile);
  router.patch(
    '/auth/profile',
    authorizeMiddleware,
    validate(authParams.updateProfile),
    authController.updateProfile,
  );
  router.post(
    '/auth/change-password',
    authorizeMiddleware,
    validate(authParams.changePassword),
    authController.changePassword,
  );
  router.post('/auth/logout', authorizeMiddleware, authController.logout);
  router.delete(
    '/auth/account',
    authorizeMiddleware,
    validate(authParams.deleteAccount),
    authController.deleteAccount,
  );

  // --- User Management Routes (RBAC) ---
  router.post(
    '/users',
    authorizeMiddleware,
    hasPermission('users:create'),
    validate(userParams.create),
    userController.create,
  );
  router.get(
    '/users',
    authorizeMiddleware,
    hasPermission('users:list'),
    validate(userParams.list),
    userController.list,
  );
  router.get(
    '/users/:id',
    authorizeMiddleware,
    hasPermission('users:view'),
    validate(userParams.getById),
    userController.getById,
  );
  router.patch(
    '/users/:id',
    authorizeMiddleware,
    hasPermission('users:update'),
    validate(userParams.update),
    userController.update,
  );
  router.delete(
    '/users/:id',
    authorizeMiddleware,
    hasPermission('users:delete'),
    validate(userParams.getById),
    userController.delete,
  );

  return router;
};
