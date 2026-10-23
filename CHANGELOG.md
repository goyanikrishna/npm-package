# Changelog

All notable changes to `node-backend-toolkit` will be documented in this file.

## [1.0.0] - 2026-10-16

### Added
- **Multi-Project Isolation**: Full database multi-tenant isolation via project slugs (`/api/:project_slug/...`).
- **Core Entities**: `Project`, `User`, `UserProfile`, `Role`, `Permission`, `RolePermission`, `Session`, `PasswordResetToken`.
- **Authentication**:
  - Registration with dynamic profile support.
  - Login returning short-lived access token (15m) and long-lived refresh token (7d).
  - Refresh token rotation and invalidation in `sessions` table.
  - Password reset with 60-minute single-use secure tokens.
  - Password change and secure account self-deletion.
- **Dynamic User Profiles (Decision D01)**:
  - Extensible fields on `user_profiles` with validation across 9 types.
  - CLI tool `node-backend-toolkit generate-migration` for automated TypeORM DDL generation.
- **Role-Based Access Control (RBAC)**:
  - System-protected `super_admin` role with automatic bypass.
  - Dynamic configurable roles and permissions.
  - Prevention of Super Admin deletion and self-demotion.
- **Pluggable Storage Abstraction**:
  - AWS S3 and Cloudflare R2 storage providers.
  - Project-scoped storage path isolation.
  - File size and MIME type validation.
- **Pluggable Email System**:
  - SMTP and Resend providers.
  - Built-in Handlebars HTML templates for all authentication flows with branding injection.
  - Optional custom background queue hook.
- **Documentation**:
  - `API_SOURCE_OF_TRUTH.md`
  - `FRONTEND_API_INTEGRATION.md`
  - `CONFIGURATION_REFERENCE.md`
  - `MIGRATION_GUIDE.md`
