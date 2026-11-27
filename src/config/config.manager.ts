// Config Manager for node-backend-toolkit
import { ConfigurationError } from '../errors/config.errors';
import {
  IAuthConfig,
  IBackendConfig,
  IBrandingConfig,
  IDatabaseConfig,
  IEmailConfig,
  IProjectConfig,
  IRoleConfig,
  IStorageConfig,
  ISuperAdminConfig,
  IUsersConfig,
} from './types';
import { validateConfig } from './validation';

let currentConfig: IBackendConfig | null = null;

const initializeConfig = (config: unknown): IBackendConfig => {
  const validated = validateConfig(config);
  currentConfig = validated;
  return currentConfig;
};

const isConfigInitialized = (): boolean => {
  return currentConfig !== null;
};

const getConfig = (): IBackendConfig => {
  if (!currentConfig) {
    throw new ConfigurationError(
      'Toolkit has not been initialized. Call initializeBackend(config) before accessing config.',
    );
  }
  return currentConfig;
};

const getProjectConfig = (): IProjectConfig => {
  return getConfig().project;
};

const getDatabaseConfig = (): IDatabaseConfig => {
  return getConfig().database;
};

const getAuthConfig = (): IAuthConfig => {
  return getConfig().auth;
};

const getUsersConfig = (): IUsersConfig => {
  return (
    getConfig().users || {
      fields: [],
      statuses: ['active', 'inactive', 'suspended'],
      default_status: 'active',
    }
  );
};

const getRolesConfig = (): IRoleConfig[] => {
  return getConfig().roles || [];
};

const getSuperAdminConfig = (): ISuperAdminConfig => {
  return getConfig().superAdmin;
};

const getEmailConfig = (): IEmailConfig | undefined => {
  return getConfig().email;
};

const getBrandingConfig = (): IBrandingConfig => {
  const branding = getConfig().branding || {};
  return {
    project_name: branding.project_name || getConfig().project.name,
    company_name: branding.company_name || branding.project_name || getConfig().project.name,
    logo_url: branding.logo_url,
    primary_color: branding.primary_color || '#4F46E5',
    support_email: branding.support_email || 'support@example.com',
    frontend_url: branding.frontend_url,
  };
};

const getStorageConfig = (): IStorageConfig | undefined => {
  return getConfig().storage;
};

const resetConfig = (): void => {
  currentConfig = null;
};

export const configManager = {
  initialize: initializeConfig,
  isInitialized: isConfigInitialized,
  get: getConfig,
  getProject: getProjectConfig,
  getDatabase: getDatabaseConfig,
  getAuth: getAuthConfig,
  getUsers: getUsersConfig,
  getRoles: getRolesConfig,
  getSuperAdmin: getSuperAdminConfig,
  getEmail: getEmailConfig,
  getBranding: getBrandingConfig,
  getStorage: getStorageConfig,
  reset: resetConfig,
  getInstance: () => configManager,
};

export const ConfigManager = configManager;
