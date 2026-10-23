// Auth Controller
import { NextFunction, Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { sendResponse } from '../../utils/response.util';

export const authController = {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientMeta = {
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      };

      const result = await authService.register(req.projectId!, req.body, clientMeta);
      sendResponse(res, result, 'Registration successful', 201);
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientMeta = {
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      };

      const result = await authService.login(req.projectId!, req.body, clientMeta);
      sendResponse(res, result, 'Login successful', 200);
    } catch (err) {
      next(err);
    }
  },

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientMeta = {
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      };

      const tokens = await authService.refreshToken(req.body.refreshToken, clientMeta);
      sendResponse(res, tokens, 'Token refreshed successfully', 200);
    } catch (err) {
      next(err);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.forgotPassword(req.projectId!, req.body.email);
      sendResponse(
        res,
        null,
        'If an account exists with this email, a password reset link has been sent.',
        200,
      );
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.resetPassword(req.body);
      sendResponse(res, null, 'Password has been reset successfully', 200);
    } catch (err) {
      next(err);
    }
  },

  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await (
        await import('../../user/services/user.service')
      ).userService.getProfile(req.user!.id, req.projectId!);
      sendResponse(res, profile, 'Profile retrieved successfully', 200);
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await (
        await import('../../user/services/user.service')
      ).userService.updateProfile(req.user!.id, req.projectId!, req.body);
      sendResponse(res, updated, 'Profile updated successfully', 200);
    } catch (err) {
      next(err);
    }
  },

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.changePassword(req.user!.id, req.projectId!, req.body);
      sendResponse(res, null, 'Password changed successfully', 200);
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.body?.refreshToken;
      await authService.logout(refreshToken);
      sendResponse(res, null, 'Logged out successfully', 200);
    } catch (err) {
      next(err);
    }
  },

  async deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.deleteAccount(req.user!.id, req.projectId!, req.body.password);
      sendResponse(res, null, 'Account deleted successfully', 200);
    } catch (err) {
      next(err);
    }
  },
};
