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
| `src/components/metrics/ProjectionDisplay.tsx` | Component | Net worth projection chart + milestone strip |
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

### ProjectionDisplay

SVG-based net worth projection chart with milestone strip below. Renders data from `GET /api/projections`.

Layout:
- **Desktop (lg+):** constrained to `max-w-[50%]` so it aligns with 2 of the 4 KPI columns above
- **Mobile/tablet:** full-width
- **Chart:** 600×160 viewBox with gradient fill area, line, and labeled data points
- **Milestone strip:** "Today" marker + future milestones with net worth values (`text-sm`, `min-w-[80px]`) and change indicators (green/red)

### NextActions

Three CTA links:
- Primary: "Evaluate a financial decision" → `/decisions/new`
- Secondary: "Set a goal" → `/goals`
- Secondary: "Refine your inputs" → `/settings`

## Editing Financial Items

Users can edit existing baseline items directly from the metric detail views in the overview experience.

### UI Flow

1. In a metric detail panel, expand a category in `CategoryBreakdown`.
2. Click the pencil icon next to an item row.
3. `onEditItem(entityType, id)` is forwarded to `OverviewContent`.
4. `OverviewContent` opens `Drawer` in `mode: "edit"` and stores the `entityType` + `itemId`.
5. `DrawerForm` resolves `initialData` from the current `baseline` arrays and renders the matching form.
6. After a successful update or delete, the drawer closes and `refreshBaseline()` refetches `GET /api/baseline` so cards and breakdowns update immediately.

### Entity Mapping

| Entity | Edit Form | Update Endpoint | Delete Endpoint |
|------|------|------|------|
| `asset` | `AssetForm` | `PATCH /api/baseline/assets/:id` | `DELETE /api/baseline/assets/:id` |
| `liability` | `LiabilityForm` | `PATCH /api/baseline/liabilities/:id` | `DELETE /api/baseline/liabilities/:id` |
| `income` | `IncomeForm` | `PATCH /api/baseline/income/:id` | `DELETE /api/baseline/income/:id` |
| `expense` | `ExpenseForm` | `PATCH /api/baseline/expenses/:id` | `DELETE /api/baseline/expenses/:id` |

### Validation and Error Handling

- Each form runs client-side zod validation before submitting.
- Forms submit as `PATCH` in edit mode and show inline errors for validation/API failures.
- Delete actions are available only in edit mode and call the entity-specific `DELETE` endpoint.
- Backend routes verify authentication and item ownership; non-owned or missing records return `404 Not Found`.
- Network failures show a generic retry message and preserve the current form state.

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
