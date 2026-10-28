# Changelog

All notable changes to `node-backend-toolkit` will be documented in this file.

## [1.0.2] - 2026-10-27

### Fixed
- **NPM Documentation Links**: Converted all documentation and license links in `README.md` to absolute GitHub repository URLs, preventing 404 errors when viewed on npmjs.com. Included `docs/` directory in published package bundle.
- **Dynamic Profile Updates**: Added `isPartial` validation support to `validateDynamicFields` so partial profile updates no longer fail required-field checks for untouched fields.
- **Top-Level Dynamic Fields Partitioning**: Enhanced `userService.createUser` and `userService.updateUser` to automatically extract configured profile attributes provided either directly in `req.body` or nested in `req.body.profile`.
- **Password Hashing on User Update**: Fixed vulnerability where updating a user's password via `userService.updateUser` saved plaintext credentials by adding explicit bcrypt hashing prior to persistence.
- **Express Sub-Router Param Inheritance**: Configured `createBackendRouter` with `{ mergeParams: true }`, ensuring `:project_slug` and other parent route parameters are properly inherited by sub-routes and middlewares.
- **Tenant Isolation on Refresh Tokens**: Added `project_id` scoping to `sessionService.findValidSession` and `sessionService.revokeSession` to prevent cross-tenant token replay.
- **Storage Path Traversal**: Hardened `storageService.buildStorageKey` by sanitizing `projectSlug` and `module` inputs against path traversal sequences.
- **Soft-Delete Unique Constraint**: Added safe migration commands to drop legacy unconditional unique constraints on the `users` table in favor of the active-only partial index.
- **Super Admin Privacy in User List**: Automatically excluded the system `super_admin` role from general `GET /users` directory queries to prevent exposure in standard user listings.

## [1.0.1] - 2026-10-23

### Enhanced
- Standardized package name to unscoped `node-backend-toolkit`.
- Added MIT `LICENSE` file.
- Added repository, issues, and homepage links pointing to GitHub.
- Enhanced `README.md` with Shields.io status badges, Mermaid architecture diagram, and feature matrix.
- Streamlined `prepublishOnly` build script.

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
