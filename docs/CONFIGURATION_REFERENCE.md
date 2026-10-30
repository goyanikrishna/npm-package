# Configuration Reference Guide

> Complete reference for initializing `node-backend-toolkit`.

---

## 1. Quick Example

```typescript
import { initializeBackend } from 'node-backend-toolkit';

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
      access_token_secret: process.env.JWT_ACCESS_SECRET!,
      refresh_token_secret: process.env.JWT_REFRESH_SECRET!,
      access_token_expiry: '15m',
      refresh_token_expiry: '7d',
    },
    password: {
      min_length: 8,
      require_uppercase: true,
      require_lowercase: true,
      require_digit: true,
      require_special_char: false,
      salt_rounds: 12,
    },
    registration: {
      defaultRole: 'user',
      default_status: 'active',
    },
  },

  users: {
    fields: [
      { name: 'department', type: 'string', max_length: 100, required: true },
      { name: 'license_id', type: 'string', max_length: 50, unique: true },
      { name: 'years_active', type: 'integer', nullable: true },
      { name: 'specialty', type: 'enum', enum_values: ['general', 'pediatrics', 'surgery'] },
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
    first_name: process.env.SUPER_ADMIN_FNAME!,
    last_name: process.env.SUPER_ADMIN_LNAME!,
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
    project_name: 'Healthcare Platform Pro',
    company_name: 'Healthcare Global Inc.',
    logo_url: 'https://healthcare.com/logo.png',
    primary_color: '#0ea5e9',
    support_email: 'support@healthcare.com',
    frontend_url: 'https://app.healthcare.com',
  },

  storage: {
    provider: 'r2',
    bucket: process.env.R2_BUCKET!,
    accountId: process.env.R2_ACCOUNT_ID!,
    access_key_id: process.env.R2_ACCESS_KEY_ID!,
    secret_access_key: process.env.R2_SECRET_ACCESS_KEY!,
    public_url: process.env.R2_PUBLIC_URL,
  },
});
```

---

## 2. Configuration Options Breakdown

### `project`

- `name` _(string, required)_: Human-readable project name.
- `slug` _(string, optional)_: URL-safe slug identifier. Auto-derived if omitted.
- `description` _(string, optional)_: Project description.

### `database`

- `host` _(string, required)_: PostgreSQL host.
- `port` _(number, required)_: PostgreSQL port (default: 5432).
- `username` _(string, required)_: DB username.
- `password` _(string, optional)_: DB password.
- `database` _(string, required)_: Database name.
- `poolSize` _(number, optional)_: Max connection pool size (default: 10).
- `ssl` _(boolean | object, optional)_: SSL configuration.

### `auth`

- `jwt.access_token_secret` _(string, required)_: Min 16 chars secret.
- `jwt.refresh_token_secret` _(string, required)_: Min 16 chars secret.
- `jwt.access_token_expiry` _(string | number, default: '15m')_: Expiry format (`'15m'`, `'1h'`).
- `jwt.refresh_token_expiry` _(string | number, default: '7d')_: Expiry format (`'7d'`, `'30d'`).
- `password.min_length` _(number, default: 8)_: Min password length.
- `password.require_uppercase` _(boolean, default: true)_.
- `password.require_lowercase` _(boolean, default: true)_.
- `password.require_digit` _(boolean, default: true)_.
- `password.require_special_char` _(boolean, default: false)_.
- `password.salt_rounds` _(number, default: 12)_.

### `users.fields` (Dynamic Profile Fields)

Allowed dynamic types:

- `string`: standard string with optional `max_length`.
- `text`: unbounded text.
- `integer`: 32-bit signed integer.
- `decimal`: 12,2 decimal number.
- `boolean`: boolean flag.
- `date`: date without time (`YYYY-MM-DD`).
- `datetime`: timestamp with timezone.
- `uuid`: UUID v4 string.
- `enum`: string with required `enum_values: string[]`.
