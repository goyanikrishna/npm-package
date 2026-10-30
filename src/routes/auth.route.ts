// Third-party modules
import { Router } from 'express';

// Controllers
import { authController } from '../auth/controllers/auth.controller';

// Middlewares
import { authorizeMiddleware } from '../middleware/authorize.middleware';

// Validators
import { authParams } from '../validators/auth.validator';
import { validate } from '../validators/validate.middleware';

const router = Router({ mergeParams: true });

// --- Public Routes ---

/** POST /api/:project_slug/auth/register - User registration */
router.route('/register').post(validate(authParams.register), authController.register);

/** POST /api/:project_slug/auth/login - User authentication */
router.route('/login').post(validate(authParams.login), authController.login);

/** POST /api/:project_slug/auth/refresh-token - Refresh access token */
router.route('/refresh-token').post(validate(authParams.refreshToken), authController.refreshToken);

/** POST /api/:project_slug/auth/forgot-password - Send password reset email */
router
  .route('/forgot-password')
  .post(validate(authParams.forgotPassword), authController.forgotPassword);

/** POST /api/:project_slug/auth/reset-password - Reset password using unique token */
router
  .route('/reset-password')
  .post(validate(authParams.resetPassword), authController.resetPassword);

// --- Protected Routes (JWT required) ---
router.use(authorizeMiddleware);

/** GET /api/:project_slug/auth/profile - Get authenticated user profile */
router.route('/profile').get(authController.getProfile);

/** PATCH /api/:project_slug/auth/profile - Update user profile & dynamic fields */
router.route('/profile').patch(validate(authParams.updateProfile), authController.updateProfile);

/** POST /api/:project_slug/auth/change-password - Change account password */
router
  .route('/change-password')
  .post(validate(authParams.changePassword), authController.changePassword);

/** POST /api/:project_slug/auth/logout - Revoke refresh token session */
router.route('/logout').post(authController.logout);

/** DELETE /api/:project_slug/auth/account - Self account deletion */
router.route('/account').delete(validate(authParams.deleteAccount), authController.deleteAccount);

export default router;
