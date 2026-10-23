# `node-backend-toolkit`

> A production-grade, multi-project reusable backend toolkit for Node.js, Express, TypeScript, TypeORM, and PostgreSQL.

---

## Features

- **Multi-Project Isolation**: Full data isolation per project via URL routing (`/api/:project_slug/...`) and database scoping.
- **Complete Authentication Flow**:
  - Self-Registration (`POST /auth/register`)
  - Login with JWT access tokens and long-lived refresh tokens (`POST /auth/login`)
  - Refresh Token Rotation & Invalidation (`POST /auth/refresh-token`)
  - Forgot Password & Reset Password with secure timed tokens (`POST /auth/forgot-password`, `POST /auth/reset-password`)
  - Password Management & Account Deletion
- **Dynamic Role-Based Access Control (RBAC)**:
  - System-protected `super_admin` role with automatic bypass
  - Dynamic configurable project roles with custom permissions
  - Declarative route protection via `hasPermission('users:create', ...)` middleware
- **Extensible User Profiles (Decision D01)**:
  - Real SQL columns dynamically managed on the `user_profiles` table without risking the core `users` table
  - Type-safe validation for 9 data types (`string`, `text`, `integer`, `decimal`, `boolean`, `date`, `datetime`, `uuid`, `enum`)
  - Automated TypeORM migration generation via CLI (`npx node-backend-toolkit generate-migration`)
- **Pluggable Storage Abstraction**:
  - AWS S3 & Cloudflare R2 providers
  - Project-scoped file paths (`:project_slug/:module/:timestamp-:uuid-:filename`)
  - Built-in MIME type and file size validation
- **Pluggable Email System**:
  - SMTP (Nodemailer) & Resend providers
  - Built-in responsive Handlebars HTML templates (welcome, password reset, security alert, account deleted)
  - Dynamic branding injection (`primaryColor`, `logoUrl`, `companyName`, `supportEmail`)
  - Optional custom background queue handler hook

---

## Installation

```bash
npm install node-backend-toolkit
npm install express typeorm pg reflect-metadata
```

*(Optional peer dependencies for Cloudflare R2 / AWS S3 and Resend)*:
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner resend
```

---

## Quick Start

```typescript
import express from 'express';
import { initializeBackend, errorHandlerMiddleware } from 'node-backend-toolkit';

async function bootstrap() {
  const app = express();
  app.use(express.json());

  // Initialize toolkit backend
  const { dataSource, project, router } = await initializeBackend({
    project: {
      name: 'Acme Health',
      slug: 'acme-health',
    },
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'acme_db',
    },
    auth: {
      jwt: {
        accessTokenSecret: process.env.JWT_ACCESS_SECRET!,
        refreshTokenSecret: process.env.JWT_REFRESH_SECRET!,
      },
      password: {
        minLength: 8,
        requireUppercase: true,
        requireDigit: true,
      },
    },
    superAdmin: {
      email: 'admin@acme.com',
      firstName: 'Super',
      lastName: 'Admin',
      password: 'AdminPassword123!',
    },
  });

  // Mount toolkit routes
  app.use('/api', router);

  // Central error handler
  app.use(errorHandlerMiddleware);

  app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
  });
}

bootstrap();
```

---

## Documentation

- [API Source of Truth](docs/API_SOURCE_OF_TRUTH.md) — Comprehensive REST API endpoint contract
- [Frontend Integration Guide](docs/FRONTEND_API_INTEGRATION.md) — Integration guide for frontend engineers (with Axios interceptor)
- [Configuration Reference](docs/CONFIGURATION_REFERENCE.md) — Complete configuration options
- [Migration Guide](docs/MIGRATION_GUIDE.md) — Base schema and dynamic field migrations

---

## License

MIT
