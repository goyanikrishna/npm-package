// Third-party modules
import { Router } from 'express';

// Controllers
import { userController } from '../user/controllers/user.controller';

// Middlewares
import { authorizeMiddleware } from '../middleware/authorize.middleware';
import { hasPermission } from '../middleware/permission.middleware';

// Validators
import { userParams } from '../validators/user.validator';
import { validate } from '../validators/validate.middleware';

const router = Router({ mergeParams: true });

// --- Protected Routes (JWT required) ---
router.use(authorizeMiddleware);

/** POST /api/:project_slug/users - Admin creates new user */
router
  .route('/')
  .post(hasPermission('users:create'), validate(userParams.create), userController.create);

/** GET /api/:project_slug/users - List users with pagination and search */
router.route('/').get(hasPermission('users:list'), validate(userParams.list), userController.list);

/** GET /api/:project_slug/users/:id - Get single user by ID */
router
  .route('/:id')
  .get(hasPermission('users:view'), validate(userParams.getById), userController.getById);

/** PATCH /api/:project_slug/users/:id - Update user details */
router
  .route('/:id')
  .patch(hasPermission('users:update'), validate(userParams.update), userController.update);

/** DELETE /api/:project_slug/users/:id - Soft-delete user */
router
  .route('/:id')
  .delete(hasPermission('users:delete'), validate(userParams.getById), userController.delete);

export default router;
