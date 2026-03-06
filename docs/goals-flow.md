# Goals Flow Architecture

This document describes the Goals feature — creating financial goals, tracking progress with growth-rate projections, and viewing how decisions impact goal timelines.

## Key Files

| Layer | Files |
|---|---|
| Types | `src/types/goal.types.ts` |
| Schemas | `src/schemas/goal.schema.ts` |
| Serialization | `src/lib/goals.ts` |
| Services | `src/services/goal.service.ts` |
| API | `src/app/api/goals/route.ts`, `src/app/api/goals/[id]/route.ts`, `src/app/api/goals/[id]/allocations/route.ts`, `src/app/api/goals/[id]/allocations/[allocId]/route.ts` |
| UI | `src/app/(main)/goals/GoalsContent.tsx`, `src/app/(main)/goals/[id]/GoalDetail.tsx`, `src/components/forms/GoalForm.tsx`, `src/components/goals/GoalCard.tsx`, `src/components/goals/GoalImpactSection.tsx` |
| Tests | `tests/integration/goal-service.test.ts`, `tests/integration/goal-crud.test.ts` |

## Flow Overview

```
/goals → grid of GoalCards with progress bars → click card → /goals/[id] detail page
  ↓                                                              ↓
"+ Add Goal" → Drawer with GoalForm → POST /api/goals      Edit → Drawer with GoalForm → PATCH
                                                            Delete → DELETE /api/goals/[id]
                                                              ↓
                                                        Asset Allocations section → add/remove
                                                        Decision Impacts section → read-only
```

## Data Model

Uses three existing Prisma models (no migrations needed):

### Goal

| Field | Type | Notes |
|---|---|---|
| `id` | `cuid()` | Primary key |
| `userId` | `String` | FK → User (cascade delete) |
| `type` | `GoalType` enum | SAVINGS, RETIREMENT, FINANCIAL_INDEPENDENCE, CUSTOM |
| `name` | `String` | User-provided label |
| `targetAmount` | `Decimal(14,2)` | Goal target |
| `targetDate` | `DateTime?` | Optional deadline |
| `startingAmount` | `Decimal(14,2)` | Initial amount (default 0) |
| `monthlyContribution` | `Decimal(14,2)` | Regular contribution (default 0) |
| `provenance` | `InputProvenance` | USER_ENTERED, USER_ESTIMATED, SYSTEM_DEFAULT |

### GoalAssetAllocation

Links a Goal to an Asset with an allocation mode:

| Field | Type | Notes |
|---|---|---|
| `goalId` | `String` | FK → Goal (cascade) |
| `assetId` | `String` | FK → Asset (cascade) |
| `mode` | `GoalAssetAllocationMode` | FULL_VALUE, FIXED_AMOUNT, PERCENT_OF_VALUE |
| `allocationValue` | `Decimal(10,4)?` | Interpretation depends on mode |

Unique constraint: `(goalId, assetId)` — one allocation per asset per goal.

### DecisionGoalImpact

Stores how an evaluated decision affects a goal:

| Field | Type | Notes |
|---|---|---|
| `decisionId` | `String` | FK → Decision (cascade) |
| `goalId` | `String` | FK → Goal (cascade) |
| `projectedDelayMonths` | `Int?` | Additional months to reach target |
| `deltaToTarget` | `Decimal(14,2)?` | Shortfall at original timeframe |
| `impactSnapshot` | `Json?` | Point-in-time snapshot |

Unique constraint: `(decisionId, goalId)`.

## Validation Schemas

Defined in `src/schemas/goal.schema.ts`.

### Create goal

- `type`: required, GoalType enum
- `name`: required string, min 1, max 120
- `targetAmount`: required number, positive
- `targetDate`: optional ISO datetime string
- `startingAmount`: number >= 0, default 0
- `monthlyContribution`: number >= 0, default 0
- `provenance`: InputProvenance enum, default `USER_ENTERED`

### Update goal

`createGoalSchema.partial()` — all fields optional, provided values must satisfy original constraints.

### Goal allocation input

- `assetId`: required string
- `mode`: required GoalAssetAllocationMode enum
- `allocationValue`: optional number >= 0

## Serialization

`src/lib/goals.ts` provides `serializeGoal()`:

- Converts Prisma Decimals to numbers via `Number()`
- Converts dates to ISO strings
- Computes `effectiveValue` per allocation based on mode:
  - `FULL_VALUE` → full asset value
  - `FIXED_AMOUNT` → the fixed amount
  - `PERCENT_OF_VALUE` → asset value * allocation percentage

Returns a `SerializedGoal` with nested `SerializedGoalAllocation[]`.

## Service Architecture

### Pure Functions (`src/services/goal.service.ts`)

#### `computeAllocatedAmount(allocations)`

Sums `effectiveValue` across all allocations. Returns 0 for empty array.

#### `resolveGrowthRate(goalType, settings?)`

Picks the annual growth rate based on goal type:

| Goal Type | Rate Source | Default |
|---|---|---|
| SAVINGS, CUSTOM | `savingsInterestRate` | 1.5% |
| RETIREMENT, FINANCIAL_INDEPENDENCE | `investmentGrowthRate` | 5% |

Uses user's `UserSettings` if provided, otherwise falls back to `DEFAULT_ASSUMPTIONS`.

#### `getGoalProgress(goal, growthRate)`

Computes progress metrics:

1. **`currentAmount`** — allocated sum if allocations exist, otherwise `startingAmount`
2. **`percentComplete`** — `currentAmount / targetAmount * 100`, capped at 100
3. **`amountRemaining`** — `max(0, targetAmount - currentAmount)`
4. **`estimatedMonthsToTarget`** — computed via logarithmic formula when growth rate > 0:

```
n = ln((target * r + PMT) / (current * r + PMT)) / ln(1 + r)
```

Where `r` = monthly rate, `PMT` = monthly contribution. Falls back to simple division `remaining / contribution` when rate = 0. Returns `null` when contribution is 0.

#### `computeDecisionGoalImpact(goal, progress, monthlyImpactReduction, growthRate)`

Models how a decision's monthly expense impact delays a goal:

- Creates a modified goal with reduced contribution
- Computes new progress to find delay in months
- Computes future value shortfall at original timeframe using:

```
FV = PV * (1+r)^n + PMT * ((1+r)^n - 1) / r
```

Returns `{ projectedDelayMonths, deltaToTarget }`. Both null if contribution drops to zero.

### Async Entry Point

#### `computeAllGoalProgress(userId)`

Fetches all user goals (with allocations and assets) and user settings from DB. Returns `GoalWithProgress[]` — each goal serialized with computed progress.

## API Endpoints

All routes require authentication via `requireAuth()` and enforce ownership checks.

### `GET /api/goals`

Lists all goals for the authenticated user with computed progress.

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "...",
      "type": "SAVINGS",
      "name": "Emergency Fund",
      "targetAmount": 25000,
      "progress": {
        "goalId": "...",
        "currentAmount": 5000,
        "percentComplete": 20,
        "amountRemaining": 20000,
        "estimatedMonthsToTarget": 38
      },
      "allocations": []
    }
  ]
}
```

### `POST /api/goals`

Creates a new goal. Returns 201 with serialized goal.

**Request:**
```json
{
  "type": "RETIREMENT",
  "name": "Retire at 55",
  "targetAmount": 1000000,
  "monthlyContribution": 2000,
  "startingAmount": 50000
}
```

### `GET /api/goals/[id]`

Returns a single goal with progress, allocations, and decision impacts.

**Response** includes additional `impacts` array:
```json
{
  "ok": true,
  "data": {
    "...goal fields",
    "progress": { "..." },
    "impacts": [
      {
        "id": "...",
        "decisionId": "...",
        "decisionName": "Buy a house",
        "projectedDelayMonths": 8,
        "deltaToTarget": -15000
      }
    ]
  }
}
```

### `PATCH /api/goals/[id]`

Partially updates a goal. Ownership check — returns 404 for non-owned/missing goals.

### `DELETE /api/goals/[id]`

Deletes a goal. Cascade deletes associated allocations and decision impacts.

### `GET /api/goals/[id]/allocations`

Lists allocations for a goal with asset details.

### `POST /api/goals/[id]/allocations`

Adds an asset allocation to a goal. Validates both goal and asset ownership.

**Request:**
```json
{
  "assetId": "...",
  "mode": "FULL_VALUE"
}
```

### `DELETE /api/goals/[id]/allocations/[allocId]`

Removes an allocation. Ownership verified via the goal's userId.

## UI Architecture

### Goals List Page (`/goals`)

`GoalsContent.tsx` manages state:

```
mount → fetch GET /api/goals
  ├─ has goals → grid of GoalCards
  └─ empty    → dashed border empty state with "Create a Goal" CTA
```

- "Add Goal" button opens a `Drawer` with `GoalForm`
- Clicking a card navigates to `/goals/[id]`

### GoalCard

Displays:
- Goal name + type badge (color-coded: blue/purple/emerald/gray)
- Target amount
- Progress bar (green >= 75%, yellow 25-75%, red < 25%)
- Percent complete + estimated months remaining

### GoalForm

Following `AssetForm.tsx` pattern:
- Props: `initialData?`, `onSuccess()`
- Fields: type (select), name, targetAmount ($), targetDate (date), startingAmount ($), monthlyContribution ($)
- Client-side Zod validation before submit
- POST for create, PATCH for update
- Delete button shown in edit mode

### Goal Detail Page (`/goals/[id]`)

`GoalDetail.tsx` renders three sections:

1. **Progress** — visual bar + 4 metrics (current, target, remaining, est. months)
2. **Asset Allocations** — list of allocated assets with effective values + remove button
3. **Decision Impacts** — read-only list via `GoalImpactSection` showing delay months and shortfall per decision

Edit button opens `Drawer` with `GoalForm` pre-populated.

### GoalImpactSection

Renders `GoalImpactSummary[]`:
- Decision name
- Projected delay in months (orange)
- Shortfall amount (red)
- Fallback text when no impacts exist

## Test Coverage

### `tests/integration/goal-service.test.ts` — 18 tests

Pure function tests (no DB):

- `computeAllocatedAmount` — FULL_VALUE, FIXED_AMOUNT, PERCENT_OF_VALUE modes, empty array
- `getGoalProgress` — with/without allocations, zero contribution, goal already met, zero growth rate, growth rate projection
- `resolveGrowthRate` — each goal type, with/without user settings
- `computeDecisionGoalImpact` — reduced contribution, zero contribution, zero original contribution

### `tests/integration/goal-crud.test.ts` — 15 tests

API route tests (mock Clerk, real DB):

- POST /api/goals — creates goal (201), rejects invalid type (400), missing name (400), negative targetAmount (400)
- GET /api/goals — returns goals with progress, empty for new user
- GET /api/goals/[id] — returns single goal with progress, 404 for other user's goal
- PATCH /api/goals/[id] — updates goal, 404 for other user's goal
- DELETE /api/goals/[id] — deletes owned goal, 404 for non-existent
- POST /api/goals/[id]/allocations — adds allocation (201), rejects other user's asset (404)
- DELETE /api/goals/[id]/allocations/[allocId] — removes allocation

## Verification Status

- `npm run lint` — passed (0 errors, pre-existing warnings only)
- `npx tsc --noEmit` — passed
- `npm test` — 207 tests passed (17 test files)
- `npm run build` — passed

## Deferred Scope

- **Decision integration** — `evaluateDecision()` currently returns `goalImpacts: []`. Future work will compute and persist `DecisionGoalImpact` records after decision evaluation using `computeDecisionGoalImpact()`.
- **Add allocation UI** — The detail page shows existing allocations and supports removal, but the "add allocation" form (asset picker + mode selector) is not yet built in the UI.
- **Goal progress on overview** — The overview dashboard does not yet surface goal progress summaries.
