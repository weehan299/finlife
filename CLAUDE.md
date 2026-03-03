# FinLife

Personal finance decision-engine — helps users model goals, assets, liabilities, incomes, expenses, and run "what-if" decisions.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Database:** PostgreSQL 16 (Docker Compose) + Prisma 7.4
- **Auth:** Clerk
- **Validation:** Zod
- **Testing:** Vitest 4 + tsx

## Prerequisites

- Node.js 22+
- Docker & Docker Compose

## Commands

### Database

```bash
# Start PostgreSQL container
docker compose up -d

# Check container health
docker compose ps

# Generate Prisma client after schema changes
npx prisma generate

# Create a new migration after schema changes
npx prisma migrate dev --name <migration_name>

# Apply migrations (production / CI)
npx prisma migrate deploy

# Seed the database (2 user personas: Alice + Bob)
npx prisma db seed

# Open Prisma Studio (GUI database browser)
npx prisma studio
```

### Testing

```bash
# Run all integration tests (67 tests across 6 files)
npm test

# Run tests in watch mode
npm run test:watch

# Run a single test file
npx vitest run tests/integration/user-settings.test.ts

# Run tests matching a pattern
npx vitest run -t "cascade"
```

### Development

```bash
# Install dependencies
npm install

# Start Next.js dev server
npx next dev
```

## Project Structure

```
finlife/
├── prisma/
│   ├── schema.prisma          # 10 models, 12 enums
│   ├── seed.ts                # Seed script (Alice=DETAILED, Bob=QUICK)
│   └── migrations/
├── prisma.config.ts           # Prisma config (datasource URL, seed command)
├── src/
│   └── lib/
│       └── db.ts              # PrismaClient singleton (PrismaPg adapter)
├── tests/
│   ├── setup.ts               # beforeAll/afterAll: connect/disconnect
│   ├── helpers/
│   │   ├── prisma.ts          # Shared PrismaClient instance for tests
│   │   ├── cleanup.ts         # TRUNCATE "User" CASCADE between tests
│   │   └── factories.ts       # Factory functions for all 10 models
│   └── integration/
│       ├── user-settings.test.ts       # User + UserSettings (11 tests)
│       ├── financial-records.test.ts   # Asset, Liability, Income, Expense (18 tests)
│       ├── goals-allocations.test.ts   # Goal + GoalAssetAllocation (13 tests)
│       ├── decisions-impacts.test.ts   # Decision + DecisionGoalImpact (14 tests)
│       ├── cascade-delete.test.ts      # Full cascade chain (2 tests)
│       └── constraints.test.ts         # Edge cases & violations (9 tests)
├── vitest.config.ts
├── compose.yaml
└── .env                       # DATABASE_URL (not committed)
```

## Architecture Notes

### Prisma 7.4 Adapter Pattern

Prisma v7.4 removed the built-in query engine. The schema `datasource` block has no `url` — the connection is provided at runtime via a driver adapter:

```ts
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
```

### Decimal Handling

- Monetary fields: `Decimal @db.Decimal(14, 2)` — max `999999999999.99`
- Percentage fields: `Decimal @db.Decimal(5, 4)` — stored as fractions (3% = `0.03`)
- The PrismaPg adapter strips trailing zeros from Decimal `.toString()` (returns `"0.03"` not `"0.0300"`). In tests, use `Number()` + `toBeCloseTo()` for assertions.

### Database Conventions

- All IDs: `cuid()`
- All relations: `onDelete: Cascade` — deleting a User removes all child records
- Timestamps: `createdAt` (auto), `updatedAt` (`@updatedAt`)
- Test cleanup: single `TRUNCATE TABLE "User" CASCADE` clears everything

### Seed Data

Two personas covering all models and enum values:
- **Alice Chen** — DETAILED mode, onboarding complete, full data across all models
- **Bob Martinez** — QUICK mode, not onboarded, minimal data

### Test Conventions

- Each test file uses `beforeEach(cleanDatabase)` for full isolation
- Factory functions in `tests/helpers/factories.ts` accept override objects
- Tests run sequentially (`fileParallelism: false`) since they share one database
- Test timeout: 30 seconds (DB operations can be slow on first run)
