// Initial Base Schema Migration for node-backend-toolkit
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialPackageMigration1700000000000 implements MigrationInterface {
  name = 'InitialPackageMigration1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Projects Table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "projects" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(100) NOT NULL UNIQUE,
        "slug" VARCHAR(100) NOT NULL UNIQUE,
        "status" VARCHAR(20) NOT NULL DEFAULT 'active',
        "description" TEXT,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_projects_slug" ON "projects" ("slug");`,
    );

    // 2. Roles Table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "roles" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "project_id" UUID NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
        "name" VARCHAR(50) NOT NULL,
        "description" VARCHAR(255),
        "is_system" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "idx_roles_project_name_unique" UNIQUE ("project_id", "name")
      );
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_roles_project_id" ON "roles" ("project_id");`,
    );

    // 3. Permissions Table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "permissions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "key" VARCHAR(100) NOT NULL UNIQUE,
        "name" VARCHAR(100) NOT NULL,
        "module" VARCHAR(50) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_permissions_key" ON "permissions" ("key");`,
    );

    // 4. Role Permissions Table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "role_permissions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "role_id" UUID NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
        "permission_id" UUID NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "idx_role_permissions_unique" UNIQUE ("role_id", "permission_id")
      );
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_role_permissions_role_id" ON "role_permissions" ("role_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_role_permissions_permission_id" ON "role_permissions" ("permission_id");`,
    );

    // 5. Users Table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "project_id" UUID NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
        "first_name" VARCHAR(100) NOT NULL,
        "last_name" VARCHAR(100) NOT NULL,
        "phone" VARCHAR(30),
        "email" VARCHAR(255) NOT NULL,
        "password" VARCHAR(255) NOT NULL,
        "avatar" TEXT,
        "role" VARCHAR(50) NOT NULL DEFAULT 'user',
        "status" VARCHAR(50) NOT NULL DEFAULT 'active',
        "language" VARCHAR(10) NOT NULL DEFAULT 'en',
        "created_by" UUID,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" UUID,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_by" UUID,
        "deleted_at" TIMESTAMP WITH TIME ZONE
      );
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_users_project_id" ON "users" ("project_id");`,
    );
    await queryRunner.query(`
      ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "uq_users_project_email";
      ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_project_id_email_key";
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_project_email_unique_active"
      ON "users" ("project_id", "email")
      WHERE "deleted_at" IS NULL;
    `);

    // 6. User Profiles Table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_profiles" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
        "project_id" UUID NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_user_profiles_user_id" ON "user_profiles" ("user_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_user_profiles_project_id" ON "user_profiles" ("project_id");`,
    );

    // 7. Sessions Table (Refresh Tokens)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sessions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "project_id" UUID NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
        "refresh_token" VARCHAR(500) NOT NULL UNIQUE,
        "ip_address" VARCHAR(45),
        "user_agent" TEXT,
        "is_revoked" BOOLEAN NOT NULL DEFAULT false,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_sessions_user_id" ON "sessions" ("user_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_sessions_project_id" ON "sessions" ("project_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_sessions_refresh_token" ON "sessions" ("refresh_token");`,
    );

    // 8. Password Reset Tokens Table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "project_id" UUID NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
        "email" VARCHAR(255) NOT NULL,
        "token" VARCHAR(255) NOT NULL UNIQUE,
        "is_used" BOOLEAN NOT NULL DEFAULT false,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_password_reset_tokens_project_id" ON "password_reset_tokens" ("project_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_password_reset_tokens_email" ON "password_reset_tokens" ("email");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_password_reset_tokens_token" ON "password_reset_tokens" ("token");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "password_reset_tokens";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sessions";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_profiles";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "projects";`);
  }
}
