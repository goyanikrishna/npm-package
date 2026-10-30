// Configuration System Tests
import { configManager } from '../../src/config/config.manager';
import { validateConfig, validateFieldName } from '../../src/config/validation';
import { ConfigurationError } from '../../src/errors/config.errors';

describe('Config System', () => {
  beforeEach(() => {
    configManager.reset();
  });

  const validMinimalConfig = {
    project: {
      name: 'Acme Health',
    },
    database: {
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'password',
      database: 'acme_db',
    },
    auth: {
      jwt: {
        access_token_secret: 'super-secret-access-token-key-12345',
        refresh_token_secret: 'super-secret-refresh-token-key-12345',
      },
    },
    superAdmin: {
      email: 'admin@acme.com',
      firstName: 'Super',
      lastName: 'Admin',
      password: 'SuperAdmin123!',
    },
  };

  it('should successfully validate and apply defaults to valid configuration', () => {
    const validated = validateConfig(validMinimalConfig);

    expect(validated.project.name).toBe('Acme Health');
    expect(validated.auth.jwt.access_token_expiry).toBe('15m');
    expect(validated.auth.jwt.refresh_token_expiry).toBe('7d');
    expect(validated.auth.password?.min_length).toBe(8);
    expect(validated.auth.password?.require_uppercase).toBe(true);
    expect(validated.auth.registration?.defaultRole).toBe('user');
    expect(validated.auth.registration?.default_status).toBe('active');
  });

  it('should initialize ConfigManager singleton and retrieve subsections', () => {
    configManager.initialize(validMinimalConfig);

    expect(configManager.isInitialized()).toBe(true);
    expect(configManager.getProject().name).toBe('Acme Health');
    expect(configManager.getSuperAdmin().email).toBe('admin@acme.com');
    expect(configManager.getBranding().primary_color).toBe('#4F46E5');
    expect(configManager.getBranding().project_name).toBe('Acme Health');
  });

  it('should throw ConfigurationError if accessing config before initialization', () => {
    expect(() => configManager.get()).toThrow(ConfigurationError);
  });

  it('should fail validation when required fields are missing', () => {
    const invalid = { ...validMinimalConfig, project: undefined };
    expect(() => validateConfig(invalid)).toThrow(ConfigurationError);
  });

  it('should validate dynamic field names correctly', () => {
    expect(validateFieldName('department')).toBe(true);
    expect(validateFieldName('job_title')).toBe(true);
    expect(validateFieldName('custom_field_123')).toBe(true);

    // Invalid format
    expect(validateFieldName('123field')).toBe(false);
    expect(validateFieldName('Department')).toBe(false);
    expect(validateFieldName('job-title')).toBe(false);
    expect(validateFieldName('job title')).toBe(false);
    expect(validateFieldName('')).toBe(false);

    // Reserved SQL words
    expect(validateFieldName('select')).toBe(false);
    expect(validateFieldName('where')).toBe(false);
    expect(validateFieldName('table')).toBe(false);
    expect(validateFieldName('user_id')).toBe(false);
    expect(validateFieldName('created_at')).toBe(false);
  });

  it('should accept valid dynamic user fields configuration', () => {
    const configWithFields = {
      ...validMinimalConfig,
      users: {
        fields: [
          { name: 'license_number', type: 'string', max_length: 50, required: true },
          { name: 'years_experience', type: 'integer', nullable: true },
          { name: 'specialty', type: 'enum', enum_values: ['cardiology', 'neurology'] },
        ],
      },
    };

    const validated = validateConfig(configWithFields);
    expect(validated.users?.fields?.length).toBe(3);
  });

  it('should reject dynamic fields with invalid enum configuration', () => {
    const invalidEnumConfig = {
      ...validMinimalConfig,
      users: {
        fields: [
          { name: 'specialty', type: 'enum' }, // missing enum_values
        ],
      },
    };

    expect(() => validateConfig(invalidEnumConfig)).toThrow(ConfigurationError);
  });
});
