// Dynamic Fields Migration Generator
import { IUserFieldConfig } from '../../config/types';
import { validateFieldName } from '../../config/validation';
import { ConfigurationError } from '../../errors/config.errors';

export interface IMigrationGenerateResult {
  fileName: string;
  className: string;
  code: string;
}

export const mapTypeToPostgres = (field: IUserFieldConfig): string => {
  switch (field.type) {
    case 'string':
      return `VARCHAR(${field.maxLength || 255})`;
    case 'text':
      return 'TEXT';
    case 'integer':
      return 'INTEGER';
    case 'decimal':
      return 'DECIMAL(12, 2)';
    case 'boolean':
      return 'BOOLEAN';
    case 'date':
      return 'DATE';
    case 'datetime':
      return 'TIMESTAMP WITH TIME ZONE';
    case 'uuid':
      return 'UUID';
    case 'enum':
      return 'VARCHAR(50)';
    default:
      throw new ConfigurationError(`Unsupported dynamic field type: ${field.type}`);
  }
};

export const generateMigration = (
  fields: IUserFieldConfig[],
  timestamp: number = Date.now(),
): IMigrationGenerateResult => {
  const className = `AddDynamicFieldsToUserProfiles${timestamp}`;
  const fileName = `${timestamp}-AddDynamicFieldsToUserProfiles.ts`;

  const upStatements: string[] = [];
  const downStatements: string[] = [];

  for (const field of fields) {
    if (!validateFieldName(field.name)) {
      throw new ConfigurationError(`Invalid field name "${field.name}" for migration`);
    }

    const pgType = mapTypeToPostgres(field);
    const isNullable = field.required ? false : field.nullable !== false;
    const nullableClause = isNullable ? 'NULL' : 'NOT NULL';
    const defaultClause = field.default !== undefined ? ` DEFAULT '${field.default}'` : '';

    // Add column
    upStatements.push(
      `    await queryRunner.query(\`ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "${field.name}" ${pgType} ${nullableClause}${defaultClause}\`);`,
    );

    // Add index if specified
    if (field.indexed) {
      const idxName = `idx_user_profiles_${field.name}`;
      upStatements.push(
        `    await queryRunner.query(\`CREATE INDEX IF NOT EXISTS "${idxName}" ON "user_profiles" ("${field.name}")\`);`,
      );
      downStatements.push(`    await queryRunner.query(\`DROP INDEX IF EXISTS "${idxName}"\`);`);
    }

    // Add unique constraint if specified
    if (field.unique) {
      const uqName = `uq_user_profiles_${field.name}`;
      upStatements.push(
        `    await queryRunner.query(\`ALTER TABLE "user_profiles" ADD CONSTRAINT "${uqName}" UNIQUE ("${field.name}")\`);`,
      );
      downStatements.push(
        `    await queryRunner.query(\`ALTER TABLE "user_profiles" DROP CONSTRAINT IF EXISTS "${uqName}"\`);`,
      );
    }

    downStatements.push(
      `    await queryRunner.query(\`ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "${field.name}"\`);`,
    );
  }

  // Reverse down statements for clean rollback
  downStatements.reverse();

  const code = `import { MigrationInterface, QueryRunner } from 'typeorm';

export class ${className} implements MigrationInterface {
  name = '${className}';

  public async up(queryRunner: QueryRunner): Promise<void> {
${upStatements.join('\n')}
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
${downStatements.join('\n')}
  }
}
`;

  return {
    fileName,
    className,
    code,
  };
};
