// Configuration Validation using Joi
import Joi from 'joi';
import { IBackendConfig, IUserFieldConfig } from './types';
import { ConfigurationError } from '../errors/config.errors';

const SQL_RESERVED_WORDS = new Set([
  'select',
  'insert',
  'update',
  'delete',
  'from',
  'where',
  'table',
  'drop',
  'alter',
  'create',
  'index',
  'primary',
  'key',
  'foreign',
  'references',
  'join',
  'inner',
  'outer',
  'left',
  'right',
  'group',
  'by',
  'order',
  'having',
  'limit',
  'offset',
  'union',
  'all',
  'distinct',
  'as',
  'into',
  'values',
  'null',
  'not',
  'and',
  'or',
  'case',
  'when',
  'then',
  'else',
  'end',
  'id',
  'user_id',
  'project_id',
  'created_at',
  'updated_at',
  'deleted_at',
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
    .valid('string', 'text', 'integer', 'decimal', 'boolean', 'date', 'datetime', 'uuid', 'enum')
    .required(),
  nullable: Joi.boolean().default(true),
  required: Joi.boolean().default(false),
  unique: Joi.boolean().default(false),
  indexed: Joi.boolean().default(false),
  default: Joi.any().optional(),
  max_length: Joi.number().integer().positive().optional(),
  enum_values: Joi.when('type', {
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
      access_token_secret: Joi.string().min(16).required(),
      refresh_token_secret: Joi.string().min(16).required(),
      access_token_expiry: Joi.alternatives().try(Joi.string(), Joi.number()).default('15m'),
      refresh_token_expiry: Joi.alternatives().try(Joi.string(), Joi.number()).default('7d'),
      issuer: Joi.string().optional(),
      audience: Joi.string().optional(),
    }).required(),
    password: Joi.object({
      min_length: Joi.number().integer().min(6).default(8),
      max_length: Joi.number().integer().min(10).default(128),
      require_uppercase: Joi.boolean().default(true),
      require_lowercase: Joi.boolean().default(true),
      require_digit: Joi.boolean().default(true),
      require_special_char: Joi.boolean().default(false),
      salt_rounds: Joi.number().integer().min(8).max(16).default(12),
    }).default(),
    registration: Joi.object({
      defaultRole: Joi.string().default('user'),
      default_status: Joi.string().default('active'),
      requireEmailVerification: Joi.boolean().default(false),
      allowedRoles: Joi.array().items(Joi.string()).optional(),
    }).default(),
  }).required(),

  users: Joi.object({
    fields: Joi.array().items(userFieldSchema).default([]),
    statuses: Joi.array().items(Joi.string()).default(['active', 'inactive', 'suspended']),
    default_status: Joi.string().default('active'),
  }).default(),

  roles: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        description: Joi.string().optional(),
        is_system: Joi.boolean().default(false),
        permissions: Joi.array().items(Joi.string()).required(),
      }),
    )
    .optional(),

  superAdmin: Joi.object({
    email: Joi.string().email().required(),
    first_name: Joi.string().trim().min(1).max(100).optional(),
    last_name: Joi.string().trim().min(1).max(100).optional(),
    password: Joi.string().min(8).required(),
    phone: Joi.string().optional(),
  }).required(),

  email: Joi.object({
    provider: Joi.string().valid('smtp', 'resend').required(),
    from: Joi.string().email().required(),
    from_name: Joi.string().optional(),
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
    templates_dir: Joi.string().optional(),
  }).optional(),

  branding: Joi.object({
    project_name: Joi.string().optional(),
    company_name: Joi.string().optional(),
    logo_url: Joi.string().uri().optional(),
    primary_color: Joi.string().optional(),
    support_email: Joi.string().email().optional(),
    frontend_url: Joi.string().uri().optional(),
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
    access_key_id: Joi.string().required(),
    secret_access_key: Joi.string().required(),
    endpoint: Joi.string().optional(),
    public_url: Joi.string().optional(),
    signed_url_expiry_seconds: Joi.number().integer().positive().default(3600),
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
