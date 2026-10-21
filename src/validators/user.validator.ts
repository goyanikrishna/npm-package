// User management Joi validation schemas
import Joi from 'joi';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const userParams = {
  getById: {
    params: Joi.object({
      id: Joi.string().regex(uuidPattern).required().messages({
        'string.pattern.base': 'User ID must be a valid UUID',
      }),
    }),
  },

  create: {
    body: Joi.object({
      email: Joi.string().email().required(),
      firstName: Joi.string().trim().min(1).max(100).required(),
      lastName: Joi.string().trim().min(1).max(100).required(),
      password: Joi.string().min(6).optional(),
      role: Joi.string().optional(),
      status: Joi.string().optional(),
      phone: Joi.string().max(30).optional().allow(null, ''),
      avatar: Joi.string().optional().allow(null, ''),
      language: Joi.string().max(10).optional(),
      profile: Joi.object().optional(),
    }),
  },

  update: {
    params: Joi.object({
      id: Joi.string().regex(uuidPattern).required().messages({
        'string.pattern.base': 'User ID must be a valid UUID',
      }),
    }),
    body: Joi.object({
      firstName: Joi.string().trim().min(1).max(100).optional(),
      lastName: Joi.string().trim().min(1).max(100).optional(),
      phone: Joi.string().max(30).optional().allow(null, ''),
      role: Joi.string().optional(),
      status: Joi.string().optional(),
      avatar: Joi.string().optional().allow(null, ''),
      language: Joi.string().max(10).optional(),
      profile: Joi.object().optional(),
    }),
  },

  list: {
    query: Joi.object({
      page: Joi.number().integer().min(1).optional().default(1),
      limit: Joi.number().integer().min(1).max(100).optional().default(20),
      search: Joi.string().optional().allow(''),
      role: Joi.string().optional(),
      status: Joi.string().optional(),
    }),
  },
};
