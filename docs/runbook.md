
## Runbook: Commands

### 0) Environment Setup

```bash
# Create local env file from template
cp .env.example .env.local

# Then fill real values for:
# - DATABASE_URL
# - CLERK_SECRET_KEY
# - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
```

Strict env validation is enabled at startup; missing required vars will fail `dev`, `build`, and API execution early.

### 1) Install Dependencies

```bash
npm install
```

### 2) Database Lifecycle

```bash
# Start PostgreSQL
docker compose up -d

# Verify DB container
docker compose ps

# Generate Prisma client
npx prisma generate

# Create migration after schema edits
npx prisma migrate dev --name <migration_name>

# Apply migrations (CI/production)
npx prisma migrate deploy

# Seed local database
npx prisma db seed

# Optional GUI
npx prisma studio
```

### 3) Development Server

```bash
npm run dev
```

### 4) Quality Gates (Local CI Sequence)

```bash
# Lint app code
npm run lint

# Type check
npx tsc --noEmit

# Run all integration tests (67 tests)
npm test

# Production build
npm run build
```

### 5) Test Variants

```bash
# Watch mode
npm run test:watch

# Single test file
npx vitest run tests/integration/user-settings.test.ts

# Pattern filter
npx vitest run -t "cascade"
```
