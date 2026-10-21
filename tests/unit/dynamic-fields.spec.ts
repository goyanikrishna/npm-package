// Dynamic Fields & Migration Generator Unit Tests
import { validateDynamicFields } from '../../src/user/validators/dynamic-field.validator';
import { generateMigration, mapTypeToPostgres } from '../../src/database/dynamic-fields/migration-generator';
import { IUserFieldConfig } from '../../src/config/types';
import { DynamicFieldValidationError } from '../../src/errors/config.errors';

describe('Dynamic Fields System', () => {
  const fieldsConfig: IUserFieldConfig[] = [
    { name: 'department', type: 'string', maxLength: 50, required: true },
    { name: 'bio', type: 'text', nullable: true },
    { name: 'years_active', type: 'integer', nullable: true },
    { name: 'rating', type: 'decimal', nullable: true },
    { name: 'is_verified', type: 'boolean', nullable: true },
    { name: 'dob', type: 'date', nullable: true },
    { name: 'last_login_at', type: 'datetime', nullable: true },
    { name: 'external_id', type: 'uuid', nullable: true, unique: true },
    { name: 'tier', type: 'enum', enumValues: ['free', 'premium', 'enterprise'], indexed: true },
  ];

  describe('Dynamic Field Validator', () => {
    it('should successfully validate valid data across all supported types', () => {
      const input = {
        department: 'Engineering',
        bio: 'Software architect',
        years_active: 5,
        rating: 4.85,
        is_verified: true,
        dob: '1990-05-15',
        last_login_at: '2026-10-15T12:00:00Z',
        external_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        tier: 'premium',
      };

      const result = validateDynamicFields(input, fieldsConfig);

      expect(result.department).toBe('Engineering');
      expect(result.years_active).toBe(5);
      expect(result.rating).toBe(4.85);
      expect(result.is_verified).toBe(true);
      expect(result.external_id).toBe('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
      expect(result.tier).toBe('premium');
    });

    it('should throw DynamicFieldValidationError if required field is missing', () => {
      const input = {
        bio: 'Missing department',
      };

      expect(() => validateDynamicFields(input, fieldsConfig)).toThrow(
        DynamicFieldValidationError,
      );
    });

    it('should throw DynamicFieldValidationError if enum value is invalid', () => {
      const input = {
        department: 'Finance',
        tier: 'unsupported_tier',
      };

      expect(() => validateDynamicFields(input, fieldsConfig)).toThrow(
        DynamicFieldValidationError,
      );
    });

    it('should throw DynamicFieldValidationError if string exceeds maxLength', () => {
      const input = {
        department: 'A'.repeat(51), // limit is 50
      };

      expect(() => validateDynamicFields(input, fieldsConfig)).toThrow(
        DynamicFieldValidationError,
      );
    });

    it('should throw DynamicFieldValidationError if UUID format is invalid', () => {
      const input = {
        department: 'Finance',
        external_id: 'not-a-valid-uuid',
      };

      expect(() => validateDynamicFields(input, fieldsConfig)).toThrow(
        DynamicFieldValidationError,
      );
    });
  });

  describe('Migration Generator', () => {
    it('should map field types to PostgreSQL DDL types correctly', () => {
      expect(mapTypeToPostgres({ name: 'f1', type: 'string', maxLength: 100 })).toBe(
        'VARCHAR(100)',
      );
      expect(mapTypeToPostgres({ name: 'f2', type: 'text' })).toBe('TEXT');
      expect(mapTypeToPostgres({ name: 'f3', type: 'integer' })).toBe('INTEGER');
      expect(mapTypeToPostgres({ name: 'f4', type: 'decimal' })).toBe('DECIMAL(12, 2)');
      expect(mapTypeToPostgres({ name: 'f5', type: 'boolean' })).toBe('BOOLEAN');
      expect(mapTypeToPostgres({ name: 'f6', type: 'date' })).toBe('DATE');
      expect(mapTypeToPostgres({ name: 'f7', type: 'datetime' })).toBe(
        'TIMESTAMP WITH TIME ZONE',
      );
      expect(mapTypeToPostgres({ name: 'f8', type: 'uuid' })).toBe('UUID');
      expect(mapTypeToPostgres({ name: 'f9', type: 'enum' })).toBe('VARCHAR(50)');
    });

    it('should generate valid TypeORM migration code with indexes and constraints', () => {
      const timestamp = 1700000000000;
      const migration = generateMigration(fieldsConfig, timestamp);

      expect(migration.fileName).toBe('1700000000000-AddDynamicFieldsToUserProfiles.ts');
      expect(migration.className).toBe('AddDynamicFieldsToUserProfiles1700000000000');

      // Up statements check
      expect(migration.code).toContain('ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "department" VARCHAR(50) NOT NULL');
      expect(migration.code).toContain('ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "tier" VARCHAR(50) NULL');
      expect(migration.code).toContain('CREATE INDEX IF NOT EXISTS "idx_user_profiles_tier" ON "user_profiles" ("tier")');
      expect(migration.code).toContain('ALTER TABLE "user_profiles" ADD CONSTRAINT "uq_user_profiles_external_id" UNIQUE ("external_id")');

      // Down statements check
      expect(migration.code).toContain('ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "department"');
      expect(migration.code).toContain('DROP INDEX IF EXISTS "idx_user_profiles_tier"');
    });
  });
});
