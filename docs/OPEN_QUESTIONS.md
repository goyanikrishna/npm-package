# Open Questions & Architecture Decisions

This document tracks resolved architecture decisions, open design questions, and future enhancement paths for `node-backend-toolkit` in accordance with the specification in `Untitled`.

---

## 1. Resolved Architecture Decisions

### Decision D01: User vs User Profile Separation for Dynamic Fields
- **Question**: Where should dynamic, project-configured fields be stored in SQL?
- **Decision**: Dedicated `user_profiles` table linked via foreign key (`user_profiles.user_id -> users.id`) with 1-to-1 relationship.
- **Rationale**: Keeps the core authentication table (`users`) completely immutable and stable across all consuming projects. Dynamic project fields are generated on `user_profiles` as real, typed, indexed SQL columns via automated TypeORM migrations.

### Decision D02: Super Admin Account Protection
- **Question**: Can a Super Admin delete another Super Admin or demote themselves?
- **Decision**: No. All users holding the `super_admin` role are protected against deletion and role reassignment. Self-deletion and cross-deletion of Super Admins are strictly prevented to avoid lockout.

### Decision D03: Stateless JWT Invalidation
- **Question**: How is logout and token invalidation enforced with stateless JWTs without requiring Redis?
- **Decision**: Database-backed refresh token rotation (`sessions` table). Access tokens are short-lived (15 minutes). When `POST /auth/logout` is called, the corresponding session and refresh token are immediately revoked in PostgreSQL.

### Decision D04: Multi-Tenant Project Context Resolution
- **Question**: How does the backend securely identify the target project during unauthenticated calls (e.g. login/registration)?
- **Decision**: Project slug in the URL path (`/api/:project_slug/...`) and header fallback (`x-project-slug`). Clients cannot forge arbitrary `project_id` values in request bodies.

### Decision D05: Email & Storage Pluggability
- **Question**: How are third-party services kept decoupled from core business logic?
- **Decision**: Provider abstraction interfaces (`IEmailProvider`, `IStorageProvider`). Email supports SMTP and Resend with optional queue hooks. Storage supports AWS S3 and Cloudflare R2 with project-scoped path isolation.

---

## 2. Open Questions / Future Enhancements

| Item | Topic | Current Behavior | Potential Future Evolution |
|---|---|---|---|
| **OQ-01** | Cross-Project Super Admin | Super Admin is strictly project-scoped | Potential global admin portal across projects |
| **OQ-02** | Social OAuth Providers | Not in core spec (Email/Password primary) | Optional Google/Apple/GitHub OAuth strategies |
| **OQ-03** | Distributed Cache / Redis Adapter | Direct PostgreSQL sessions and direct email | Optional Redis session caching adapter plugin |
