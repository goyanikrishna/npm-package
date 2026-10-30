# `node-backend-toolkit` — Audit, Architecture & Implementation Plan

---

## 1. Reference Project Audit Summary

### 1.1 Technology Stack (onyx-be)

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| HTTP | Express.js |
| ORM | TypeORM (PostgreSQL) |
| Validation | Joi + express-validation |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Email | Nodemailer (SMTP) + Resend SDK |
| Storage | AWS SDK v3 (Cloudflare R2 only) |
| Templates | Handlebars |
| Queue | BullMQ + Redis (ioredis) |
| Logging | Winston |
| i18n | Custom translation system |
| Naming | SnakeNamingStrategy (TypeORM) |

### 1.2 Architecture Classification

| Component | Classification | Notes |
|---|---|---|
| **User entity** | CONFIGURABLE | Base fields are reusable, but `job_title`, `company_id`, roles (`ADMIN`, `MANUFACTURER`, `ARCHITECT`, `DEVELOPER`), statuses are project-specific |
| **Company entity** | PROJECT_SPECIFIC | Onyx-specific domain entity — do NOT include in package |
| **Auth controller** (login, signup, forgot/reset password) | COMMON | Core auth flows — extractable with project isolation added |
| **User controller** (list, get, update, delete, change-password) | COMMON | Core user CRUD — extractable |
| **JWT utility** | COMMON | Simple sign/verify — directly reusable |
| **Token utility** | COMMON | Reset token create/verify — reusable |
| **Password hashing** (bcryptjs BeforeInsert) | COMMON | Extractable as separate service |
| **Authorization middleware** | COMMON | JWT verification + user status checks — reusable with project_id awareness |
| **Permission middleware** | CONFIGURABLE | Pattern is reusable, but the `allRoles` map is project-specific and must be configurable |
| **Permission constants** | PROJECT_SPECIFIC | 90+ Onyx-specific permissions — package needs generic `users:create`, `users:view` etc. |
| **Roles/enums** | PROJECT_SPECIFIC | `UserRole` enum is hardcoded (`ADMIN`, `MANUFACTURER`, etc.) — must be dynamic |
| **UserStatus enum** | CONFIGURABLE | The status concept is reusable, but values should be configurable |
| **Email service** | CONFIGURABLE | Provider pattern exists, but tightly coupled to BullMQ queues |
| **SMTP/Resend services** | COMMON | Clean provider implementations — directly extractable |
| **Template service** | COMMON | Handlebars rendering — reusable with configurable template paths |
| **Storage factory** | CONFIGURABLE | Only R2 is implemented — S3 provider must be added |
| **R2 provider** | COMMON | Clean implementation — extractable |
| **Database config** | CONFIGURABLE | Config pattern is reusable, entities list must be dynamic |
| **Seed (admin)** | COMMON | Bootstrap pattern — reusable with project-scoping |
| **Error handling** | COMMON | `ErrorHandler`, `APIError`, `handleError` — directly extractable |
| **Response utility** | COMMON | `sendResponse` — directly reusable |
| **Config** | CONFIGURABLE | Env-based Joi validation pattern is excellent — reusable |
| **i18n** | EXTENSION_POINT | Translation system exists — package should support but not mandate |
| **BullMQ/Redis** | PROJECT_SPECIFIC | Queue system is NOT part of the package — emails must be sent synchronously or via consumer-provided queue adapter |

### 1.3 Key Patterns to Adopt

1. **Comment style**: Section headers (`// Database`, `// Third-party modules`, `// Configs`, `// Enums`, etc.)
2. **Export style**: Named singleton objects (`export const authController = { ... }`)
3. **Error pattern**: Class hierarchy (`ErrorHandler` → `AuthException`, `NotFoundException`, etc.)
4. **Response format**: `{ success, status, message, data }` with i18n message keys
5. **Validation**: Joi schemas exported as `authParams.login`, `authParams.signup`, etc.
6. **Route pattern**: `router.route('/path').all(middleware).get/post/put/delete(validate(...), controller.method)`
7. **Database**: SnakeNamingStrategy, UUID primary keys, `created_at`/`updated_at`/`deleted_at`

---

## 2. Requirements Checklist

### Legend
- ✅ = Fully covered by requirements
- ⚠️ = Partially specified / needs decision
- ❌ = Gap identified / not in requirements

| # | Requirement | Req Sections | Status | Notes |
|---|---|---|---|---|
| R01 | Multi-project architecture (projects entity) | §3, §4 | ✅ | |
| R02 | Project creation/resolution | §4 | ✅ | |
| R03 | Project isolation (all queries scoped) | §5 | ✅ | |
| R04 | Base User model (18 fields) | §6 | ✅ | |
| R05 | Dynamic user fields (real SQL columns) | §7, §8, §10 | ✅ | |
| R06 | users vs user_profiles strategy | §9 | ⚠️ | Requirements suggest analyzing — decision needed |
| R07 | Dynamic migration generation CLI | §11 | ✅ | |
| R08 | Dynamic configurable roles | §12 | ✅ | |
| R09 | Super Admin per project | §13, §14 | ✅ | |
| R10 | Super Admin user management CRUD | §15 | ✅ | |
| R11 | Permission system (role → permissions) | §16 | ✅ | |
| R12 | User management security rules | §17 | ⚠️ | "Can SA delete another SA?" needs decision |
| R13 | Registration (POST /auth/register) | §18 | ✅ | |
| R14 | Login (POST /auth/login) | §19 | ✅ | |
| R15 | Forgot password (POST /auth/forgot-password) | §20 | ✅ | |
| R16 | Reset password (POST /auth/reset-password) | §21 | ✅ | |
| R17 | Profile (GET/PATCH /auth/profile) | §22 | ✅ | |
| R18 | Change password (POST /auth/change-password) | §23 | ✅ | |
| R19 | Logout (POST /auth/logout) | §24 | ⚠️ | JWT stateless — needs token blacklist strategy |
| R20 | Delete account (DELETE /auth/account) | §25 | ✅ | |
| R21 | Audit fields (created_by, updated_by, deleted_by) | §26 | ✅ | Reference project MISSING created_by/updated_by/deleted_by on User |
| R22 | Email provider abstraction (SMTP/Resend) | §27 | ✅ | |
| R23 | Dynamic email branding | §28 | ✅ | |
| R24 | Storage provider (S3/R2) | §29, §30, §31 | ✅ | S3 provider not in reference — must be built |
| R25 | File operations (upload, delete, URL, exists, metadata) | §30 | ✅ | |
| R26 | Project-aware storage paths | §32 | ✅ | |
| R27 | Central configuration object | §33 | ✅ | |
| R28 | Package must not own business logic | §34 | ✅ | |
| R29 | Framework-agnostic core + Express adapter | §35 | ⚠️ | Requirements say "isolate in adapters" — Express primary |
| R30 | Clean package structure | §36 | ✅ | |
| R31 | Public API exports | §37 | ✅ | |
| R32 | Database ownership documentation | §38 | ✅ | |
| R33 | Database constraints (UNIQUE project_id+email) | §39 | ✅ | |
| R34 | Project-scoped roles | §40 | ✅ | |
| R35 | Super Admin bootstrap (idempotent, transactional) | §41 | ✅ | |
| R36 | Security audit | §42 | ✅ | |
| R37 | Typed error classes | §43 | ✅ | |
| R38 | Dynamic field validation | §44 | ✅ | |
| R39 | Comprehensive tests | §45 | ✅ | |
| R40 | Backward compatibility | §46 | ✅ | |
| R41 | Refresh tokens | Task spec | ✅ | Confirmed: access + refresh token pair |
| R42 | NPM package build + pack | §47.J | ✅ | |

---

## 3. Identified Gaps & Required Decisions

### 3.1 Decisions Needed

> [!IMPORTANT]
> The following require your confirmation before implementation.

| # | Decision | My Recommendation | Impact |
|---|---|---|---|
| D01 | **users vs user_profiles split**: Where do dynamic fields go? | **Separate `user_profiles` table** — keeps the auth-critical `users` table stable, allows dynamic columns on `user_profiles` without risk to core auth. One-to-one relationship: `user_profiles.user_id → users.id`. | Schema design |
| D02 | **Can Super Admin delete another Super Admin?** | **No** — protect all Super Admin accounts from deletion. A Super Admin can create/update other users but cannot delete/demote another Super Admin. Self-deletion requires password confirmation. | Security policy |
| D03 | **Can Super Admin remove their own Super Admin role?** | **No** — prevent self-demotion to avoid lockout. | Security policy |
| D04 | **Logout strategy for stateless JWT** | **Refresh token rotation** — access tokens are short-lived (15min), refresh tokens stored in DB `sessions` table and revoked on logout. Provides real invalidation without Redis requirement. | Auth architecture |
| D05 | **Project context mechanism for login/registration** | **Project slug in URL path** — `POST /api/{project_slug}/auth/login`. The middleware resolves `project_slug → project_id`. Prevents client from submitting arbitrary `project_id`. | API design |
| D06 | **Email queue**: Reference uses BullMQ/Redis. Package should not require Redis. | **Synchronous by default** with an optional `emailQueue` hook for consumers to plug their own queue system. | Dependency reduction |
| D07 | **Dynamic field types for user_profiles** | Support: `string`, `text`, `integer`, `decimal`, `boolean`, `date`, `datetime`, `uuid`, `enum` as listed in requirements §10. | Schema flexibility |
| D08 | **Default status for self-registration** | **Configurable** — default `active` if not specified in config. Consumer can set `pending_verification` if admin approval is needed. | Registration flow |
| D09 | **Password policy defaults** | Min 8 chars, 1 uppercase, 1 lowercase, 1 digit. All configurable. | Security |
| D10 | **HTTP framework adapter** | **Express.js primary adapter** — framework-agnostic core services, Express adapter for routes/middleware. Other framework adapters (Fastify, etc.) can be added later. | Architecture |

### 3.2 Gaps in Reference Project (must fix in package)

| Gap | Reference Project State | Package Fix |
|---|---|---|
| **No project entity** | Single-tenant, no `projects` table | New `projects` table, project-scoped queries |
| **No project_id on users** | Global users, unique email globally | Add `project_id` FK, UNIQUE(project_id, email) |
| **No audit fields on users** | Missing `created_by`, `updated_by`, `deleted_by` | Add all 6 audit fields per requirements |
| **Hardcoded roles** | `enum UserRole { ADMIN, MANUFACTURER, ARCHITECT, DEVELOPER }` | Dynamic roles in `roles` table, project-scoped |
| **Hardcoded permissions** | 90+ Onyx-specific permissions in constant file | Dynamic `permissions` + `role_permissions` tables |
| **No refresh tokens** | Single JWT, no refresh/revocation | Add `sessions` table with refresh token |
| **No profile endpoint** | Profile is served via user controller | Dedicated `GET/PATCH /auth/profile` |
| **No logout endpoint** | No backend logout | `POST /auth/logout` — revoke refresh token |
| **No delete account** | No self-deletion | `DELETE /auth/account` with confirmation |
| **No S3 provider** | Only R2 | Add S3StorageProvider |
| **BullMQ dependency** | Email sent via queue | Direct email sending (queue optional hook) |
| **No dynamic fields** | Fields hardcoded in entity | Dynamic field system with migration generator |

---

## 4. Proposed Architecture

### 4.1 Package Structure

```
node-backend-toolkit/
├── src/
│   ├── config/
│   │   ├── index.ts                    # Configuration manager
│   │   └── types.ts                    # Config type definitions
│   │
│   ├── project/
│   │   ├── entities/
│   │   │   └── project.entity.ts
│   │   ├── services/
│   │   │   └── project.service.ts
│   │   └── types.ts
│   │
│   ├── auth/
│   │   ├── controllers/
│   │   │   └── auth.controller.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.service.ts
│   │   │   ├── password.service.ts
│   │   │   └── token.service.ts
│   │   ├── validators/
│   │   │   └── auth.validator.ts
│   │   └── types.ts
│   │
│   ├── user/
│   │   ├── entities/
│   │   │   ├── user.entity.ts
│   │   │   └── user-profile.entity.ts
│   │   ├── controllers/
│   │   │   └── user.controller.ts
│   │   ├── services/
│   │   │   └── user.service.ts
│   │   ├── validators/
│   │   │   └── user.validator.ts
│   │   └── types.ts
│   │
│   ├── role/
│   │   ├── entities/
│   │   │   ├── role.entity.ts
│   │   │   ├── permission.entity.ts
│   │   │   └── role-permission.entity.ts
│   │   ├── services/
│   │   │   └── role.service.ts
│   │   └── types.ts
│   │
│   ├── session/
│   │   ├── entities/
│   │   │   └── session.entity.ts
│   │   ├── services/
│   │   │   └── session.service.ts
│   │   └── types.ts
│   │
│   ├── email/
│   │   ├── providers/
│   │   │   ├── email-provider.interface.ts
│   │   │   ├── smtp.provider.ts
│   │   │   └── resend.provider.ts
│   │   ├── templates/
│   │   │   ├── welcome.handlebars
│   │   │   ├── forgot-password.handlebars
│   │   │   ├── password-reset.handlebars
│   │   │   ├── password-changed.handlebars
│   │   │   └── account-deleted.handlebars
│   │   ├── services/
│   │   │   ├── email.service.ts
│   │   │   └── template.service.ts
│   │   └── types.ts
│   │
│   ├── storage/
│   │   ├── providers/
│   │   │   ├── storage-provider.interface.ts
│   │   │   ├── s3.provider.ts
│   │   │   └── r2.provider.ts
│   │   ├── services/
│   │   │   └── storage.service.ts
│   │   ├── validators/
│   │   │   └── file.validator.ts
│   │   └── types.ts
│   │
│   ├── database/
│   │   ├── config.ts
│   │   ├── datasource.ts
│   │   ├── migrations/                 # Base schema migrations
│   │   └── dynamic-fields/
│   │       └── migration-generator.ts
│   │
│   ├── middleware/
│   │   ├── authorize.middleware.ts
│   │   ├── permission.middleware.ts
│   │   └── project-context.middleware.ts
│   │
│   ├── errors/
│   │   ├── base.error.ts
│   │   ├── auth.errors.ts
│   │   ├── user.errors.ts
│   │   ├── project.errors.ts
│   │   ├── storage.errors.ts
│   │   ├── email.errors.ts
│   │   └── error-handler.ts
│   │
│   ├── utils/
│   │   ├── response.util.ts
│   │   ├── pagination.util.ts
│   │   ├── email-normalizer.util.ts
│   │   └── validation.util.ts
│   │
│   ├── cli/
│   │   └── index.ts                    # CLI entry (npx node-backend-toolkit)
│   │
│   ├── adapters/
│   │   └── express/
│   │       ├── routes.ts               # Express router factory
│   │       └── index.ts
│   │
│   ├── bootstrap/
│   │   └── bootstrap.service.ts        # Project + roles + Super Admin bootstrap
│   │
│   └── index.ts                        # Public API exports
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── helpers/
│
├── docs/
│   ├── API_SOURCE_OF_TRUTH.md
│   ├── FRONTEND_API_INTEGRATION.md
│   ├── CONFIGURATION_REFERENCE.md
│   └── MIGRATION_GUIDE.md
│
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── .eslintrc.json
├── .prettierrc.json
├── README.md
└── CHANGELOG.md
```

### 4.2 Database Schema

```mermaid
erDiagram
    projects ||--o{ users : "has many"
    projects ||--o{ roles : "has many"
    roles ||--o{ role_permissions : "has many"
    permissions ||--o{ role_permissions : "has many"
    users ||--o| user_profiles : "has one"
    users ||--o{ sessions : "has many"
    users ||--o{ password_reset_tokens : "has many"

    projects {
        uuid id PK
        varchar name UK
        varchar slug UK
        varchar status
        timestamp created_at
        timestamp updated_at
    }

    users {
        uuid id PK
        uuid project_id FK
        varchar first_name
        varchar last_name
        varchar phone
        varchar email
        varchar password
        varchar avatar
        varchar role
        varchar status
        varchar language
        uuid created_by FK
        timestamp created_at
        uuid updated_by FK
        timestamp updated_at
        uuid deleted_by FK
        timestamp deleted_at
    }

    user_profiles {
        uuid id PK
        uuid user_id FK_UK
        uuid project_id FK
        timestamp created_at
        timestamp updated_at
    }

    roles {
        uuid id PK
        uuid project_id FK
        varchar name
        boolean is_system
        timestamp created_at
        timestamp updated_at
    }

    permissions {
        uuid id PK
        varchar key UK
        varchar name
        varchar module
        timestamp created_at
    }

    role_permissions {
        uuid id PK
        uuid role_id FK
        uuid permission_id FK
    }

    sessions {
        uuid id PK
        uuid user_id FK
        uuid project_id FK
        varchar refresh_token
        varchar ip_address
        varchar user_agent
        timestamp expires_at
        timestamp created_at
    }

    password_reset_tokens {
        uuid id PK
        uuid project_id FK
        varchar email
        varchar token
        timestamp expires_at
        timestamp created_at
        timestamp updated_at
    }
```

**Key constraints:**
- `UNIQUE(project_id, email)` on `users` — where `deleted_at IS NULL`
- `UNIQUE(project_id, name)` on `roles`
- `UNIQUE(role_id, permission_id)` on `role_permissions`
- `UNIQUE(user_id)` on `user_profiles`
- All `project_id` columns have FK to `projects.id`

### 4.3 API Routes Design

All routes are prefixed with `/api/{project_slug}/`:

| Method | Route | Auth | Permission | Purpose |
|---|---|---|---|---|
| `POST` | `/auth/register` | No | — | Self-registration |
| `POST` | `/auth/login` | No | — | Login (returns access + refresh tokens) |
| `POST` | `/auth/refresh-token` | No* | — | Refresh access token |
| `POST` | `/auth/forgot-password` | No | — | Request password reset email |
| `POST` | `/auth/reset-password` | No | — | Reset password with token |
| `GET` | `/auth/profile` | Yes | — | Get own profile |
| `PATCH` | `/auth/profile` | Yes | — | Update own profile |
| `POST` | `/auth/change-password` | Yes | — | Change own password |
| `POST` | `/auth/logout` | Yes | — | Logout (revoke refresh token) |
| `DELETE` | `/auth/account` | Yes | — | Delete own account |
| `POST` | `/users` | Yes | `users:create` | Create user (admin) |
| `GET` | `/users` | Yes | `users:list` | List project users |
| `GET` | `/users/:id` | Yes | `users:view` | Get user by ID |
| `PATCH` | `/users/:id` | Yes | `users:update` | Update user |
| `DELETE` | `/users/:id` | Yes | `users:delete` | Soft-delete user |

*`/auth/refresh-token` requires a valid refresh token in body, not a Bearer access token.

### 4.4 JWT Token Strategy

```
Login → { access_token (15min), refresh_token (7d) }
              │                         │
              ↓                         ↓
   Bearer header for API        Stored in `sessions` table
              │                         │
              ↓                         ↓
     Short-lived, stateless      Long-lived, revocable
              │                         │
              ↓                         ↓
       Expires → 401            POST /auth/refresh-token
                                        │
                                        ↓
                                New access_token (rotated)
```

Access token payload: `{ id, project_id, email, role }`
Refresh token: opaque random string stored in `sessions` table.

### 4.5 Dynamic Fields Strategy

```
Consumer Config                Package CLI                      Database
─────────────────         ─────────────────────          ──────────────────
userFields: [             npx node-backend-toolkit       ALTER TABLE
  { name: 'dept',          generate-migration             user_profiles
    type: 'string',              │                        ADD COLUMN dept
    nullable: true }             ↓                        VARCHAR NULL;
]                         Generates .ts migration    →
                          file for review
                                 │
                                 ↓
                          Developer runs migration
```

- Fields go to `user_profiles` table (not `users`)
- The `user_profiles` entity is dynamically extended at boot time via TypeORM's metadata API
- Migration files are generated as standard TypeORM migrations that the developer can review
- Field names validated: snake_case, no SQL-reserved words, no injection

### 4.6 Configuration Object (Full Example)

```typescript
import { initializeBackend } from 'node-backend-toolkit';

await initializeBackend({
  project: {
    name: 'therapist-platform',
  },

  database: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  },

  auth: {
    jwt: {
      access_token_secret: process.env.JWT_ACCESS_SECRET,
      refresh_token_secret: process.env.JWT_REFRESH_SECRET,
      access_token_expiry: '15m',     // default: '15m'
      refresh_token_expiry: '7d',     // default: '7d'
    },
    password: {
      min_length: 8,                 // default: 8
      require_uppercase: true,       // default: true
      require_lowercase: true,       // default: true
      require_digit: true,           // default: true
      require_special_char: false,    // default: false
      salt_rounds: 12,               // default: 12
    },
    registration: {
      defaultRole: 'user',          // default: first non-super_admin role
      default_status: 'active',      // default: 'active'
      requireEmailVerification: false, // default: false
    },
  },

  users: {
    fields: [
      {
        name: 'department',
        type: 'string',
        nullable: true,
        max_length: 100,
      },
      {
        name: 'joining_date',
        type: 'date',
        nullable: true,
      },
    ],
    statuses: ['active', 'inactive', 'suspended', 'pending_verification'],
  },

  roles: [
    {
      name: 'super_admin',
      permissions: [
        'users:create', 'users:view', 'users:list',
        'users:update', 'users:delete',
      ],
    },
    {
      name: 'manager',
      permissions: ['users:view', 'users:list'],
    },
    {
      name: 'user',
      permissions: [],
    },
  ],

  superAdmin: {
    email: process.env.SUPER_ADMIN_EMAIL!,
    first_name: process.env.SUPER_ADMIN_FNAME!,
    last_name: process.env.SUPER_ADMIN_LNAME!,
    password: process.env.SUPER_ADMIN_PASSWORD!,
  },

  email: {
    provider: 'smtp',
    from: 'noreply@example.com',
    smtp: {
      host: process.env.SMTP_HOST!,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
    },
  },

  branding: {
    project_name: 'Therapist Platform',
    logo_url: 'https://example.com/logo.png',
    primary_color: '#4F46E5',
    support_email: 'support@example.com',
    frontend_url: 'https://app.example.com',
    company_name: 'Example Corp',
  },

  storage: {
    provider: 'r2',
    bucket: process.env.R2_BUCKET!,
    region: 'auto',
    accountId: process.env.R2_ACCOUNT_ID!,
    access_key_id: process.env.R2_ACCESS_KEY_ID!,
    secret_access_key: process.env.R2_SECRET_ACCESS_KEY!,
    public_url: process.env.R2_PUBLIC_URL!,
  },
});
```

---

## 5. Module-wise Implementation Plan

### Phase 1: Foundation (Priority: Critical)

| Order | Module | Deliverables | Dependencies |
|---|---|---|---|
| 1.1 | **Package Scaffold** | `package.json`, `tsconfig.json`, `tsconfig.build.json`, `.eslintrc.json`, `.prettierrc.json`, folder structure, build scripts | None |
| 1.2 | **Config System** | Config types, config manager, validation, defaults | 1.1 |
| 1.3 | **Error System** | Base error classes, all typed errors from requirements (§43), error handler middleware | 1.1 |
| 1.4 | **Utils** | Response utility, pagination, email normalizer, validation helpers | 1.1 |
| 1.5 | **Database Core** | DataSource factory, connection config, SnakeNamingStrategy | 1.2 |

### Phase 2: Core Entities & Auth (Priority: Critical)

| Order | Module | Deliverables | Dependencies |
|---|---|---|---|
| 2.1 | **Project Module** | Project entity, project service (create/resolve), types | 1.5 |
| 2.2 | **Role & Permission Module** | Role, Permission, RolePermission entities, role service, permission seeding | 2.1 |
| 2.3 | **User Module** | User entity (with project_id + audit fields), user service | 2.1 |
| 2.4 | **User Profile Module** | UserProfile entity, dynamic field metadata, profile service | 2.3 |
| 2.5 | **Session Module** | Session entity, session service (create/revoke/refresh) | 2.3 |
| 2.6 | **Password Reset Module** | PasswordResetToken entity, token service | 2.3 |
| 2.7 | **Auth Services** | JWT service (access+refresh), password service (hash/verify), auth service (orchestration) | 2.3, 2.5, 2.6 |

### Phase 3: Middleware & Controllers (Priority: Critical)

| Order | Module | Deliverables | Dependencies |
|---|---|---|---|
| 3.1 | **Project Context Middleware** | Resolve project_slug → project_id from URL | 2.1 |
| 3.2 | **Authorize Middleware** | JWT verification, user status validation, project-scoping | 2.7 |
| 3.3 | **Permission Middleware** | Role-based permission checking (dynamic) | 2.2 |
| 3.4 | **Auth Controller** | register, login, refresh-token, forgot-password, reset-password, profile (get/update), change-password, logout, delete-account | 2.7, 3.2 |
| 3.5 | **User Controller** | create, list, get, update, delete (admin operations) | 2.3, 3.3 |
| 3.6 | **Validation** | Auth validators, user validators, dynamic field validation | 3.4, 3.5 |

### Phase 4: Email & Storage (Priority: High)

| Order | Module | Deliverables | Dependencies |
|---|---|---|---|
| 4.1 | **Email Provider Interface** | Provider abstraction, factory | 1.2 |
| 4.2 | **SMTP Provider** | Nodemailer-based provider | 4.1 |
| 4.3 | **Resend Provider** | Resend SDK-based provider | 4.1 |
| 4.4 | **Template Service** | Handlebars rendering, branding injection | 4.1 |
| 4.5 | **Email Service** | Welcome, forgot-password, password-reset, password-changed, account-deleted templates | 4.2, 4.3, 4.4 |
| 4.6 | **Storage Provider Interface** | Provider abstraction | 1.2 |
| 4.7 | **R2 Storage Provider** | Cloudflare R2 implementation (from reference) | 4.6 |
| 4.8 | **S3 Storage Provider** | AWS S3 implementation (NEW) | 4.6 |
| 4.9 | **Storage Service** | Upload, delete, getUrl, exists, metadata, file validation | 4.7, 4.8 |

### Phase 5: Express Adapter & Bootstrap (Priority: High)

| Order | Module | Deliverables | Dependencies |
|---|---|---|---|
| 5.1 | **Express Router Factory** | Creates Express router with all package routes | 3.4, 3.5 |
| 5.2 | **Bootstrap Service** | `initializeBackend()` — project creation, role seeding, Super Admin, idempotent | All Phase 2 |
| 5.3 | **Public API (index.ts)** | Clean exports: `initializeBackend`, `createRouter`, modules, types, errors | All |

### Phase 6: Dynamic Fields & CLI (Priority: High)

| Order | Module | Deliverables | Dependencies |
|---|---|---|---|
| 6.1 | **Dynamic Field Config Parser** | Validate field definitions, SQL-injection prevention | 1.2 |
| 6.2 | **Migration Generator** | Generate TypeORM migration files for user_profiles columns | 6.1 |
| 6.3 | **CLI Tool** | `npx node-backend-toolkit generate-migration` command | 6.2 |
| 6.4 | **Dynamic Entity Extension** | Runtime TypeORM metadata for user_profiles based on config | 6.1 |

### Phase 7: Base Migrations (Priority: High)

| Order | Module | Deliverables | Dependencies |
|---|---|---|---|
| 7.1 | **Initial Migration** | Creates all package-owned tables: projects, users, user_profiles, roles, permissions, role_permissions, sessions, password_reset_tokens | All entities |

### Phase 8: Testing (Priority: Critical)

| Order | Module | Tests |
|---|---|---|
| 8.1 | **Project tests** | Create, duplicate, isolation, bootstrap, idempotent |
| 8.2 | **Auth tests** | Register, login, refresh, forgot/reset password, profile, change-password, logout, delete-account |
| 8.3 | **User management tests** | CRUD, cross-project isolation, SA authorization, permissions |
| 8.4 | **Dynamic fields tests** | All 9 types, required/nullable/unique/indexed, invalid names |
| 8.5 | **Email tests** | SMTP mock, Resend mock, branding, templates, provider failure |
| 8.6 | **Storage tests** | S3/R2 mocks, upload, delete, MIME validation, size limits, project paths |
| 8.7 | **Security tests** | JWT expiry, refresh rotation, cross-project tokens, IDOR, SA protection |

### Phase 9: Documentation & Release (Priority: High)

| Order | Deliverable |
|---|---|
| 9.1 | README.md |
| 9.2 | docs/API_SOURCE_OF_TRUTH.md |
| 9.3 | docs/FRONTEND_API_INTEGRATION.md |
| 9.4 | docs/CONFIGURATION_REFERENCE.md |
| 9.5 | docs/MIGRATION_GUIDE.md |
| 9.6 | npm build verification |
| 9.7 | npm pack + inspection |

---

## 6. Package-Owned Tables

| Table | Purpose |
|---|---|
| `projects` | Multi-project registry |
| `users` | User accounts (auth + identity) |
| `user_profiles` | Extended/dynamic profile fields |
| `roles` | Project-scoped roles |
| `permissions` | Permission definitions |
| `role_permissions` | Role → Permission mapping |
| `sessions` | Refresh tokens / active sessions |
| `password_reset_tokens` | Password reset flow |

---

## 7. Dependencies (Minimal)

| Dependency | Purpose | Peer/Direct |
|---|---|---|
| `typeorm` | ORM | Peer |
| `pg` | PostgreSQL driver | Peer |
| `reflect-metadata` | TypeORM decorators | Peer |
| `express` | HTTP framework | Peer |
| `jsonwebtoken` | JWT signing/verification | Direct |
| `bcryptjs` | Password hashing | Direct |
| `joi` | Validation | Direct |
| `express-validation` | Express + Joi bridge | Direct |
| `nodemailer` | SMTP email | Direct |
| `resend` | Resend email | Direct (optional peer) |
| `@aws-sdk/client-s3` | S3/R2 storage | Direct (optional peer) |
| `@aws-sdk/s3-request-presigner` | Presigned URLs | Direct (optional peer) |
| `handlebars` | Email templates | Direct |
| `typeorm-naming-strategies` | Snake case naming | Direct |

> [!TIP]
> Storage SDKs and Resend will be **optional peer dependencies** — consumers only install what they use.

---

## 8. Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| Dynamic field migration generator producing unsafe SQL | High | Strict field name validation (regex whitelist), parameterized DDL, no user input in column names without sanitization |
| Cross-project data leak via JWT or query bypass | High | Project_id embedded in JWT, all service methods require project_id parameter, middleware enforces project context |
| TypeORM dynamic entity metadata at runtime | Medium | Well-tested approach using `EntitySchema` or metadata API; fallback to code-generated entity files |
| Package size bloat from optional providers | Low | Tree-shakeable exports, optional peer dependencies |
| Breaking changes to reference project's API format | Medium | Maintain same `{ success, status, message, data }` response shape |

---

## 9. Next Steps

> [!IMPORTANT]
> **Awaiting your approval on the 10 decisions in Section 3.1 before proceeding with implementation.**

Once approved, I will implement in the order defined in Section 5, module by module, with tests and documentation updated at each phase.
