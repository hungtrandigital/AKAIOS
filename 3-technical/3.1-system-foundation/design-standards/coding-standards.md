# Coding Standards — AKAIUNSAN Attendance + Payroll

**Status:** Active — Phase 0 deliverable for PRD-EPIC-002
**Last Updated:** 2026-07-16
**Owner:** @fullstack-engineer
**Mandatory:** Per `[0-agents/workflows/development-rules.md]` (de facto factory standard)

## Overview

Coding conventions for TypeScript (backend + web admin), Dart/Flutter (mobile), SQL/Prisma, and infrastructure code. Supplements `[0-agents/workflows/development-rules.md]` (KISS/DRY/YAGNI, kebab-case, <200-line files, no secrets, conventional commits, no AI references).

## TypeScript Standards

### Compiler Options

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

### Style
- **No `any`** — use `unknown` + type narrowing if needed
- **Prefer `const`** over `let`; never `var`
- **Arrow functions** for callbacks; named functions for top-level
- **Async/await** over `.then()` chains
- **Template literals** over string concatenation
- **Destructuring** where it improves readability

### Naming

| Element | Convention | Example |
| --- | --- | --- |
| Variables, functions | camelCase | `userId`, `getEmployeeById` |
| Classes, types, interfaces | PascalCase | `Employee`, `PayrollLine` |
| Constants (compile-time) | UPPER_SNAKE_CASE | `MAX_LOGIN_ATTEMPTS` |
| Enum members | PascalCase | `enum Status { Active, Inactive }` |
| Files (TS source) | kebab-case | `user-service.ts` |
| Files (components) | kebab-case | `employee-card.tsx` |
| Directories | kebab-case | `attendance-services/` |

### Imports
- Use ES modules (`import`/`export`), not CommonJS
- Order: external → internal absolute → relative (alphabetical within group)
- Use `import type { X }` for type-only imports

### Error Handling
- Throw typed errors: `throw new ValidationError('Email required')`
- Never swallow errors silently (`catch {}`)
- Use error boundaries in web admin (React error boundary component)
- Fastify error handler: convert domain errors to HTTP responses (400/401/403/404/409/500)

### Logging
- Use Pino (Fastify default): structured JSON logs
- Log levels: `debug`, `info`, `warn`, `error`, `fatal`
- Include correlation IDs (`request.id`) in all logs
- **Never log sensitive data:** passwords, OTP, full payment card, full bank account

### File Size Limits
- Max 200 lines per file (per `[development-rules.md:8-12]`)
- If exceeded, split: extract classes, extract constants, extract types
- Exception: generated files (Prisma client, OpenAPI types) can exceed

## Dart / Flutter Standards

### Style
- Follow [Effective Dart](https://dart.dev/effective-dart) — official guide
- Use `flutter_lints` package (replaces deprecated `pedantic`)
- Prefer `final` over `var`; use `const` aggressively for widgets

### Naming

| Element | Convention | Example |
| --- | --- | --- |
| Variables, functions | camelCase | `userId`, `checkIn()` |
| Classes, types, enums | PascalCase | `Employee`, `AttendanceStatus` |
| Constants | lowerCamelCase | `defaultTimeout` |
| Files | snake_case | `attendance_repository.dart` |
| Directories | snake_case | `attendance/` |

### State Management
- Use **Riverpod** (flutter_riverpod 2.x) for state management
- Avoid setState for anything beyond ephemeral UI state
- Async values via `AsyncValue<T>` from Riverpod

### Architecture

```
lib/
├── core/                    # Cross-cutting (config, http client, errors)
├── features/
│   └── attendance/
│       ├── data/
│       │   ├── models/       # DTOs (JSON ↔ Dart)
│       │   ├── repositories/ # API calls
│       │   └── datasources/  # Remote/local sources
│       ├── domain/
│       │   ├── entities/     # Pure Dart classes (no Flutter)
│       │   ├── repositories/ # Abstract interfaces
│       │   └── usecases/     # Business logic
│       └── presentation/
│           ├── providers/    # Riverpod providers
│           ├── pages/        # Screen widgets
│           └── widgets/      # Reusable widgets
├── l10n/                    # Localization (Vietnamese, English)
└── main.dart
```

### Localization
- All user-facing strings via `flutter_localizations` + ARB files
- Default: Vietnamese (`vi`)
- Optional: English (`en`) for technical errors

## Database / Prisma Standards

### Schema
- Use Prisma schema (single source of truth for DB structure)
- Model names: PascalCase, plural for tables (`employees`, `projects`)
- Field names: camelCase in Prisma → snake_case in DB (Prisma handles)
- Always include `id` (UUID), `createdAt`, `updatedAt` on every model
- Soft delete: `deletedAt DateTime?` on main entities

### Migrations
- One migration per PR (no mega-migrations)
- Migration names: `YYYYMMDDHHMMSS_descriptive_name` (Prisma default)
- Never edit applied migrations; create a new one to fix
- Test migrations on dev DB before pushing to production

### Queries
- Use Prisma Client (type-safe) — never raw SQL except for performance-critical reports
- For reports, use Prisma `$queryRaw` with parameterized queries (no string concat)
- Add indexes for frequently queried fields (see Domain Specs for index hints)

## API Standards (REST)

### URL Structure

```
/api/v1/{resource}              # Collection
/api/v1/{resource}/{id}         # Single resource
/api/v1/{resource}/{id}/{sub}    # Sub-resource
/api/internal/{resource}         # Internal-only (service-to-service)
```

### HTTP Methods
- `GET` — read
- `POST` — create
- `PUT` — full update
- `PATCH` — partial update
- `DELETE` — soft delete (set `deletedAt`)

### Status Codes
- `200` — success with body
- `201` — created with body
- `204` — success no body (e.g., DELETE)
- `400` — validation error
- `401` — unauthorized (missing/invalid JWT)
- `403` — forbidden (valid JWT, insufficient role)
- `404` — not found
- `409` — conflict (duplicate, state machine violation)
- `422` — unprocessable (business rule violation)
- `500` — server error

### Request/Response Format
- All requests/responses: JSON
- Errors return: `{ error: { code: string, message: string, details?: object } }`
- Pagination: query params `?page=1&limit=50`; response: `{ data: [...], pagination: { page, limit, total, totalPages } }`
- Timestamps: ISO 8601 UTC (e.g., `2026-07-16T08:30:00Z`); convert to VN time (UTC+7) at presentation layer
- Money: VNĐ as integer or Decimal; **NEVER** as float

### Versioning
- URL-based (`/api/v1/...`)
- Breaking change → bump version (`/api/v2/...`)
- Old version supported for 6 months after new version release

### Authentication
- Bearer JWT in `Authorization` header
- Refresh token in `httpOnly` cookie (web) or secure storage (mobile)
- Internal API: `X-Internal-API-Key` header

## Testing Standards

### Coverage Requirements
- **Floor: ≥90%** for new code (per `[0-agents/mode/code.md:47]`)
- **Target: 100%** for domain logic (payroll engine, attendance status calculation, GPS validation)
- Don't test framework code or trivial getters/setters

### Backend (TypeScript)
- **Unit tests:** Vitest (faster than Jest, ESM-native)
- **Integration tests:** Vitest + testcontainers (real Postgres/Redis/MinIO in Docker for tests)
- **E2E tests:** Playwright (for critical user flows: login, check-in, payroll approval)
- **Test naming:** `describe('ClassName') > it('should do X when Y')`
- **Test structure:** Arrange-Act-Assert (AAA)

### Mobile (Flutter)
- **Unit tests:** `flutter_test` for domain layer
- **Widget tests:** `flutter_test` for UI components
- **Integration tests:** `integration_test` package for E2E flows
- **Mocking:** `mocktail` (better than mockito for null safety)

### What to Test
- All business logic in services
- All API endpoints (happy path + 2-3 error paths)
- GPS validation edge cases (boundary, just outside, way outside)
- Payroll calculation with edge cases: month boundary, overnight shifts, holidays, partial month
- Auth flows (login, refresh, 2FA)
- Authorization (RBAC: employee can't access admin endpoints)

### What NOT to Test
- Generated code (Prisma client, OpenAPI types)
- Trivial CRUD with no logic (test through integration tests, not unit)
- Framework defaults (Fastify routing, Next.js rendering)

## Git / Commit Standards

### Conventional Commits

```
<type>(<scope>): <subject>

<body>

<footer>
```

- **Types:** `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`, `style`, `ci`
- **Scope:** system name (`attendance`, `payroll`, `web-admin`, `mobile`, `infra`) or domain (`auth`, `db`)
- **Subject:** imperative mood, lowercase, no period, max 72 chars
- **Body:** explain WHAT and WHY (not HOW), wrap at 100 chars
- **Footer:** reference issues (`Closes #123`), note breaking changes (`BREAKING CHANGE: ...`)

**Examples:**

```
feat(attendance): add GPS validation for check-in
fix(payroll): correct OT calculation for overnight shifts
refactor(mobile): extract auth provider to separate file
docs(api): add OpenAPI spec for /api/v1/attendance
test(payroll): add 100+ test cases for payroll engine
```

### Branching
- `main` — production-ready, protected
- `feature/[system]-[short-desc]` — new features (e.g., `feature/attendance-checkin-api`)
- `fix/[system]-[issue]` — bug fixes
- `chore/[scope]` — non-functional changes

### PR Requirements
- Title follows conventional commit format
- Description: WHAT, WHY, HOW to test, screenshots for UI
- Linked work item ID (e.g., `Closes CODE-TASK-007`)
- All CI checks pass (lint, typecheck, tests)
- Reviewer: at least 1 peer + 1 architect approval for cross-cutting changes
- **No AI references** in commits, PR descriptions, or code comments (per `[development-rules.md:35]`)

## Security Standards

### Secrets
- Never commit secrets (`.env`, API keys, passwords) — use `.env.example` with placeholders
- Secrets loaded from environment variables only
- Production secrets stored on server only (mode 600 `.env`)

### Input Validation
- Validate ALL user input at API boundary (Fastify JSON schema or Zod)
- Sanitize strings before DB queries (Prisma handles SQL injection, but validate format)
- Reject oversized payloads (max 10 MB for normal, 50 MB for photo upload)

### Authentication & Authorization
- Passwords: Argon2id only (no bcrypt, no plain SHA)
- JWT signing keys: 256-bit random, rotated yearly
- 2FA for admin role (TOTP, Google Authenticator)
- Rate limiting: 100 req/min unauth, 600 req/min per user authenticated

### Dependency Management
- Pin exact versions for production dependencies (no `^` in `package.json` for prod)
- Use `npm audit` / `yarn audit` in CI weekly
- Update dependencies monthly (low-risk patch updates)
- Major updates: schedule, test, deploy separately

## Documentation Standards

### Code Comments
- Comment WHY, not WHAT (code should be self-explanatory)
- Use JSDoc for public APIs in TypeScript
- Use Dartdoc (`///`) for public Dart APIs
- Avoid obvious comments (`// increment i`)

### README per System

Each system (`systems/[name]/`) MUST have README.md with:
- Overview
- Tech stack
- Quick start (prerequisites, install, run)
- Directory structure
- Documentation links

### API Documentation
- OpenAPI 3.1 spec in `3-technical/3.1-system-foundation/architecture/api-contracts/`
- Generated client types (TypeScript) for backend ↔ web admin consistency
- Generated Dart types (openapi-generator) for mobile app

## Related Documents

- [Development Rules](../../../../0-agents/workflows/development-rules.md) — Factory-de-facto standard
- [System Design](system-design.md) — Architecture overview
- [Domain Specs](../architecture/domain-specs.md) — DDD model
- [Fullstack Engineer Agent](../../../../0-agents/agents/core-agents/fullstack-engineer.md) — Process
