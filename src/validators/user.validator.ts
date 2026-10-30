// User management Joi validation schemas
import Joi from 'joi';
import { ErrMessages } from '../constants/app-message.constant';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const userParams = {
  getById: {
    params: Joi.object({
      id: Joi.string().regex(uuidPattern).required().messages({
        'string.pattern.base': ErrMessages.INVALID_UUID,
      }),
    }),
  },

  create: {
    body: Joi.object({
      email: Joi.string().email().required(),
      first_name: Joi.string().trim().min(1).max(100).required(),
      last_name: Joi.string().trim().min(1).max(100).required(),
      password: Joi.string().min(8).optional(),
      role: Joi.string().optional(),
      status: Joi.string().optional(),
      phone: Joi.string().max(30).optional().allow(null, ''),
      avatar: Joi.string().optional().allow(null, ''),
      language: Joi.string().max(10).optional(),
      profile: Joi.object().unknown(true).optional(),
    }).unknown(true),
  },

  update: {
    params: Joi.object({
      id: Joi.string().regex(uuidPattern).required().messages({
        'string.pattern.base': ErrMessages.INVALID_UUID,
      }),
    }),
    body: Joi.object({
      first_name: Joi.string().trim().min(1).max(100).optional(),
      last_name: Joi.string().trim().min(1).max(100).optional(),
      phone: Joi.string().max(30).optional().allow(null, ''),
      role: Joi.string().optional(),
      status: Joi.string().optional(),
      avatar: Joi.string().optional().allow(null, ''),
      language: Joi.string().max(10).optional(),
      password: Joi.string().min(8).optional(),
      profile: Joi.object().unknown(true).optional(),
    }).unknown(true),
  },

  list: {
    query: Joi.object({
      page: Joi.number().integer().min(1).optional().default(1),
      limit: Joi.number().integer().min(1).max(100).optional().default(20),
      per_page: Joi.number().integer().min(1).max(100).optional(),
      page_size: Joi.number().integer().min(1).max(100).optional(),
      search: Joi.string().optional().allow(''),
      role: Joi.string().optional(),
      status: Joi.string().optional(),
    }),
  },
};

export default userParams;
