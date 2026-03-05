# Baseline UI — First-Time User Journey

This document describes the onboarding flow that guides first-time authenticated users through financial setup and into their overview dashboard.

## Overview

When a user lands on `/overview`, the app checks whether they have existing baseline data. If not, it walks them through a four-step flow:

1. **Intent selection** — "What would you like to do today?"
2. **Quick financial setup** — Five number inputs covering income, expenses, debt, savings, investments
3. **Financial snapshot** — Summary banner + four metric cards computed from the baseline
4. **Next actions** — CTA links to decisions, goals, and settings

Returning users with existing data skip directly to step 3.

## Files

| Path | Type | Purpose |
|------|------|---------|
| `src/lib/format.ts` | Utility | `formatCurrency()` — USD formatting via `Intl.NumberFormat` |
| `src/lib/snapshot.ts` | Utility | `computeSnapshot()` and `summarizeSnapshot()` — client-side financial snapshot computation |
| `src/types/baseline.types.ts` | Types | `BaselineResponse`, serialized model interfaces, `FinancialSnapshot` |
| `src/components/ui/MetricCard.tsx` | Component | Reusable stat card with label, value, subtitle, status coloring |
| `src/components/IntentSelector.tsx` | Component | Step 1 — three intent cards |
| `src/components/forms/QuickSetupForm.tsx` | Component | Step 2 — five-field form, submits `PUT /api/baseline` |
| `src/components/metrics/SnapshotDisplay.tsx` | Component | Step 3 — summary banner + metric grid |
| `src/components/NextActions.tsx` | Component | Step 4 — CTA links |
| `src/app/(main)/overview/OverviewContent.tsx` | Orchestrator | Client-side state machine driving the flow |
| `src/app/(main)/overview/page.tsx` | Page | Server component rendering `OverviewContent` |
| `tests/unit/snapshot-compute.test.ts` | Tests | 8 unit tests for snapshot computation |

## Client-Side Snapshot Computation

The server-side snapshot service (`src/services/snapshot.service.ts`) is still a stub. Snapshot values are computed client-side in `src/lib/snapshot.ts`.

### `computeSnapshot(data: BaselineResponse): SnapshotWithExtras`

Computes from baseline arrays:

- `totalAssets` — sum of all asset values
- `liquidAssets` — sum of assets where `isLiquid === true`
- `totalLiabilities` — sum of all liability balances
- `monthlyIncome` — sum of all income monthly amounts
- `monthlyExpenses` — sum of all expense monthly amounts
- `netWorth` — `totalAssets - totalLiabilities`
- `monthlySurplus` — `monthlyIncome - monthlyExpenses`
- `emergencyRunwayMonths` — `liquidAssets / monthlyExpenses` (0 if no expenses)
- `debtToIncomeRatio` — `totalLiabilities / (monthlyIncome * 12)` (0 if no income)

### `summarizeSnapshot(s: SnapshotWithExtras): string`

Returns natural language text:
- Reports surplus or deficit amount
- Compares emergency runway against the recommended minimum (from `DEFAULT_ASSUMPTIONS.minEmergencyMonths`)

## API Change: PUT /api/baseline

The PUT handler now additionally sets onboarding flags within the same transaction:

```ts
prisma.user.update({
  where: { id: userId },
  data: { onboardingComplete: true, mode: quick ? "QUICK" : "DETAILED" },
})
```

This means the first baseline submission marks the user as onboarded and persists their mode choice.

## Orchestrator State Machine

`OverviewContent.tsx` manages a `"loading" | "intent" | "setup" | "snapshot"` state:

```
mount → fetch GET /api/baseline
  ├─ has data → "snapshot" (compute + display)
  └─ empty    → "intent"
                  └─ onSelect → "setup"
                                  └─ onComplete(data) → "snapshot"
```

- **loading** — pulse skeleton placeholder
- **intent** — `IntentSelector` with three cards (all route to setup for MVP)
- **setup** — `QuickSetupForm` submits to `PUT /api/baseline`
- **snapshot** — `SnapshotDisplay` + `NextActions`

## Components

### MetricCard

Pure presentational card. Props:

- `label: string` — metric name
- `value: string` — pre-formatted display value
- `subtitle?: string` — additional context
- `status?: "positive" | "negative" | "neutral"` — controls text color (green/red/gray)

### IntentSelector

Three clickable cards:
- "Understand my finances"
- "Check a financial decision"
- "Track progress toward goals"

All call `onSelect(intent)`. For MVP, all route to the same setup form.

### QuickSetupForm

Five fields with `$` prefix and decimal input mode:
- Monthly take-home pay
- Essential monthly expenses
- Total debt
- Liquid savings
- Investments & retirement

Validation: non-negative numbers, at least one field > 0. Uses string state for controlled inputs, converts to numbers on submit. Calls `PUT /api/baseline` with the quick-mode payload shape.

### SnapshotDisplay

- Top banner colored by surplus (green) or deficit (red) with `summarizeSnapshot()` text
- Grid of four `MetricCard`s: Monthly Surplus/Deficit, Net Worth, Emergency Runway, Debt Load

### NextActions

Three CTA links:
- Primary: "Evaluate a financial decision" → `/decisions/new`
- Secondary: "Set a goal" → `/goals`
- Secondary: "Refine your inputs" → `/settings`

## Test Coverage

`tests/unit/snapshot-compute.test.ts` — 8 tests:

- Empty baseline returns all zeros
- Positive surplus scenario with correct totals
- Deficit scenario (expenses > income)
- Zero income — debt-to-income ratio defaults to 0
- Zero expenses — emergency runway defaults to 0
- `summarizeSnapshot` surplus + good runway text
- `summarizeSnapshot` deficit + low runway text
- `summarizeSnapshot` zero surplus edge case

## Verification Status

- `npm run lint` — passed (pre-existing warning only)
- `npx tsc --noEmit` — passed
- `npm test` — 133 tests passed (125 integration + 8 new unit)
- `npm run build` — passed
