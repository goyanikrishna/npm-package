// Auth Controller
import { Request, Response, RequestHandler } from 'express';
import { authService } from '../services/auth.service';
import { sendResponse } from '../../utils/response.util';
import { asyncHandler } from '../../utils/async-handler.util';
import { getClientMeta } from '../../utils/request.util';
import { SuccessMessages } from '../../constants/app-message.constant';

const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { body, project_id } = req;
  const result = await authService.register(project_id!, body, getClientMeta(req));
  sendResponse(res, result, SuccessMessages.REGISTER, 201);
});

const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { body, project_id } = req;
  const result = await authService.login(project_id!, body, getClientMeta(req));
  sendResponse(res, result, SuccessMessages.LOGIN, 200);
});

const refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { body, project_id } = req;
  const { refresh_token } = body;
  const tokens = await authService.refreshToken(refresh_token, getClientMeta(req), project_id);
  sendResponse(res, tokens, SuccessMessages.TOKEN_REFRESH, 200);
});

const forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { body, project_id } = req;
  const { email } = body;
  await authService.forgotPassword(project_id!, email);
  sendResponse(res, null, SuccessMessages.FORGOT_PASSWORD_SENT, 200);
});

const resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { body, project_id } = req;
  await authService.resetPassword(body, project_id);
  sendResponse(res, null, SuccessMessages.PASSWORD_RESET, 200);
});

const getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { user, project_id } = req;
  const { userService } = await import('../../user/services/user.service');
  const profile = await userService.getProfile(user!.id, project_id!);
  sendResponse(res, profile, SuccessMessages.PROFILE_RETRIEVED, 200);
});

const updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { body, user, project_id } = req;
  const { userService } = await import('../../user/services/user.service');
  const updated = await userService.updateProfile(user!.id, project_id!, body);
  sendResponse(res, updated, SuccessMessages.PROFILE_UPDATED, 200);
});

const changePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { body, user, project_id } = req;
  await authService.changePassword(user!.id, project_id!, body);
  sendResponse(res, null, SuccessMessages.PASSWORD_CHANGED, 200);
});

const logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { body, project_id } = req;
  const { refresh_token } = body;
  await authService.logout(refresh_token, project_id);
  sendResponse(res, null, SuccessMessages.LOGOUT, 200);
});

const deleteAccount = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { body, user, project_id } = req;
  const { password } = body;
  await authService.deleteAccount(user!.id, project_id!, password);
  sendResponse(res, null, SuccessMessages.ACCOUNT_DELETED, 200);
});

export interface IAuthController {
  register: RequestHandler;
  login: RequestHandler;
  refreshToken: RequestHandler;
  forgotPassword: RequestHandler;
  resetPassword: RequestHandler;
  getProfile: RequestHandler;
  updateProfile: RequestHandler;
  changePassword: RequestHandler;
  logout: RequestHandler;
  deleteAccount: RequestHandler;
}

export const authController: IAuthController = {
  register,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  deleteAccount,
};
