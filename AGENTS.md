## Mission And Operating Defaults

You are Codex working in this repository. Optimize for fast, correct, end-to-end delivery with minimal back-and-forth.

Default behavior:
- Treat user requests as implementation requests unless they explicitly ask for planning-only.
- Execute autonomously from discovery to verification to final report.
- Ask questions only when blocked by missing requirements, permissions, or high-risk ambiguity.
- Keep diffs minimal, scoped, and consistent with existing patterns.
- Never change unrelated files just because they are nearby.

## Repo Facts

### Stack

Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS v4, PostgreSQL 16, Prisma 7.4, Clerk, Zod, Vitest 4.

### Architecture

| Layer | Location | Role |
|---|---|---|
| Presentation | `src/app/(main)/` | Page rendering and layout |
| API | `src/app/api/*/route.ts` | JSON contracts for web and future clients |
| Domain | `src/services/` | Framework-independent financial logic |
| Validation | `src/schemas/` | Zod schemas shared by routes and forms |
| Data access | `src/lib/db.ts` + Prisma | Persistence via PrismaPg adapter |

### API And Auth Invariants

- Wrap route handlers with `withApi()` from `src/lib/api/handler.ts`.
- Enforce auth with `requireAuth()` from `src/lib/auth.ts` (or `requireAuthContext()` when both IDs are needed).
- Return responses with `ok()` / `fail()` from `src/lib/api/response.ts`.
- `src/proxy.ts` is the Clerk middleware entrypoint (not `middleware.ts`).
- Public routes: `/`, `/sign-in(.*)`, `/sign-up(.*)`.

### Data Model And Numeric Conventions

- IDs are `cuid()` and foreign keys use cascade delete.
- Money values use `Decimal @db.Decimal(14, 2)`.
- Rate/percentage values use decimal fractions in `Decimal @db.Decimal(5, 4)` (for example `0.03` = 3%).
- PrismaPg adapter may strip trailing zeros; in tests use `Number(...)` + `toBeCloseTo(...)` for Decimal comparisons.

## Task Intake Contract

When requirements are underspecified, infer from existing patterns and proceed. If blocked, ask only for the missing decision using this compact template:

- Goal: one-sentence outcome
- Scope: exact subsystem(s) in or out
- Constraints: business/technical constraints to preserve
- Validation: minimum checks required for done

## Execution Workflow

1. Discover
- Scan relevant files first (`rg`, targeted file reads).
- Reuse existing patterns before introducing new abstractions.
- Prefer smallest viable change surface.

2. Implement
- Keep edits local and cohesive.
- Preserve public contracts unless explicitly asked to change them.
- If a contract must change, update call sites and tests in the same task.

3. Verify
- Run the smallest sufficient checks from the validation matrix.
- Expand to broader checks when risk is high or failures suggest wider impact.

4. Report
- Summarize what changed, why, and what was verified.
- Include residual risks only if something could not be validated.

## Command Canonicalization

```bash
# Dev server
npm run dev

# Core quality gates
npm run lint
npx tsc --noEmit
npm test
npm run build

# Targeted tests
npx vitest run tests/integration/user-settings.test.ts
npx vitest run -t "cascade"

# Database
docker compose up -d
npx prisma generate
npx prisma migrate dev --name <name>
npx prisma migrate deploy
npx prisma db seed
npx prisma studio
```

### Neon Migrations (Cloud)

Use a direct Neon connection for migrations (`-pooler` removed from hostname). Example:

```bash
DATABASE_URL="postgresql://...@ep-xxx.<region>.aws.neon.tech/neondb?sslmode=require" \
  npx prisma migrate deploy
```

If a migration failed previously:

```bash
DATABASE_URL="..." npx prisma migrate resolve --rolled-back <migration_name>
```

## Edit Rules

- Favor `apply_patch` for focused single-file edits.
- Avoid broad rewrites when a surgical patch is sufficient.
- Keep naming, file structure, and module boundaries aligned with existing code.
- Do not add new dependencies unless needed and justified.
- Do not perform destructive git operations unless explicitly requested.

## Testing And Validation Matrix

Choose checks by change type:

- UI/presentation-only:
  - `npm run lint`
  - targeted vitest files covering modified behavior

- API/domain/schema logic:
  - `npm run lint`
  - `npx tsc --noEmit`
  - targeted vitest integration/unit suites

- Prisma schema or migrations:
  - `npx prisma generate`
  - migration command(s) as needed
  - integration tests touching changed models/relations

- High-risk or cross-cutting changes:
  - full gate: `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`

Testing conventions:
- Test suite includes both `tests/unit` and `tests/integration`.
- Vitest runs non-concurrently (`sequence.concurrent: false`, `fileParallelism: false`).
- Reuse helpers in `tests/helpers` (factories, cleanup, prisma client) instead of duplicating utilities.

## API/DB Safety Rules

- Maintain the `{ ok, data | error }` response envelope.
- Keep auth checks in protected routes; do not bypass `requireAuth*`.
- Preserve Zod validation boundaries in route handlers and shared schemas.
- For schema changes, keep Prisma schema, generated client usage, and tests aligned in one task.

## Output Contract

Final response should include:
- What changed (concise, behavior-level summary)
- Files touched (with path references)
- Validation run (exact commands)
- Any blockers or unverified items

Use concise, factual language. Prefer actionable details over narrative.

## Definition Of Done

A task is done when all are true:
- Requested behavior is implemented.
- Related tests are added/updated where needed.
- No lint/type regressions in required checks.
- Build passes when change risk warrants it.
- Diff is scoped, consistent, and free of unrelated churn.
