// Singleton Config Manager for @node-backend-toolkit
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
import { ConfigurationError } from '../errors/config.errors';

class ConfigManager {
  private static instance: ConfigManager;
  private config: IBackendConfig | null = null;

  private constructor() {}

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  public initialize(config: unknown): IBackendConfig {
    const validated = validateConfig(config);
    this.config = validated;
    return this.config;
  }

  public isInitialized(): boolean {
    return this.config !== null;
  }

  public get(): IBackendConfig {
    if (!this.config) {
      throw new ConfigurationError(
        'Toolkit has not been initialized. Call initializeBackend(config) before accessing config.',
      );
    }
    return this.config;
  }

  public getProject(): IProjectConfig {
    return this.get().project;
  }

  public getDatabase(): IDatabaseConfig {
    return this.get().database;
  }

  public getAuth(): IAuthConfig {
    return this.get().auth;
  }

  public getUsers(): IUsersConfig {
    return (
      this.get().users || {
        fields: [],
        statuses: ['active', 'inactive', 'suspended'],
        defaultStatus: 'active',
      }
    );
  }

  public getRoles(): IRoleConfig[] {
    return this.get().roles || [];
  }

  public getSuperAdmin(): ISuperAdminConfig {
    return this.get().superAdmin;
  }

  public getEmail(): IEmailConfig | undefined {
    return this.get().email;
  }

  public getBranding(): IBrandingConfig {
    const branding = this.get().branding || {};
    return {
      projectName: branding.projectName || this.get().project.name,
      companyName: branding.companyName || branding.projectName || this.get().project.name,
      logoUrl: branding.logoUrl,
      primaryColor: branding.primaryColor || '#4F46E5',
      supportEmail: branding.supportEmail || 'support@example.com',
      frontendUrl: branding.frontendUrl,
    };
  }

  public getStorage(): IStorageConfig | undefined {
    return this.get().storage;
  }

  public reset(): void {
    this.config = null;
  }
}

export const configManager = ConfigManager.getInstance();
export { ConfigManager };
