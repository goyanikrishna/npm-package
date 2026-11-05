// User Controller
import { SuccessMessages } from '../../constants/app-message.constant';
import { asyncHandler } from '../../utils/async-handler.util';
import { sendResponse } from '../../utils/response.util';
import { userService } from '../services/user.service';
import { Request, RequestHandler, Response } from 'express';

const create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { body, project_id, user } = req;
  const result = await userService.createUser(project_id!, body, user?.id);
  sendResponse(res, result, SuccessMessages.USER_CREATED, 201);
});

const list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { query, project_id } = req;
  const result = await userService.listUsers(project_id!, query);
  sendResponse(res, result, SuccessMessages.USERS_RETRIEVED, 200);
});

const getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { params, project_id } = req;
  const { id } = params;
  const user = await userService.getUserById(id, project_id!);
  sendResponse(res, userService.sanitizeUser(user), SuccessMessages.USER_RETRIEVED, 200);
});

const update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { params, body, project_id, user } = req;
  const { id } = params;
  const result = await userService.updateUser(id, project_id!, body, user?.id, user?.role);
  sendResponse(res, result, SuccessMessages.USER_UPDATED, 200);
});

const deleteUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { params, project_id, user } = req;
  const { id } = params;
  await userService.deleteUser(id, project_id!, user?.id);
  sendResponse(res, null, SuccessMessages.USER_DELETED, 200);
});

export const userController: Record<string, RequestHandler> = {
  create,
  list,
  getById,
  update,
  delete: deleteUser,
};
