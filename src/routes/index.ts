// Third-party modules
import { Router } from 'express';

// Middlewares
import authorize from '../middleware/authorize.middleware';
import { projectContextMiddleware } from '../middleware/project-context.middleware';

// Routes
import authRouter from './auth.route';
import userRouter from './user.route';

const router = Router({ mergeParams: true });

// Context Middleware (Resolves active tenant / project)
router.use(projectContextMiddleware);

// ─── Public Routes ────────────────────────────────────────────────────────────
router.use('/auth', authRouter);

// ─── Protected Routes (JWT required) ─────────────────────────────────────────
router.use(authorize);
router.use('/user', userRouter);
router.use('/users', userRouter);

export interface IRouterOptions {
  includeProjectContext?: boolean;
}

export const createBackendRouter = (_options: IRouterOptions = {}): Router => router;

export { authRouter, userRouter, router };
export default router;
