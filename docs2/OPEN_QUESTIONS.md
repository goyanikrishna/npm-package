# ONYX Backend — Open Architectural Decisions & Questions

> **Decisions Requiring Team & Stakeholder Alignment**  
> *Tracked architectural questions, security findings, and roadmap decisions.*

---

## 1. Route Architecture & Documentation Divergence

- **Context**: `README.md` previously described plural RESTful endpoints (`/api/users`, `/api/users/:id`, `POST /api/auth/change-password`), but the actual codebase mounts routers using singular domain prefixes and action-suffixed routes (`/api/user/list`, `/api/user/get/:id?`, `PUT /api/user/change-password`, `/api/project/create`, `/api/project/list`, `/api/project/update`).
- **Technical Impact**: Frontend teams or external consumers reading `README.md` will construct invalid URLs.
- **Required Decision**: Confirm whether the current singular RPC-style routing (`/api/user/list`, `/api/project/create`) is the permanent standard, or if the team intends to migrate toward plural RESTful routes in a future version.
- **Current Resolution**: Established the current codebase routing as canonical in `DEVELOPER_GUIDE.md` and `docs/API_SOURCE_OF_TRUTH.md`.

---

## 2. Swagger / OpenAPI Documentation Strategy

- **Context**: `README.md` mentions `npm run swagger` and automated Swagger UI hosted at `/docs` or `/api-docs`. However, neither `swagger-autogen` nor `swagger-ui-express` are installed in `package.json`, and no swagger loader exists in `src/loaders/`.
- **Technical Impact**: Developers attempting to run `npm run swagger` or view `/docs` encounter errors.
- **Required Decision**: Should we:
  1. Install `swagger-autogen` and `swagger-ui-express` to restore interactive API documentation; OR
  2. Deprecate Swagger UI and maintain `docs/API_SOURCE_OF_TRUTH.md` and `docs/FRONTEND_API_INTEGRATION.md` as the authoritative source of truth?

---

## 3. Automated Testing Framework Adoption

- **Context**: `package.json` contains `"test": "echo \"Error: no test specified\" && exit 1"`. There are currently no automated unit or integration tests in the repository, although `src/database/index.ts` has a testing hook (`setMockDataSource`).
- **Technical Impact**: Regressions in critical calculation logic (EPD whole life carbon, LCA benchmarks, AI alternatives) cannot be caught automatically in CI.
- **Required Decision**: Agree on the testing framework to adopt (**Vitest** vs **Jest**) and install dependencies (`supertest`, test runners) to establish unit and endpoint regression suites.

---

## 4. Database Error Information Disclosure in `error.util.ts`

- **Context**: In `src/utils/error.util.ts` (lines 132-135):
  ```typescript
  } else if (err instanceof TypeORMError) {
    status = 500;
    message = err.stack || err.message;
  }
  ```
- **Technical Impact**: If an unhandled TypeORM error occurs, the server responds to the client with the full error stack or internal SQL error message, exposing database schema and file paths.
- **Required Decision**: Approve updating `error.util.ts` to log `err.stack` via `Logger.error()` while returning a localized generic error key `'common.database_error'` to the client.

---

## 5. Permission Key Inconsistency on EPD Verification Endpoint

- **Context**: In `src/routes/epd.route.ts` (line 63), `PUT /verification-status` is guarded by `checkPermissions(Permission.GET_EPD_VERIFICATION_STATUS)`.
- **Technical Impact**: A mutation endpoint that modifies verification checklist states is guarded by a GET permission rather than an UPDATE permission.
- **Required Decision**: Introduce `Permission.UPDATE_EPD_VERIFICATION_STATUS` in `src/constants/permission.constant.ts` and apply it to this route.

---

## 6. Controller Database Access & Cross-Controller Imports

- **Context**:
  - `src/controllers/epd.controller.ts` and `lca.controller.ts` import `projectController` from `./project.controller`.
  - Several controllers execute direct `AppDataSource.getRepository` and `AppDataSource.query` calls rather than delegating to services.
- **Technical Impact**: Tight coupling between controllers and lack of layer separation.
- **Required Decision**: Approve a refactoring roadmap to extract reusable business logic and data access queries from controllers into dedicated services (`project.service.ts`, `audit.service.ts`).

