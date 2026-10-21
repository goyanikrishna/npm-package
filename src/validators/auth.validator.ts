// Auth Joi validation schemas
import Joi from 'joi';

export const authParams = {
  register: {
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
      firstName: Joi.string().trim().min(1).max(100).required(),
      lastName: Joi.string().trim().min(1).max(100).required(),
      phone: Joi.string().max(30).optional().allow(null, ''),
      language: Joi.string().max(10).optional().default('en'),
      profile: Joi.object().optional(),
    }),
  },

  login: {
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    }),
  },

  refreshToken: {
    body: Joi.object({
      refreshToken: Joi.string().required(),
    }),
  },

  forgotPassword: {
    body: Joi.object({
      email: Joi.string().email().required(),
    }),
  },

  resetPassword: {
    body: Joi.object({
      token: Joi.string().required(),
      newPassword: Joi.string().min(6).required(),
    }),
  },

  changePassword: {
    body: Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string().min(6).required(),
    }),
  },

  deleteAccount: {
    body: Joi.object({
      password: Joi.string().required(),
    }),
  },

  updateProfile: {
    body: Joi.object({
      firstName: Joi.string().trim().min(1).max(100).optional(),
      lastName: Joi.string().trim().min(1).max(100).optional(),
      phone: Joi.string().max(30).optional().allow(null, ''),
      avatar: Joi.string().optional().allow(null, ''),
      language: Joi.string().max(10).optional(),
      profile: Joi.object().optional(),
    }),
  },
};
