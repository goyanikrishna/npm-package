# AI Coding Agent Instructions — ONYX Backend (`onyx-be`)

> **Authoritative instructions for AI Coding Agents, LLM assistants, and automated contributors.**  
> *Every AI coding agent operating in this repository MUST strictly follow these instructions without exception.*

---

## 1. Prime Directive

Before generating or modifying any code in this repository:
1. **Read `DEVELOPER_GUIDE.md`** thoroughly to understand established project architecture, path aliases, coding conventions, and layer boundaries.
2. **Inspect the existing implementation** of related modules before creating new files or modifying existing patterns.
3. **Never guess business requirements, permissions, database schemas, or route structures.** Check `docs/API_SOURCE_OF_TRUTH.md` and existing code.

---

## 2. Core Architectural & Code Rules

### 2.1 Layer Separation (No Fat Controllers)
- **Routes (`src/routes/`)**: Mount endpoints, apply `authorize` middleware, attach `checkPermissions(...)`, apply `validate(schema, { context: true })`, and delegate to controller methods.
- **Controllers (`src/controllers/`)**: Extract inputs from `req`, call service methods, and return standard JSON using `sendResponse(res, data, 'message.key')`.
  - **NEVER** write raw SQL queries or execute direct database entity manipulation inside controllers.
  - **NEVER** import one controller into another controller.
- **Services (`src/services/`)**: Implement business logic, multi-table transactions, external API integrations (R2, OpenAI, Mail), and queue job dispatches.
- **Validators (`src/validators/`)**: Define strict Joi schemas for `params`, `query`, `body`, and `headers`.
- **Models (`src/models/`)**: Define TypeORM entities using `snake_case` database table and column names.
- **Queues & Workers (`src/queues/`, `src/workers/`)**: Offload asynchronous operations (emails, media processing, cleanup) to BullMQ.

### 2.2 Imports & Path Aliases
- **Always use path aliases** defined in `tsconfig.json` (`@config/*`, `@constant/*`, `@controller/*`, `@database`, `@enum/*`, `@i18n`, `@loader/*`, `@logger/*`, `@middleware/*`, `@model/*`, `@query/*`, `@queue/*`, `@resource/*`, `@route/*`, `@service/*`, `@type/*`, `@util/*`, `@validator/*`, `@worker/*`).
- **NEVER** use relative imports crossing module boundaries (e.g. `../loggers`, `../database/seeds/...`).
- **NEVER** use bare unaliased imports (e.g. `from 'configs'`, `from 'routes'`).
- **Use `import type`** for all type-only imports to prevent circular dependencies.

### 2.3 Naming & Suffix Conventions
- **Files**: `kebab-case.<category>.ts` (e.g. `user.controller.ts`, `project.validator.ts`, `company.service.ts`).
- **Interfaces**: `PascalCase` with `I` prefix (e.g. `IUserResponse`, `IProjectPayload`).
- **Payload Types**: Use `...Payload` for request bodies, `...Query` for query strings, `...Response` for API outputs. **Do not use `Dto` or `Input`.**
- **Enums**: `PascalCase` enum name with `UPPER_SNAKE_CASE` members (e.g. `UserRole.ADMIN`).
- **Database & Payload Fields**: `snake_case` (e.g. `company_id`, `first_name`, `created_at`).
- **Booleans**: Prefix with `is`, `has`, `can`, or `should` (e.g. `isActive`, `hasPermission`).

### 2.4 Messages & Internationalization
- **NEVER** hardcode user-facing strings in controllers or validators.
- Store all messages in `src/i18n/locales/en.ts` (and its counterpart files `ar.ts`, `de.ts`, `fr.ts`, `nl.ts`).
- Reference keys using `t('domain.key', req.language)`.

### 2.5 Security, Error Handling & Logging
- **Always use parameterized queries** (`$1`, `$2`) when writing raw SQL. Never concatenate untrusted user input.
- **Never expose internal stack traces**, database driver errors, or SQL statements to clients.
- Use `Logger` from `@logger/index`. **NEVER use `console.log` or `console.error` in production code.**
- Check RBAC permissions on all protected routes using `checkPermissions(Permission.KEY)`.

---

## 3. Preservation & Quality Guardrails

1. **Preserve Existing Code**: Do NOT rewrite working architecture or refactor unrelated files when implementing a feature or fixing a bug.
2. **Backward Compatibility**: Ensure changes to database entities or shared utilities do not break existing routes.
3. **No Unnecessary Dependencies**: Do NOT install new npm packages unless strictly required and existing libraries cannot fulfill the requirement.
4. **No Code Duplication**: Check `@util/` and `@service/` for existing utilities (e.g. `formatDate`, `sendResponse`, `getPaginationParams`, `paginate`, `formatCleanNumber`) before creating duplicates.

---

## 4. Required Verification Checklist

After generating or modifying code, the AI agent MUST run and verify the following commands in order:

```bash
# 1. Verify TypeScript types compile cleanly
npm run type-check

# 2. Check for ESLint warnings and errors
npm run lint

# 3. Verify Prettier formatting compliance
npm run format:check

# 4. Verify production build succeeds
npm run build
```

---

## 5. Agent Reporting Format

When completing a task, the AI agent MUST provide a concise summary containing:
- **Files Created / Modified**: List of all affected files with basenames.
- **Standards Followed**: Architectural layers and conventions applied.
- **Verification Results**: Status of `type-check`, `lint`, `format:check`, and `build`.
- **Documentation Updates**: Confirmation that `docs/API_SOURCE_OF_TRUTH.md` and `docs/FRONTEND_API_INTEGRATION.md` were updated if endpoints or contracts changed.
- **Open Questions / Risks**: Any potential edge cases or architectural decisions requiring human review.

