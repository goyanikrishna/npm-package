# Configuration Reference Guide

> Complete reference for initializing `@node-backend-toolkit/core`.

---

## 1. Quick Example

```typescript
import { initializeBackend } from '@node-backend-toolkit/core';

const { dataSource, project, router } = await initializeBackend({
  project: {
    name: 'Healthcare Platform',
    slug: 'health-platform', // optional, auto-slugified from name
  },

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'healthcare_db',
    poolSize: 10,
  },

  auth: {
    jwt: {
      accessTokenSecret: process.env.JWT_ACCESS_SECRET!,
      refreshTokenSecret: process.env.JWT_REFRESH_SECRET!,
      accessTokenExpiry: '15m',
      refreshTokenExpiry: '7d',
    },
    password: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireDigit: true,
      requireSpecialChar: false,
      saltRounds: 12,
    },
    registration: {
      defaultRole: 'user',
      defaultStatus: 'active',
    },
  },

  users: {
    fields: [
      { name: 'department', type: 'string', maxLength: 100, required: true },
      { name: 'license_id', type: 'string', maxLength: 50, unique: true },
      { name: 'years_active', type: 'integer', nullable: true },
      { name: 'specialty', type: 'enum', enumValues: ['general', 'pediatrics', 'surgery'] },
    ],
    statuses: ['active', 'inactive', 'suspended'],
  },

  roles: [
    {
      name: 'manager',
      description: 'Department Manager',
      permissions: ['users:view', 'users:list'],
    },
    {
      name: 'practitioner',
      description: 'Healthcare Practitioner',
      permissions: [],
    },
  ],

  superAdmin: {
    email: process.env.SUPER_ADMIN_EMAIL!,
    firstName: process.env.SUPER_ADMIN_FNAME!,
    lastName: process.env.SUPER_ADMIN_LNAME!,
    password: process.env.SUPER_ADMIN_PASSWORD!,
  },

  email: {
    provider: 'smtp',
    from: 'noreply@healthcare.com',
    smtp: {
      host: process.env.SMTP_HOST!,
      port: Number(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
    },
  },

  branding: {
    projectName: 'Healthcare Platform Pro',
    companyName: 'Healthcare Global Inc.',
    logoUrl: 'https://healthcare.com/logo.png',
    primaryColor: '#0ea5e9',
    supportEmail: 'support@healthcare.com',
    frontendUrl: 'https://app.healthcare.com',
  },

  storage: {
    provider: 'r2',
    bucket: process.env.R2_BUCKET!,
    accountId: process.env.R2_ACCOUNT_ID!,
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    publicUrl: process.env.R2_PUBLIC_URL,
  },
});
```

---

## 2. Configuration Options Breakdown

### `project`
- `name` *(string, required)*: Human-readable project name.
- `slug` *(string, optional)*: URL-safe slug identifier. Auto-derived if omitted.
- `description` *(string, optional)*: Project description.

### `database`
- `host` *(string, required)*: PostgreSQL host.
- `port` *(number, required)*: PostgreSQL port (default: 5432).
- `username` *(string, required)*: DB username.
- `password` *(string, optional)*: DB password.
- `database` *(string, required)*: Database name.
- `poolSize` *(number, optional)*: Max connection pool size (default: 10).
- `ssl` *(boolean | object, optional)*: SSL configuration.

### `auth`
- `jwt.accessTokenSecret` *(string, required)*: Min 16 chars secret.
- `jwt.refreshTokenSecret` *(string, required)*: Min 16 chars secret.
- `jwt.accessTokenExpiry` *(string | number, default: '15m')*: Expiry format (`'15m'`, `'1h'`).
- `jwt.refreshTokenExpiry` *(string | number, default: '7d')*: Expiry format (`'7d'`, `'30d'`).
- `password.minLength` *(number, default: 8)*: Min password length.
- `password.requireUppercase` *(boolean, default: true)*.
- `password.requireLowercase` *(boolean, default: true)*.
- `password.requireDigit` *(boolean, default: true)*.
- `password.requireSpecialChar` *(boolean, default: false)*.
- `password.saltRounds` *(number, default: 12)*.

### `users.fields` (Dynamic Profile Fields)
Allowed dynamic types:
- `string`: standard string with optional `maxLength`.
- `text`: unbounded text.
- `integer`: 32-bit signed integer.
- `decimal`: 12,2 decimal number.
- `boolean`: boolean flag.
- `date`: date without time (`YYYY-MM-DD`).
- `datetime`: timestamp with timezone.
- `uuid`: UUID v4 string.
- `enum`: string with required `enumValues: string[]`.
