// Configuration Type Definitions for @node-backend-toolkit

export type DynamicFieldType =
  | 'string'
  | 'text'
  | 'integer'
  | 'decimal'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'uuid'
  | 'enum';

export interface IUserFieldConfig {
  name: string;
  type: DynamicFieldType;
  nullable?: boolean;
  required?: boolean;
  unique?: boolean;
  indexed?: boolean;
  default?: unknown;
  maxLength?: number;
  enumValues?: string[];
  description?: string;
}

export interface IUsersConfig {
  fields?: IUserFieldConfig[];
  statuses?: string[];
  defaultStatus?: string;
}

export interface IProjectConfig {
  name: string;
  slug?: string;
  description?: string;
}

export interface IDatabaseConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  database: string;
  schema?: string;
  ssl?: boolean | { rejectUnauthorized?: boolean; ca?: string };
  synchronize?: boolean;
  logging?: boolean | ('query' | 'schema' | 'error' | 'warn' | 'info' | 'log' | 'migration')[];
  poolSize?: number;
}

export interface IJwtConfig {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenExpiry?: string | number; // e.g. '15m' or seconds
  refreshTokenExpiry?: string | number; // e.g. '7d' or seconds
  issuer?: string;
  audience?: string;
}

export interface IPasswordPolicyConfig {
  minLength?: number; // default: 8
  maxLength?: number; // default: 128
  requireUppercase?: boolean; // default: true
  requireLowercase?: boolean; // default: true
  requireDigit?: boolean; // default: true
  requireSpecialChar?: boolean; // default: false
  saltRounds?: number; // default: 12
}

export interface IRegistrationConfig {
  defaultRole?: string; // default: 'user'
  defaultStatus?: string; // default: 'active'
  requireEmailVerification?: boolean; // default: false
  allowedRoles?: string[]; // roles allowed for public registration
}

export interface IAuthConfig {
  jwt: IJwtConfig;
  password?: IPasswordPolicyConfig;
  registration?: IRegistrationConfig;
}

export interface IRoleConfig {
  name: string;
  description?: string;
  isSystem?: boolean;
  permissions: string[];
}

export interface ISuperAdminConfig {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phone?: string;
}

export interface ISmtpConfig {
  host: string;
  port: number;
  secure?: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface IResendConfig {
  apiKey: string;
}

export interface IEmailConfig {
  provider: 'smtp' | 'resend';
  from: string;
  fromName?: string;
  smtp?: ISmtpConfig;
  resend?: IResendConfig;
  templatesDir?: string;
}

export interface IBrandingConfig {
  projectName?: string;
  companyName?: string;
  logoUrl?: string;
  primaryColor?: string;
  supportEmail?: string;
  frontendUrl?: string;
}

export interface IS3StorageConfig {
  provider: 's3';
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  publicUrl?: string;
  signedUrlExpirySeconds?: number;
}

export interface IR2StorageConfig {
  provider: 'r2';
  bucket: string;
  region?: string;
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicUrl?: string;
  signedUrlExpirySeconds?: number;
}

export type IStorageConfig = IS3StorageConfig | IR2StorageConfig;

export interface IBackendConfig {
  project: IProjectConfig;
  database: IDatabaseConfig;
  auth: IAuthConfig;
  users?: IUsersConfig;
  roles?: IRoleConfig[];
  superAdmin: ISuperAdminConfig;
  email?: IEmailConfig;
  branding?: IBrandingConfig;
  storage?: IStorageConfig;
}
