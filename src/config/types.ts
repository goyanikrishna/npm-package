// Configuration Type Definitions for node-backend-toolkit

export type DynamicFieldType =
  'string' | 'text' | 'integer' | 'decimal' | 'boolean' | 'date' | 'datetime' | 'uuid' | 'enum';

export interface IUserFieldConfig {
  name: string;
  type: DynamicFieldType;
  nullable?: boolean;
  required?: boolean;
  unique?: boolean;
  indexed?: boolean;
  default?: unknown;
  max_length?: number;
  enum_values?: string[];
  description?: string;
}

export interface IUsersConfig {
  fields?: IUserFieldConfig[];
  statuses?: string[];
  default_status?: string;
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
  access_token_secret: string;
  refresh_token_secret: string;
  access_token_expiry?: string | number; // e.g. '15m' or seconds
  refresh_token_expiry?: string | number; // e.g. '7d' or seconds
  issuer?: string;
  audience?: string;
}

export interface IPasswordPolicyConfig {
  min_length?: number; // default: 8
  max_length?: number; // default: 128
  require_uppercase?: boolean; // default: true
  require_lowercase?: boolean; // default: true
  require_digit?: boolean; // default: true
  require_special_char?: boolean; // default: false
  salt_rounds?: number; // default: 12
}

export interface IRegistrationConfig {
  defaultRole?: string; // default: 'user'
  default_status?: string; // default: 'active'
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
  is_system?: boolean;
  permissions: string[];
}

export interface ISuperAdminConfig {
  email: string;
  first_name?: string;
  last_name?: string;
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
  from_name?: string;
  smtp?: ISmtpConfig;
  resend?: IResendConfig;
  templates_dir?: string;
}

export interface IBrandingConfig {
  project_name?: string;
  company_name?: string;
  logo_url?: string;
  primary_color?: string;
  support_email?: string;
  frontend_url?: string;
}

export interface IS3StorageConfig {
  provider: 's3';
  bucket: string;
  region: string;
  access_key_id: string;
  secret_access_key: string;
  endpoint?: string;
  public_url?: string;
  signed_url_expiry_seconds?: number;
}

export interface IR2StorageConfig {
  provider: 'r2';
  bucket: string;
  region?: string;
  accountId: string;
  access_key_id: string;
  secret_access_key: string;
  public_url?: string;
  signed_url_expiry_seconds?: number;
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
