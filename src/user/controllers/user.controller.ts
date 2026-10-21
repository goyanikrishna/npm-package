// User Controller
import { NextFunction, Request, Response } from 'express';
import { userService } from '../services/user.service';
import { sendResponse } from '../../utils/response.util';

export const userController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await userService.createUser(req.projectId!, req.body, req.user?.id);
      sendResponse(res, result, 'User created successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await userService.listUsers(req.projectId!, req.query);
      sendResponse(res, result, 'Users retrieved successfully', 200);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.getUserById(req.params.id, req.projectId!);
      sendResponse(res, userService.sanitizeUser(user), 'User retrieved successfully', 200);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await userService.updateUser(
        req.params.id,
        req.projectId!,
        req.body,
        req.user?.id,
        req.user?.role,
      );
      sendResponse(res, result, 'User updated successfully', 200);
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await userService.deleteUser(req.params.id, req.projectId!, req.user?.id);
      sendResponse(res, null, 'User deleted successfully', 200);
    } catch (err) {
      next(err);
    }
  },
};
