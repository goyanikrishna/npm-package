// Configuration Validation using Joi
import Joi from 'joi';
import { IBackendConfig, IUserFieldConfig } from './types';
import { ConfigurationError } from '../errors/config.errors';

const SQL_RESERVED_WORDS = new Set([
  'select', 'insert', 'update', 'delete', 'from', 'where', 'table', 'drop',
  'alter', 'create', 'index', 'primary', 'key', 'foreign', 'references',
  'join', 'inner', 'outer', 'left', 'right', 'group', 'by', 'order', 'having',
  'limit', 'offset', 'union', 'all', 'distinct', 'as', 'into', 'values',
  'null', 'not', 'and', 'or', 'case', 'when', 'then', 'else', 'end',
  'id', 'user_id', 'project_id', 'created_at', 'updated_at', 'deleted_at',
]);

export const validateFieldName = (name: string): boolean => {
  if (!name || typeof name !== 'string') return false;
  // Must start with lowercase letter, followed by lowercase alphanumeric or underscores
  const validFormat = /^[a-z][a-z0-9_]{1,62}$/.test(name);
  if (!validFormat) return false;
  if (SQL_RESERVED_WORDS.has(name.toLowerCase())) return false;
  return true;
};

const userFieldSchema = Joi.object<IUserFieldConfig>({
  name: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (!validateFieldName(value)) {
        return helpers.error('any.invalid', {
          message: `Field name "${value}" is invalid. Must be snake_case, start with a letter, max 63 chars, and not be a SQL reserved word.`,
        });
      }
      return value;
    }),
  type: Joi.string()
    .valid(
      'string',
      'text',
      'integer',
      'decimal',
      'boolean',
      'date',
      'datetime',
      'uuid',
      'enum',
    )
    .required(),
  nullable: Joi.boolean().default(true),
  required: Joi.boolean().default(false),
  unique: Joi.boolean().default(false),
  indexed: Joi.boolean().default(false),
  default: Joi.any().optional(),
  maxLength: Joi.number().integer().positive().optional(),
  enumValues: Joi.when('type', {
    is: 'enum',
    then: Joi.array().items(Joi.string()).min(1).required(),
    otherwise: Joi.array().items(Joi.string()).optional(),
  }),
  description: Joi.string().optional(),
});

export const backendConfigSchema = Joi.object<IBackendConfig>({
  project: Joi.object({
    name: Joi.string().trim().min(1).max(100).required(),
    slug: Joi.string().trim().lowercase().min(1).max(100).optional(),
    description: Joi.string().max(255).optional(),
  }).required(),

  database: Joi.object({
    host: Joi.string().required(),
    port: Joi.number().port().required(),
    username: Joi.string().required(),
    password: Joi.string().allow('').optional().default(''),
    database: Joi.string().required(),
    schema: Joi.string().optional(),
    ssl: Joi.alternatives().try(Joi.boolean(), Joi.object()).optional(),
    synchronize: Joi.boolean().default(false),
    logging: Joi.alternatives().try(Joi.boolean(), Joi.array().items(Joi.string())).default(false),
    poolSize: Joi.number().integer().positive().default(10),
  }).required(),

  auth: Joi.object({
    jwt: Joi.object({
      accessTokenSecret: Joi.string().min(16).required(),
      refreshTokenSecret: Joi.string().min(16).required(),
      accessTokenExpiry: Joi.alternatives().try(Joi.string(), Joi.number()).default('15m'),
      refreshTokenExpiry: Joi.alternatives().try(Joi.string(), Joi.number()).default('7d'),
      issuer: Joi.string().optional(),
      audience: Joi.string().optional(),
    }).required(),
    password: Joi.object({
      minLength: Joi.number().integer().min(6).default(8),
      maxLength: Joi.number().integer().min(10).default(128),
      requireUppercase: Joi.boolean().default(true),
      requireLowercase: Joi.boolean().default(true),
      requireDigit: Joi.boolean().default(true),
      requireSpecialChar: Joi.boolean().default(false),
      saltRounds: Joi.number().integer().min(8).max(16).default(12),
    }).default(),
    registration: Joi.object({
      defaultRole: Joi.string().default('user'),
      defaultStatus: Joi.string().default('active'),
      requireEmailVerification: Joi.boolean().default(false),
      allowedRoles: Joi.array().items(Joi.string()).optional(),
    }).default(),
  }).required(),

  users: Joi.object({
    fields: Joi.array().items(userFieldSchema).default([]),
    statuses: Joi.array().items(Joi.string()).default(['active', 'inactive', 'suspended']),
    defaultStatus: Joi.string().default('active'),
  }).default(),

  roles: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        description: Joi.string().optional(),
        isSystem: Joi.boolean().default(false),
        permissions: Joi.array().items(Joi.string()).required(),
      }),
    )
    .optional(),

  superAdmin: Joi.object({
    email: Joi.string().email().required(),
    firstName: Joi.string().trim().min(1).max(100).required(),
    lastName: Joi.string().trim().min(1).max(100).required(),
    password: Joi.string().min(8).required(),
    phone: Joi.string().optional(),
  }).required(),

  email: Joi.object({
    provider: Joi.string().valid('smtp', 'resend').required(),
    from: Joi.string().email().required(),
    fromName: Joi.string().optional(),
    smtp: Joi.when('provider', {
      is: 'smtp',
      then: Joi.object({
        host: Joi.string().required(),
        port: Joi.number().port().required(),
        secure: Joi.boolean().default(false),
        auth: Joi.object({
          user: Joi.string().required(),
          pass: Joi.string().required(),
        }).required(),
      }).required(),
      otherwise: Joi.forbidden(),
    }),
    resend: Joi.when('provider', {
      is: 'resend',
      then: Joi.object({
        apiKey: Joi.string().required(),
      }).required(),
      otherwise: Joi.forbidden(),
    }),
    templatesDir: Joi.string().optional(),
  }).optional(),

  branding: Joi.object({
    projectName: Joi.string().optional(),
    companyName: Joi.string().optional(),
    logoUrl: Joi.string().uri().optional(),
    primaryColor: Joi.string().optional(),
    supportEmail: Joi.string().email().optional(),
    frontendUrl: Joi.string().uri().optional(),
  }).optional(),

  storage: Joi.object({
    provider: Joi.string().valid('s3', 'r2').required(),
    bucket: Joi.string().required(),
    region: Joi.string().default('us-east-1'),
    accountId: Joi.when('provider', {
      is: 'r2',
      then: Joi.string().required(),
      otherwise: Joi.forbidden(),
    }),
    accessKeyId: Joi.string().required(),
    secretAccessKey: Joi.string().required(),
    endpoint: Joi.string().optional(),
    publicUrl: Joi.string().optional(),
    signedUrlExpirySeconds: Joi.number().integer().positive().default(3600),
  }).optional(),
});

export const validateConfig = (config: unknown): IBackendConfig => {
  const { error, value } = backendConfigSchema.validate(config, {
    abortEarly: false,
    stripUnknown: false,
  });

  if (error) {
    const errorDetails = error.details.map((d) => d.message).join('; ');
    throw new ConfigurationError(`Configuration validation failed: ${errorDetails}`);
  }

  return value as IBackendConfig;
};
