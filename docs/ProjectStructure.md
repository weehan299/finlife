
# FinLife

Personal finance decision engine for modeling goals, assets, liabilities, incomes, expenses, and running what-if decisions.

## Stack

- Framework: Next.js 16 (App Router) + React 19 + TypeScript (strict)
- Styling: Tailwind CSS v4
- Linting: ESLint (flat config + `eslint-config-next`)
- Database: PostgreSQL 16 + Prisma 7.4
- Auth: Clerk
- Validation: Zod
- Testing: Vitest 4 + tsx

## How the Project Structure Works

The repo is split by responsibility so UI, API, business logic, validation, and persistence stay decoupled.

```text
finlife/
├── prisma/
│   ├── schema.prisma            # Canonical data model (User, Asset, Goal, Decision, etc.)
│   ├── migrations/              # Versioned schema changes
│   └── seed.ts                  # Seed data (Alice + Bob personas)
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── (auth)/              # Public auth routes
│   │   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   │   └── sign-up/[[...sign-up]]/page.tsx
│   │   ├── (main)/              # Authenticated application shell + pages
│   │   │   ├── layout.tsx
│   │   │   ├── overview/page.tsx
│   │   │   ├── decisions/page.tsx
│   │   │   ├── decisions/new/page.tsx
│   │   │   ├── decisions/[id]/page.tsx
│   │   │   ├── goals/page.tsx
│   │   │   ├── goals/[id]/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── api/                 # REST/JSON route handlers (API-first boundary)
│   │   │   ├── baseline/route.ts
│   │   │   ├── snapshot/route.ts
│   │   │   ├── decisions/route.ts
│   │   │   ├── goals/route.ts
│   │   │   └── settings/route.ts
│   │   ├── globals.css          # Tailwind import
│   │   ├── layout.tsx           # Root layout + ClerkProvider
│   │   └── page.tsx             # Landing page
│   ├── components/
│   │   ├── ui/                  # UI primitives (reserved)
│   │   ├── metrics/             # Metric presentation components
│   │   ├── forms/               # Form components
│   │   └── charts/              # Chart components
│   ├── lib/
│   │   ├── api/
│   │   │   ├── error.ts         # Shared ApiError + standardized error codes
│   │   │   ├── response.ts      # Standard API success/error envelope helpers
│   │   │   ├── validation.ts    # ZodError -> field error mapper
│   │   │   └── handler.ts       # Route wrapper with centralized error handling
│   │   ├── env.ts               # Startup env validation (Zod, fail-fast)
│   │   ├── db.ts                # Prisma client singleton (PrismaPg adapter)
│   │   ├── auth.ts              # `requireAuth()` + internal user-id resolution
│   │   └── defaults.ts          # Default assumptions constants
│   ├── schemas/                 # Zod schemas for API + forms
│   ├── services/                # Domain/business logic (framework-agnostic)
│   └── types/                   # Shared TypeScript interfaces/types
├── tests/
│   ├── setup.ts
│   ├── helpers/
│   └── integration/             # DB integration suites (67 tests)
├── src/proxy.ts                 # Next 16 proxy-based Clerk route protection
├── .env.example                 # Required local env template
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── vitest.config.ts
└── compose.yaml
```

## Layer Responsibilities

- Presentation (`src/app`, `src/components`): page rendering, layout, user interactions.
- API (`src/app/api`): JSON endpoint contracts for web and future mobile clients.
- Domain (`src/services`): pure TS financial logic (snapshot, decision, goals, projection).
- Validation (`src/schemas`): Zod schemas shared by route handlers and forms.
- Data access (`src/lib/db.ts` + Prisma): persistence and relational constraints.

This API-first layout ensures mobile clients can call the same `/api/*` endpoints without backend redesign.