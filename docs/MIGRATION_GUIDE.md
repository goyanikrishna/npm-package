# Database Migration Guide

> How migrations and dynamic fields work in `node-backend-toolkit`.

---

## 1. Architecture

The package owns 8 foundational PostgreSQL tables:
1. `projects`
2. `roles`
3. `permissions`
4. `role_permissions`
5. `users`
6. `user_profiles`
7. `sessions`
8. `password_reset_tokens`

### 1.1 Separation of Concerns (Decision D01)
- The `users` table holds authentication-critical columns: `id`, `project_id`, `email`, `password`, `role`, `status`, audit fields.
- The `user_profiles` table (`1:1` with `users`) holds application-specific dynamic columns (e.g. `department`, `license_id`).
- This design ensures that modifying dynamic profile fields never endangers the core authentication table.

---

## 2. Generating Dynamic Fields Migrations

When you add new dynamic fields in `toolkit.config.json` (or via `initializeBackend`):

```json
{
  "users": {
    "fields": [
      { "name": "department", "type": "string", "max_length": 100, "required": true },
      { "name": "years_experience", "type": "integer", "nullable": true },
      { "name": "specialty", "type": "enum", "enum_values": ["cardiology", "neurology"] }
    ]
  }
}
```

Run the migration generator CLI:
```bash
npx node-backend-toolkit generate-migration --config=./toolkit.config.json --output=./src/database/migrations
```

This generates a timestamped TypeORM migration file:
```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDynamicFieldsToUserProfiles1700000000000 implements MigrationInterface {
  name = 'AddDynamicFieldsToUserProfiles1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "department" VARCHAR(100) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "years_experience" INTEGER NULL`);
    await queryRunner.query(`ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "specialty" VARCHAR(50) NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "specialty"`);
    await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "years_experience"`);
    await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "department"`);
  }
}
```

---

## 3. Running Migrations

You can run standard TypeORM migrations using the package's `AppDataSource`:

```bash
npx typeorm migration:run -d ./dist/database/datasource.js
```
Or programmatically:
```typescript
import { getDataSource } from 'node-backend-toolkit';

await getDataSource().runMigrations();
```
