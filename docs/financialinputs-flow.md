# Financial Inputs — Centralized Input Management

This document describes the Financial Inputs page (`/settings`), which gives users a single organized place to view and edit all financial data that powers overview metrics, projections, and decisions.

## Overview

The page formerly labeled "Settings" was renamed to "Financial Inputs" and rebuilt from a placeholder into a fully functional page with six expandable category cards. Each card maps to a specific data source and includes add/edit actions via the shared drawer system. Deep links from Overview metric detail panels connect results back to the inputs that control them.

## Route & Navigation

- **Route:** `/settings` (unchanged)
- **Nav label:** "Financial Inputs" (was "Settings")
- **Deep linking:** `?section=income|spending|cash|investments|debt|assumptions` expands that card and scrolls to it on load

## Files

| Path | Type | Purpose |
|------|------|---------|
| `src/types/drawer.types.ts` | Types | Shared `EntityType` and `DrawerState` discriminated union |
| `src/components/forms/DrawerForm.tsx` | Component | Extracted drawer form router — dispatches to entity-specific forms |
| `src/components/forms/AssumptionsForm.tsx` | Component | Growth rates + guardrails edit form |
| `src/components/ui/InputCategoryCard.tsx` | Component | Expandable card with title, count badge, total, helper text |
| `src/app/(main)/settings/FinancialInputsContent.tsx` | Orchestrator | Client component rendering 6 cards with drawer integration |
| `src/app/(main)/settings/page.tsx` | Page | Server component rendering `FinancialInputsContent` |
| `src/app/api/settings/route.ts` | API | GET/PUT for user assumptions and guardrails |

## Architecture

### Shared Drawer System

The drawer form logic was extracted from `OverviewContent.tsx` into shared modules so both the Overview and Financial Inputs pages use the same code:

```
src/types/drawer.types.ts
  └─ EntityType = "asset" | "liability" | "income" | "expense" | "assumptions"
  └─ DrawerState = { open: false } | { open: true; mode: "add" | "edit"; ... }

src/components/forms/DrawerForm.tsx
  └─ Routes to AssetForm | LiabilityForm | IncomeForm | ExpenseForm | AssumptionsForm
  └─ Exports drawerTitles map
```

Both `OverviewContent.tsx` and `FinancialInputsContent.tsx` import from these shared modules. The Overview page no longer defines its own local `DrawerForm`, `EntityType`, or `DrawerState`.

### Page Data Flow

```
mount
  ├─ fetch GET /api/baseline  → baseline state (assets, liabilities, incomes, expenses)
  └─ fetch GET /api/settings   → settings state (assumptions & guardrails)

?section= query param → initializes expandedSection state

User action (add/edit/delete)
  └─ opens Drawer with DrawerForm
       └─ form submits to entity API
            └─ onSuccess → close drawer + refresh() re-fetches both APIs
```

### Data Mapping

| Card | Section Key | Source | Entity Type | Filter |
|------|-------------|--------|-------------|--------|
| Income | `income` | `baseline.incomes` | `income` | none |
| Spending | `spending` | `baseline.expenses` | `expense` | none |
| Cash & Savings | `cash` | `baseline.assets` | `asset` | category in {CASH_SAVINGS} |
| Investments | `investments` | `baseline.assets` | `asset` | category in {INVESTMENTS, RETIREMENT, PROPERTY, OTHER} |
| Debt | `debt` | `baseline.liabilities` | `liability` | none |
| Assumptions & Guardrails | `assumptions` | `/api/settings` | `assumptions` | none |

### Deep Links from Overview

| Detail Panel | Deep Link | Target Card |
|-------------|-----------|-------------|
| SurplusDetail | `/settings?section=income` | Income |
| NetWorthDetail | `/settings?section=investments` | Investments |
| RunwayDetail | `/settings?section=cash` | Cash & Savings |
| DebtLoadDetail | `/settings?section=debt` | Debt |

## Components

### InputCategoryCard

Expandable card with click-to-toggle header. Props:

- `id` — HTML id and section key
- `title` — card heading
- `description` — one-line summary
- `itemCount` — badge count
- `totalValue` / `totalLabel` — optional formatted total in header
- `helperText` — italic text explaining where this data is used
- `expanded` / `onToggle` — controlled expand state
- `children` — card body (typically `CategoryBreakdown` or key-value list)

Uses `useRef` + `scrollIntoView({ behavior: "smooth" })` when expanded to auto-scroll the targeted card into view.

### AssumptionsForm

Two-section form for editing user settings:

**Growth Rates** (5 fields):
- Inflation rate, Investment growth rate, Savings interest rate, Debt interest fallback, Safe withdrawal rate

**Guardrails** (6 fields):
- Retirement age, Min emergency months, Min post-decision cash, Min monthly surplus, Max debt-to-income, Max housing ratio

Percentage fields display as human-readable values (e.g. "3" for 3%) and convert to decimal fractions (0.03) on submit. Fetches current values from `GET /api/settings` on mount, submits via `PUT /api/settings`.

### DrawerForm

Shared component that routes to the correct entity form based on `drawer.entityType`:

| EntityType | Form Component | Data Source for Edit |
|------------|---------------|---------------------|
| `asset` | `AssetForm` | `baseline.assets` |
| `liability` | `LiabilityForm` | `baseline.liabilities` |
| `income` | `IncomeForm` | `baseline.incomes` |
| `expense` | `ExpenseForm` | `baseline.expenses` |
| `assumptions` | `AssumptionsForm` | `GET /api/settings` (self-fetching) |

## Settings API

### GET /api/settings

Returns the authenticated user's assumptions and guardrails. If no `UserSettings` record exists, returns defaults from `DEFAULT_ASSUMPTIONS`.

All Prisma `Decimal` fields are serialized to `number` via `Number()`.

**Response shape:**
```json
{
  "ok": true,
  "data": {
    "inflationRate": 0.03,
    "investmentGrowthRate": 0.05,
    "savingsInterestRate": 0.015,
    "debtInterestFallback": 0.08,
    "safeWithdrawalRate": 0.04,
    "retirementAge": 65,
    "minEmergencyMonths": 6,
    "minPostDecisionCash": 0,
    "minMonthlySurplus": 0,
    "maxDebtToIncome": 0.36,
    "maxHousingRatio": 0.28
  }
}
```

### PUT /api/settings

Validates body with `updateSettingsSchema` (all fields optional). Upserts `UserSettings` — creates if none exists, updates otherwise. Returns the full settings object.

## Verification Status

- `npm run lint` — passed (0 errors, pre-existing warnings only)
- `npx tsc --noEmit` — passed
- `npm test` — 228 tests passed
- `npm run build` — passed
