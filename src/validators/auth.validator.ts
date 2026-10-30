// Auth Joi validation schemas
import Joi from 'joi';

export const authParams = {
  register: {
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
      first_name: Joi.string().trim().min(1).max(100).required(),
      last_name: Joi.string().trim().min(1).max(100).required(),
      phone: Joi.string().max(30).optional().allow(null, ''),
      language: Joi.string().max(10).optional().default('en'),
      profile: Joi.object().unknown(true).optional(),
    }).unknown(true),
  },

  login: {
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    }),
  },

  refreshToken: {
    body: Joi.object({
      refresh_token: Joi.string().required(),
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
      new_password: Joi.string().min(8).required(),
    }),
  },

  changePassword: {
    body: Joi.object({
      current_password: Joi.string().required(),
      new_password: Joi.string().min(8).required(),
    }),
  },

  deleteAccount: {
    body: Joi.object({
      password: Joi.string().required(),
    }),
  },

  logout: {
    body: Joi.object({
      refresh_token: Joi.string().required(),
    }),
  },

  updateProfile: {
    body: Joi.object({
      first_name: Joi.string().trim().min(1).max(100).optional(),
      last_name: Joi.string().trim().min(1).max(100).optional(),
      phone: Joi.string().max(30).optional().allow(null, ''),
      avatar: Joi.string().optional().allow(null, ''),
      language: Joi.string().max(10).optional(),
      profile: Joi.object().unknown(true).optional(),
    }).unknown(true),
  },
};

export default authParams;
