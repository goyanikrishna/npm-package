// Authorize Middleware for JWT validation and user context
import { NextFunction, Request, Response } from 'express';
import { jwtService } from '../auth/services/jwt.service';
import { userService } from '../user/services/user.service';
import { AuthException } from '../errors/auth.errors';
import { UserInactiveError } from '../errors/user.errors';
import { ProjectMismatchError } from '../errors/project.errors';
import { User } from '../user/entities/user.entity';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      userId?: string;
    }
  }
}

export const authorizeMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthException('Authentication token required');
    }

    const token = authHeader.split(' ')[1];
    const payload = jwtService.verifyAccessToken(token);

    // Cross-project security isolation (R03 & D05)
    if (req.projectId && payload.project_id !== req.projectId) {
      throw new ProjectMismatchError('Token belongs to a different project context');
    }

    const user = await userService.getUserById(payload.id, payload.project_id);

    if (user.status !== 'active') {
      throw new UserInactiveError(`Account is ${user.status}`);
    }

    req.user = user;
    req.userId = user.id;

    // Ensure req.projectId is set from token if not already
    if (!req.projectId) {
      req.projectId = user.project_id;
    }

    next();
  } catch (err) {
    next(err);
  }
};
