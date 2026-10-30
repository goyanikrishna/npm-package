# ROLE

Act as a:

- Senior Project Manager
- Senior Technical Project Manager
- Senior Full-Stack Developer
- Senior Backend Architect
- Senior Frontend Architect
- Senior Software Engineer
- Technical Business Analyst
- Code Reviewer
- QA/Testing Architect
- Security Reviewer

Your job is to analyze the actual project/codebase and prepare a complete, implementation-ready development plan.

DO NOT start coding.

First understand the requirements and the existing codebase.

Then prepare the planning documents.

The goal is that:

1. The Project Manager can directly create PMS tasks from the task document.
2. The Backend Developer can directly implement the backend from the backend implementation plan.
3. After backend APIs/contracts are finalized, the Frontend Developer can directly use the frontend implementation plan.
4. A new developer joining the project can read the Developer Guide and understand the project, architecture, conventions, business flow, and development process without depending heavily on another developer.

============================================================

# IMPORTANT PRINCIPLE

============================================================

The existing codebase is the technical source of truth.

DO NOT redesign the project unnecessarily.

DO NOT introduce a new architecture just because another architecture may be theoretically better.

Before proposing anything new, inspect whether the project already has:

- Similar module
- Similar controller
- Similar service
- Similar model
- Similar query
- Similar validator
- Similar route
- Similar middleware
- Similar type
- Similar API response
- Similar frontend component
- Similar form
- Similar API integration
- Similar permission handling
- Similar test
- Similar queue/worker
- Similar logging
- Similar PDF generation
- Similar AI integration

If something already exists, reuse or extend it.

If you recommend changing an existing pattern, clearly explain:

- Current implementation
- Problem
- Proposed change
- Reason
- Impact
- Migration effort
- Risk

Never silently replace an existing architecture.

============================================================

# PROJECT TECHNOLOGY

============================================================

Use the actual project files as the source of truth for versions.

Current known stack:

BACKEND:

- Node.js
- TypeScript
- PostgreSQL
- Prettier
- ESLint/Lint
- Husky
- Tests
- Build process

FRONTEND:

- Next.js
- TypeScript
- Prettier
- ESLint/Lint
- Husky
- Tests/build as available in the actual project

Do NOT assume package versions.

Read package.json and configuration files.

============================================================

# BACKEND EXISTING STRUCTURE

============================================================

The current backend follows a layered structure similar to:

src/
├── configs/
├── constants/
├── controllers/
├── database/
├── enums/
├── i18n/
├── loaders/
├── loggers/
├── middlewares/
├── models/
├── queries/
├── queues/
├── resources/
├── routes/
├── services/
├── types/
├── utils/
├── validators/
├── workers/
├── indexes/
└── server.ts

Existing controllers include examples such as:

- admin.controller.ts
- audit-log.controller.ts
- auth.controller.ts
- chat.controller.ts
- company.controller.ts
- contact-submission.controller.ts
- epd-company.controller.ts
- epd.controller.ts
- external-report.controller.ts
- lca-company.controller.ts
- lca.controller.ts
- media.controller.ts
- notification.controller.ts
- project-option.controller.ts
- project.controller.ts
- user.controller.ts

IMPORTANT:

This structure is provided as the CURRENT project structure.

Do not automatically assume every future module must use exactly these files.

First inspect how the existing modules are implemented.

Then follow the existing project convention.

============================================================

# BACKEND CODING CONVENTIONS

============================================================

Respect the existing Prettier configuration.

Known conventions include:

- singleQuote
- trailingComma: all
- printWidth: 100
- tabWidth: 2
- LF line endings
- sorted imports
- import grouping
- TypeScript decorators where applicable

Respect the existing TypeScript configuration, including:

- strict: true
- noUnusedLocals: true
- path aliases
- decorators
- TypeScript source under src
- dist output

Existing aliases include patterns such as:

@config
@constant
@controller
@database
@enum
@loader
@logger
@middleware
@model
@query
@resource
@route
@service
@type
@util
@validator
@i18n
@queue
@worker

When creating implementation plans, specify the correct project location and alias according to the existing architecture.

Do not introduce relative imports if the existing project uses aliases for the relevant layer.

============================================================

# REQUIRED QUALITY CHECKS

============================================================

The implementation plan must include the project's existing quality gates.

Known commands:

npm run lint
npm run type-check
npm run format
npm run format:check
npm run test:ci
npm run build

Before marking a task/milestone as completed, identify which applicable checks must pass.

Do not assume a task is complete merely because the code compiles.

============================================================

# FIRST STEP — CODEBASE DISCOVERY

============================================================

Before creating any plan, inspect the actual project.

Analyze at minimum:

## Backend

- package.json
- tsconfig.json
- prettier configuration
- eslint configuration
- Husky configuration
- server.ts
- application/bootstrap/loaders
- routes
- controllers
- services
- models
- queries
- validators
- middleware
- authentication
- authorization
- enums
- types
- resources
- queues
- workers
- database configuration
- migrations if present
- logging
- error handling
- tests
- environment/configuration

## Frontend

Inspect:

- package.json
- app/pages structure
- layouts
- components
- hooks
- services/API clients
- types
- forms
- validation
- state management
- authentication
- authorization
- routing
- reusable UI
- error handling
- loading states
- tests
- configuration

============================================================

# CURRENT VS PROPOSED

============================================================

Always distinguish:

CURRENT

from:

PROPOSED

Example:

CURRENT:
The project has controller → service → model architecture.

PROPOSED:
New Action Plan functionality should follow the same controller → service → model pattern.

Never describe proposed architecture as if it already exists.

============================================================

# REQUIREMENT ANALYSIS

============================================================

Read all provided requirements, documents, tickets, designs, conversations, and project documentation.

Convert requirements into:

- Business requirements
- Functional requirements
- Technical requirements
- User roles
- Permissions
- Data requirements
- API requirements
- UI requirements
- Non-functional requirements
- Security requirements
- Testing requirements

Do not invent missing business rules.

============================================================

# DOUBT / CLARIFICATION MANAGEMENT

============================================================

This is extremely important.

Whenever anything is unclear, DO NOT silently assume.

For every uncertainty classify it as:

1. BLOCKER
2. TECHNICAL DECISION REQUIRED
3. NON-BLOCKING CLARIFICATION
4. FUTURE / OUT OF SCOPE

Every milestone must have its own:

## Clarifications Required

section.

Example:

### Milestone 4 - Family Profile

Question:
Which Family Profile fields are mandatory?

Impact:

- Database
- Backend validation
- API
- Frontend form
- UI validation

Blocking:
YES

Required before:
Family Profile implementation

Do not put all questions only in one final section.

============================================================

# MILESTONE STRUCTURE

============================================================

Everything must be organized as:

MILESTONE
↓
MODULE
↓
USER / ROLE
↓
TASK
↓
SUBTASK

Every milestone should contain:

1. Objective
2. Business purpose
3. Modules
4. User/role impact
5. Backend work
6. Frontend work
7. Database work
8. API work
9. Validation
10. Permission requirements
11. Dependencies
12. Risks
13. Clarifications
14. Estimated effort
15. Acceptance criteria
16. Definition of Done

============================================================

# DO NOT CREATE GENERIC TASKS

============================================================

BAD:

- Implement backend
- Create API
- Work on frontend
- Add validation
- Complete testing

GOOD:

- Create FamilyProfile model with required fields and relationships.
- Add database migration for FamilyProfile.
- Add FamilyProfile request validation.
- Add create FamilyProfile service.
- Add POST /api/... endpoint.
- Add authorization for user-owned FamilyProfile access.
- Add API response mapper.
- Add unit tests for FamilyProfile service.
- Add integration tests for FamilyProfile API.
- Create Family Profile form page.
- Add field-level validation.
- Integrate create/update Family Profile APIs.
- Add loading, success, error and permission-denied states.

Every PMS task must be independently understandable.

============================================================

# DOCUMENT 1

# PMS TASK LIST

============================================================

Create:

01_PMS_TASK_LIST_BE_FE.md

Purpose:

This document will be used by the Project Manager to create tasks in the PMS.

Structure:

MILESTONE
└── MODULE
└── USER / ROLE
└── TASK

Use this table:

| ID  | Milestone | Module | Area | Role/User | Task | Detailed Description | Dependency | Estimate | Priority | Acceptance Criteria |
| --- | --------- | ------ | ---- | --------- | ---- | -------------------- | ---------- | -------- | -------- | ------------------- |

Area can include:

- BE
- FE
- DB
- API
- AI
- PDF
- QA
- SECURITY
- DEVOPS

Role/User examples:

- Backend Developer
- Frontend Developer
- Full Stack Developer
- Admin
- End User
- QA
- Tech Lead
- DevOps

============================================================

# PMS ESTIMATION

============================================================

Estimate every task in hours.

Use realistic estimates such as:

0.5h
1h
2h
4h
6h
8h
12h
16h

Do not provide random estimates.

Base estimates on:

- Existing codebase
- Reusability
- Complexity
- Number of files
- Database changes
- API complexity
- Validation
- Permission
- UI complexity
- AI integration
- PDF generation
- Testing
- Integration

If the estimate cannot be safely determined because of an unresolved requirement:

Estimate:
BLOCKED - CLARIFICATION REQUIRED

Also provide totals:

- BE hours
- FE hours
- DB hours
- API hours
- AI hours
- PDF hours
- QA hours
- DevOps hours
- Total hours

============================================================

# TASK DEPENDENCIES

============================================================

Do not create tasks independently if they depend on other work.

Example:

Database
↓
Model
↓
Type
↓
Validation
↓
Service
↓
Controller
↓
Route
↓
API testing
↓
API contract finalized
↓
Frontend integration

Clearly identify dependencies.

============================================================

# DOCUMENT 2

# BACKEND IMPLEMENTATION PLAN

============================================================

Create:

02_BACKEND_IMPLEMENTATION_PLAN.md

This is the technical implementation guide for Backend Developers.

It must contain:

# 1. Backend Architecture

Explain:

- Project structure
- Responsibilities of each folder
- Request lifecycle
- Controller responsibility
- Service responsibility
- Model responsibility
- Query responsibility
- Validator responsibility
- Middleware responsibility
- Route responsibility
- Resource/response transformation
- Type responsibility
- Queue/worker responsibility
- Logging
- Error handling

Use the actual project architecture.

============================================================

# DATABASE / MODEL PLAN

============================================================

For every new or modified model/table define:

- Table/model name
- Purpose
- Columns
- PostgreSQL data type
- Nullable
- Default
- Primary key
- Foreign key
- Relationship
- Unique constraints
- Indexes
- JSON/JSONB
- Created/updated timestamps
- Soft delete if applicable
- Audit fields
- Versioning
- Migration

Explain why each field exists.

Do not add unnecessary fields.

============================================================

# TYPES

============================================================

For each module identify:

- Database types
- Domain types
- Request types
- Response types
- Service types
- AI types
- Enum types

Specify expected file/location according to the current project structure.

============================================================

# VALIDATION

============================================================

For every API define:

- Required fields
- Optional fields
- Data types
- Min/max
- Enum
- Nested validation
- Array validation
- Cross-field validation
- Business validation

Clearly identify where validation should happen:

- Request validator
- Service/business logic
- Database constraint

Avoid unnecessary duplication.

============================================================

# ROLE & PERMISSION

============================================================

Analyze existing authentication and authorization.

Reuse existing implementation.

Create a permission matrix:

| API | Admin | User | Other Role | Permission |
| --- | ----- | ---- | ---------- | ---------- |

For each API identify:

- Who can create
- Who can view
- Who can update
- Who can delete
- Who can generate
- Who can regenerate
- Who can export
- Who can access own data
- Who can access other users' data

If not defined by requirements:

MARK:
CLARIFICATION REQUIRED

Do not invent permissions.

============================================================

# API IMPLEMENTATION

============================================================

For EVERY API provide:

## API Name

## Purpose

## Method

## Endpoint

## Authentication

## Permission

## Headers

## Path Parameters

## Query Parameters

## Request Body

Provide exact JSON example.

## Validation

## Backend Flow

Controller
→ Middleware
→ Authentication
→ Authorization
→ Validation
→ Service
→ Query/Model
→ External Service if applicable
→ Resource/Response
→ Logging

## Success Response

Provide exact JSON.

## Error Responses

Document applicable:

400
401
403
404
409
422
500

Do not invent unnecessary error statuses.

## Database Changes

## Logging

## Security

## Acceptance Criteria

============================================================

# API CONTRACTS

============================================================

The API contract must be detailed enough for the frontend developer to consume directly.

Every finalized API must have:

- Method
- URL
- Auth
- Permission
- Request
- Response
- Error response
- Field types
- Nullable/optional behavior

Do not leave APIs at conceptual level.

============================================================

# AI PLAN

============================================================

If AI is involved, document:

- AI use case
- Input
- Prompt construction
- Prompt version
- Output structure
- Output validation
- Model configuration
- Provider configuration
- Retry
- Timeout
- Failure handling
- Rate limits
- Cost considerations
- Privacy
- Sensitive data
- Logging
- Prompt storage
- Result storage
- Regeneration
- Versioning

Do not assume a provider/model unless confirmed.

============================================================

# ACTION PLAN ENGINE

============================================================

If the project includes an Action Plan:

Document the complete flow:

User
↓
Questionnaire
↓
Structured Family Profile
↓
Data validation
↓
Determine relevant modules
↓
Generate/process action plan
↓
Determine priorities
↓
Generate recommended next steps
↓
Generate checklist
↓
Generate support information
↓
Store action plan
↓
Generate PDF

For each step identify:

- Source of data
- Database table/model
- Business logic
- AI involvement
- Stored data
- API
- Permission
- Error handling

============================================================

# FLEXIBLE MODULE ARCHITECTURE

============================================================

If Action Plan modules are dynamic:

Do not assume every module has the same fields.

Design a structure capable of supporting:

- Different module types
- Different fields
- Different validations
- Different priorities
- Different AI instructions
- Different checklist structures
- Different recommendations
- Future provider/service matching

The architecture should allow future modules without major restructuring.

============================================================

# PRIORITY SYSTEM

============================================================

Analyze how priority should be determined.

Possible values may include:

HIGH
MEDIUM
LOW

But do not assume these are final.

Identify whether priority comes from:

- Business rules
- AI
- Admin configuration
- User
- Combination

Document:

- Storage
- Calculation
- Update
- Display
- Versioning
- API behavior

Unresolved decisions must be marked.

============================================================

# VERSIONING

============================================================

Define versioning for relevant entities.

Consider:

- Family Profile
- Action Plan
- Action Plan Module
- AI generated content
- PDF

Define:

- Version trigger
- Version number
- Previous version handling
- Regeneration behavior
- Profile update behavior
- AI regeneration behavior
- PDF/version relationship

Do not guess business rules.

============================================================

# PDF

============================================================

If PDF generation is required:

Analyze existing PDF implementation first.

Document:

- PDF service
- Template
- HTML generation
- Styling
- Sections
- Page breaks
- Header/footer
- File naming
- Storage
- Download API
- Permissions
- Version
- Regeneration

Include required sections only when supported by requirements.

============================================================

# SECURITY

============================================================

For every module identify concrete security requirements.

Check:

- Authentication
- Authorization
- User data isolation
- IDOR
- Input validation
- SQL injection
- Sensitive information
- AI prompt leakage
- AI data exposure
- File/PDF access
- Rate limiting
- Logging sensitive data
- Error leakage
- Access control

============================================================

# TESTING

============================================================

For each backend module define:

- Unit tests
- Service tests
- API/integration tests
- Validation tests
- Authorization tests
- Negative tests
- Edge cases

Do not just say "write tests."

Provide concrete scenarios.

============================================================

# DOCUMENT 3

# FRONTEND IMPLEMENTATION PLAN

============================================================

Create:

03_FRONTEND_IMPLEMENTATION_PLAN.md

IMPORTANT:

This document is intended to be given directly to the Frontend Developer or an AI coding agent such as Antigravity.

It must be implementation-oriented.

The FE plan must use FINALIZED backend API contracts.

If an API is not finalized:

WAITING FOR BE API CONTRACT

Do not invent an API.

============================================================

# FRONTEND PAGE PLAN

============================================================

For every page:

- Route
- Purpose
- User role
- Permission
- Layout
- Components
- Shared components
- Forms
- Fields
- Validation
- API
- State
- Loading
- Empty
- Error
- Success
- Permission denied
- Responsive behavior
- Navigation
- Acceptance criteria
- Tests

============================================================

# COMPONENT PLAN

============================================================

For every page:

Page
├── Layout
├── Header
├── Navigation
├── Section
├── Component
├── Form
├── Field
├── API
└── State

First inspect existing reusable components.

Do not create duplicate components.

============================================================

# FRONTEND API INTEGRATION

============================================================

For every API specify:

- API method
- Endpoint
- Request type
- Response type
- API client/service location
- Authentication
- Permission
- Loading state
- Error state
- Success behavior
- Retry if applicable
- Cache/invalidation
- UI behavior

Follow existing frontend API patterns.

============================================================

# USER FLOW

============================================================

For every user role define:

Login
↓
Page
↓
Action
↓
API
↓
Response
↓
UI state
↓
Next action

Document complete flows.

============================================================

# FRONTEND VALIDATION

============================================================

For every form:

- Required fields
- Optional fields
- Field type
- Format
- Min/max
- Enum
- Conditional fields
- Error messages
- Submit behavior
- API validation synchronization

Frontend validation must align with backend validation.

============================================================

# ROLE BASED UI

============================================================

Document:

- Which routes are accessible
- Which buttons/actions are accessible
- Which fields are editable
- Which data is visible
- Which actions are hidden/disabled
- Permission denied behavior

Do not rely only on frontend permission checks.

Backend authorization remains the source of truth.

============================================================

# DOCUMENT 4

# DEVELOPER GUIDE

============================================================

Create:

04_DEVELOPER_GUIDE.md

This is extremely important.

The document should allow a NEW DEVELOPER to understand the project quickly.

It should explain both:

A. Technical architecture
B. Business/domain architecture

============================================================

# DEVELOPER GUIDE CONTENT

============================================================

Include:

# 1. Project Overview

- What the application does
- Main business purpose
- Major modules
- Main user types
- Important business terminology

# 2. Technology Stack

Backend:

- Node.js
- TypeScript
- PostgreSQL
- etc.

Frontend:

- Next.js
- TypeScript
- etc.

List actual libraries from package.json.

# 3. Repository Structure

Explain each important folder.

Backend example:

src/
├── configs → configuration
├── constants → constants
├── controllers → HTTP/controller layer
├── database → database setup
├── enums → enums
├── loaders → application initialization
├── loggers → logging
├── middlewares → request middleware
├── models → database models
├── queries → database queries
├── queues → queue definitions
├── resources → API response/resource transformation
├── routes → API routes
├── services → business logic
├── types → TypeScript types
├── utils → utilities
├── validators → request validation
├── workers → background jobs
└── server.ts → server entry point

BUT:

Use the actual project implementation to explain these folders.

Do not assume the above descriptions are correct if the codebase differs.

# 4. Request Lifecycle

Explain:

Request
↓
Route
↓
Middleware
↓
Controller
↓
Validator
↓
Service
↓
Query/Model
↓
Resource
↓
Response

Adapt this to actual implementation.

# 5. Authentication

Explain:

- Login
- Token/session
- Middleware
- User identity
- Refresh mechanism if applicable
- Logout
- Protected routes

# 6. Authorization

Explain:

- Roles
- Permissions
- How permission checks work
- How developers add a new permission
- How developers protect a new API

# 7. Database

Explain:

- PostgreSQL
- Models
- Relations
- Migrations
- Queries
- Transactions
- Indexing
- Naming conventions

# 8. API Development

Explain step-by-step:

How to create:

1. Model
2. Type
3. Validator
4. Query
5. Service
6. Controller
7. Route
8. Resource/response
9. Permission
10. Test

Use an existing module as a real example.

# 9. Frontend Architecture

Explain:

- Routes
- Pages
- Components
- Hooks
- API layer
- State
- Forms
- Validation
- Authentication
- Permission handling

# 10. Environment Variables

Document:

- Required variables
- Purpose
- Example source
- Development setup

Never expose real secrets.

# 11. Local Development

Provide:

- Install
- Environment setup
- Database setup
- Start backend
- Start frontend
- Required services
- Queue/worker setup if applicable

Use actual package scripts.

# 12. Quality Commands

Document actual commands such as:

npm run lint
npm run type-check
npm run format
npm run format:check
npm run test:ci
npm run build

Explain when each should be run.

# 13. Git / Husky

Explain:

- Hooks
- Pre-commit
- Pre-push
- Lint
- Formatting
- Testing

# 14. Testing

Explain:

- Test structure
- Unit tests
- Integration tests
- How to run tests
- How to add tests

# 15. Logging

Explain:

- Application logs
- Error logs
- Audit logs
- Where logs are created
- What should/should not be logged

# 16. Background Jobs

If queues/workers exist:

Explain:

- Queue
- Producer
- Consumer/worker
- Retry
- Failure
- Monitoring

# 17. API Error Handling

Explain:

- Standard error structure
- Error classes
- Status codes
- How developers should handle errors

# 18. Coding Standards

Document:

- Naming
- File naming
- Function naming
- Type naming
- Import aliases
- Formatting
- Validation
- Error handling
- Comments
- Logging

# 19. Adding a New Module

Provide a practical checklist:

[ ] Requirement confirmed
[ ] Database design
[ ] Model
[ ] Type
[ ] Enum
[ ] Query
[ ] Validator
[ ] Service
[ ] Controller
[ ] Route
[ ] Permission
[ ] Resource
[ ] Tests
[ ] Documentation
[ ] Frontend
[ ] API integration
[ ] Lint
[ ] Type check
[ ] Format
[ ] Test
[ ] Build

Adapt this checklist to the actual project.

# 20. Common Mistakes

Identify actual project-specific mistakes new developers should avoid.

Examples:

- Bypassing service layer
- Direct DB access from controller
- Incorrect permission checks
- Incorrect API response format
- Missing validation
- Incorrect aliases
- Missing audit logs
- Forgetting migrations
- Not adding indexes
- Returning sensitive data
- Not handling ownership

Only include mistakes relevant to the actual project.

============================================================

# DOCUMENT 5

# OPEN QUESTIONS & DECISIONS

============================================================

Create:

05_OPEN_QUESTIONS_AND_DECISIONS.md

Organize questions by milestone.

For each question:

| ID  | Milestone | Module | Question | Impact | Blocking | Required Before | Owner | Decision |
| --- | --------- | ------ | -------- | ------ | -------- | --------------- | ----- | -------- |

Do not invent answers.

Once a decision is confirmed, it should be reflected in:

- PMS task list
- Backend plan
- Frontend plan
- Developer guide

============================================================

# DOCUMENT 6

# PROJECT ARCHITECTURE & DEPENDENCY MAP

============================================================

Create:

06_ARCHITECTURE_DEPENDENCY_MAP.md

Document:

- Module dependencies
- Database dependencies
- API dependencies
- BE → FE dependencies
- AI dependencies
- PDF dependencies
- Queue/worker dependencies
- External services

Example:

Requirement
↓
Database
↓
Model
↓
Query
↓
Service
↓
Controller
↓
Route
↓
API
↓
Frontend API Client
↓
Page
↓
UI

============================================================

# MILESTONE ORDER

============================================================

Do NOT blindly use the following milestones.

Use them as a starting framework and adjust according to the actual project:

MILESTONE 0
Requirements & Clarification

MILESTONE 1
Technical Architecture & Database Foundation

MILESTONE 2
Authentication / Authorization / Roles / Permissions

MILESTONE 3
Core Backend Domain

MILESTONE 4
Questionnaire / Structured User or Family Profile

MILESTONE 5
Action Plan Modules

MILESTONE 6
Action Plan Generation / Business Rules

MILESTONE 7
AI Integration

MILESTONE 8
Priority / Recommendation / Checklist

MILESTONE 9
PDF Generation

MILESTONE 10
Admin / Configuration / Testing Tools

MILESTONE 11
Backend Testing & API Finalization

MILESTONE 12
Frontend Foundation

MILESTONE 13
Frontend Pages & Components

MILESTONE 14
Frontend API Integration

MILESTONE 15
Frontend Validation / Permissions / UX States

MILESTONE 16
BE + FE Integration Testing

MILESTONE 17
UAT

MILESTONE 18
Production Readiness

Only create milestones that are actually required.

Combine or split milestones when appropriate.

============================================================

# ESTIMATION SUMMARY

============================================================

At the end provide:

| Area        | Hours |
| ----------- | ----- |
| Backend     |       |
| Frontend    |       |
| Database    |       |
| API         |       |
| AI          |       |
| PDF         |       |
| QA          |       |
| Security    |       |
| DevOps      |       |
| Integration |       |
| Total       |       |

Also provide milestone totals:

| Milestone | BE Hours | FE Hours | Other | Total |
| --------- | -------- | -------- | ----- | ----- |

============================================================

# RISK REGISTER

============================================================

Create:

| Risk | Milestone | Module | Impact | Probability | Mitigation | Owner |
| ---- | --------- | ------ | ------ | ----------- | ---------- | ----- |

Focus on actual project risks.

============================================================

# DEFINITION OF DONE

============================================================

Every milestone must have a Definition of Done.

Backend:

- Database complete
- Model complete
- Types complete
- Validation complete
- Query complete
- Service complete
- Controller complete
- Route complete
- Permission complete
- Error handling complete
- Logging complete
- Tests complete
- Lint passes
- Type check passes
- Format passes
- Existing tests pass
- Build passes

Frontend:

- Page complete
- Components complete
- Types complete
- API integrated
- Validation complete
- Loading state
- Empty state
- Error state
- Success state
- Permission state
- Responsive behavior
- Tests complete
- Lint passes
- Type check passes
- Format passes
- Build passes

============================================================

# FINAL IMPLEMENTATION FLOW

============================================================

The final plan should follow a dependency-aware sequence similar to:

Requirements
↓
Clarifications
↓
Architecture
↓
Database
↓
Models / Types
↓
Validation
↓
Roles / Permissions
↓
Queries
↓
Services
↓
Controllers
↓
Routes
↓
API Contracts
↓
Backend Tests
↓
Backend Completion
↓
API Contract Freeze
↓
Frontend Architecture
↓
Pages / Components
↓
Forms / Validation
↓
API Integration
↓
Permission UI
↓
Frontend Tests
↓
BE + FE Integration
↓
UAT
↓
Production Readiness

============================================================

# FINAL OUTPUT FILES

============================================================

Create these files:

01_PMS_TASK_LIST_BE_FE.md

02_BACKEND_IMPLEMENTATION_PLAN.md

03_FRONTEND_IMPLEMENTATION_PLAN.md

04_DEVELOPER_GUIDE.md

05_OPEN_QUESTIONS_AND_DECISIONS.md

06_ARCHITECTURE_DEPENDENCY_MAP.md

============================================================

# FINAL REVIEW BEFORE COMPLETING

============================================================

Before finalizing the documents, verify:

[ ] Existing codebase inspected
[ ] Existing architecture documented
[ ] Existing patterns reused
[ ] Requirements analyzed
[ ] Business assumptions identified
[ ] Questions identified
[ ] Questions grouped by milestone
[ ] Database changes documented
[ ] Models documented
[ ] Types documented
[ ] Validators documented
[ ] Queries documented
[ ] Services documented
[ ] Controllers documented
[ ] Routes documented
[ ] APIs documented
[ ] Request/response examples provided
[ ] Roles documented
[ ] Permissions documented
[ ] AI documented
[ ] PDF documented
[ ] Versioning documented
[ ] Security documented
[ ] Testing documented
[ ] Frontend pages documented
[ ] Frontend components documented
[ ] Frontend API integration documented
[ ] Loading/error/empty states documented
[ ] PMS tasks are actionable
[ ] Estimates provided
[ ] Dependencies provided
[ ] Acceptance criteria provided
[ ] Definition of Done provided
[ ] Developer onboarding guide provided
[ ] Quality commands documented
[ ] No unsupported assumptions
[ ] No duplicate architecture introduced
[ ] No generic "implement X" tasks
[ ] Backend API dependencies reflected in frontend plan

============================================================

# CRITICAL RULE

============================================================

Do not start implementation.

First generate the complete planning documents.

If something is unclear, DO NOT guess.

Place the clarification under the relevant milestone.

The plan must be detailed enough that:

- PM can create PMS tasks directly.
- BE developer can implement backend directly.
- FE developer can implement frontend directly after API contracts are finalized.
- A new developer can understand the project from the Developer Guide.
- Another developer can continue the work without needing the original developer to explain the architecture verbally.

Think like a senior engineer who will be responsible for the project six months from now.

Prioritize:

- Maintainability
- Scalability
- Security
- Reusability
- Clear ownership
- Clean architecture
- Consistent project conventions
- Strong API contracts
- Testability
- Developer onboarding
- Minimal unnecessary changes
- Clear dependencies
- Explicit decisions

DO NOT CODE UNTIL THE PLAN IS REVIEWED AND APPROVED.
