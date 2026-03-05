# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 · PostgreSQL 16 · Prisma 7.4 · Clerk · Zod · Vitest 4

## Commands

```bash
# Dev server
npm run dev

# Quality gates (run in this order locally)
npm run lint
npx tsc --noEmit
npm test
npm run build

# Single test file / pattern
npx vitest run tests/integration/user-settings.test.ts
npx vitest run -t "cascade"

# Database
docker compose up -d                          # start local Postgres
npx prisma generate                           # after schema changes
npx prisma migrate dev --name <name>          # create + apply migration locally
npx prisma migrate deploy                     # apply migrations (CI / Neon)
npx prisma db seed
npx prisma studio
```

### Neon (cloud) database — migrations only

`prisma migrate deploy` requires the **direct** connection (no `-pooler` in host). The `.env.example` shows the pooler URL (for app queries). Strip `-pooler` from the hostname and drop `channel_binding=require` when running DDL:

```bash
DATABASE_URL="postgresql://...@ep-xxx.<region>.aws.neon.tech/neondb?sslmode=require" \
  npx prisma migrate deploy
```

If a migration was previously attempted and failed, resolve before re-deploying:

```bash
DATABASE_URL="..." npx prisma migrate resolve --rolled-back <migration_name>
```

## Architecture

### Layer responsibilities

| Layer | Location | Role |
|---|---|---|
| Presentation | `src/app/(main)/` | Page rendering, layout |
| API | `src/app/api/*/route.ts` | JSON contracts for web + future mobile clients |
| Domain | `src/services/` | Pure TS financial logic (no framework deps) |
| Validation | `src/schemas/` | Zod schemas shared by route handlers and forms |
| Data access | `src/lib/db.ts` + Prisma | Persistence via PrismaPg adapter |

### Route handler pattern

Every route handler wraps with `withApi()` and calls `requireAuth()`:

```ts
export const GET = withApi(async (req: Request) => {
  const userId = await requireAuth(); // throws ApiError.unauthorized() if not logged in
  // ...
  return ok(data);           // { ok: true, data }
  // or:
  return fail(ApiError.notFound()); // { ok: false, error: { code, message } }
});
```

- `withApi` (`src/lib/api/handler.ts`): catches `ApiError`, `ZodError`, and unexpected errors uniformly.
- `requireAuth` (`src/lib/auth.ts`): resolves Clerk session → upserts `User` row → returns internal `userId` (Prisma cuid, not Clerk id). Use `requireAuthContext()` when you need both ids.
- All responses use `ok()` / `fail()` from `src/lib/api/response.ts` for a consistent `{ ok, data|error }` envelope.

### Auth & route protection

`src/proxy.ts` (not `middleware.ts`) is the Clerk middleware for Next.js 16. Public routes: `/`, `/sign-in(.*)`, `/sign-up(.*)`. Everything else is protected.

`src/lib/env.ts` validates required env vars at startup (fails fast). Required: `DATABASE_URL`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.

### Database schema

10 models, 12 enums. All IDs are `cuid()`, all foreign keys cascade on delete.

**Core graph:** `User` → `UserSettings` (1:1), `Asset[]`, `Liability[]`, `Income[]`, `Expense[]`, `Goal[]`, `Decision[]`

**Join tables:** `GoalAssetAllocation` (Goal ↔ Asset), `DecisionGoalImpact` (Decision ↔ Goal)

**Numeric conventions:**
- Money: `Decimal @db.Decimal(14, 2)` — e.g. `"1500.00"`
- Rates/percentages: `Decimal @db.Decimal(5, 4)` stored as decimal fractions — e.g. `0.03` = 3%
- The PrismaPg adapter strips trailing zeros from Decimal results (e.g. `"0.03"` not `"0.0300"`); use `Number()` + `toBeCloseTo()` in tests for Decimal assertions.

**`Decision` model** stores inputs/results as JSON columns (`inputs`, `assumptionsSnapshot`, `baselineSnapshot`, `resultSnapshot`) and tracks `verdict` + `confidenceLevel` after evaluation.

### Services (currently stubs)

All domain logic lives in `src/services/`. These are stub implementations and are the primary area for future development:

- `snapshot.service.ts` — builds `FinancialSnapshot` (totals: assets, liabilities, income, expenses, surplus)
- `decision.service.ts` — evaluates a decision against guardrails, returns `DecisionResult` with `verdict` + per-guardrail statuses
- `goal.service.ts` — computes `GoalProgress` (percent complete, months to target)
- `projection.service.ts` — time-series net worth projection (`ProjectionResult`)

Default assumption constants are in `src/lib/defaults.ts`; per-user overrides live in `UserSettings`.

### Testing

Integration tests only (`tests/integration/`). Tests run sequentially (`fileParallelism: false`) against a real local Postgres DB. Cleanup truncates `"User"` with CASCADE between tests.

Test helpers:
- `tests/helpers/factories.ts` — typed factory functions for every model
- `tests/helpers/cleanup.ts` — `TRUNCATE TABLE "User" CASCADE`
- `tests/helpers/prisma.ts` — shared Prisma client for tests

Seed personas: Alice (`DETAILED` mode, full data graph) and Bob (`QUICK` mode, minimal).

# Subagent Strategy
- Always and aggressively offload online research (eg, docs), codebase exploration, and log analysis to subagents.
- When you're about to check logs, defer that to a haiku subagent.
- For complex problems you're going around in circles with, get a fresh perspective by asking subagents.
- When spawning a subagent, include a "Why" in the subagent's system prompt because it will help it filter the signal from the noise.