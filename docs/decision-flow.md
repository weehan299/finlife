# Decision Flow Architecture

This document describes the Decision Check feature — the core "Can I afford this?" flow. It covers the data model, service layer, API endpoints, and UI workspace.

## Key Files

| Layer | Files |
|---|---|
| Types | `src/types/decision.types.ts` |
| Schemas | `src/schemas/decision.schema.ts` |
| Services | `src/services/decision.service.ts`, `src/services/snapshot.service.ts` |
| API | `src/app/api/decisions/route.ts`, `src/app/api/decisions/evaluate/route.ts`, `src/app/api/decisions/[id]/route.ts` |
| UI | `src/app/(main)/decisions/new/DecisionWorkspace.tsx`, `src/components/decisions/*.tsx` |
| Tests | `tests/integration/decision-evaluate.test.ts` |

## Flow Overview

```
User picks template → fills inputs → POST /api/decisions/evaluate → instant verdict
                                                                   ↓
                                           User tweaks inputs → re-evaluates (no DB write)
                                                                   ↓
                                           User clicks "Save" → POST /api/decisions (persists)
```

The evaluate endpoint is stateless — it reads the user's current financial baseline from the DB, runs all computations, and returns the result without writing anything. This enables instant iteration: the user can change inputs and re-evaluate repeatedly before deciding to save.

## Templates

Six decision templates, each with its own input schema and financial math:

| Template | What it models | Key inputs |
|---|---|---|
| `HOME_PURCHASE` | Mortgage + ongoing housing costs | purchasePrice, downPayment, rate, term |
| `NEW_LOAN` | Amortized loan (auto, personal, student) | loanAmount, rate, term |
| `LARGE_PURCHASE` | One-time buy, optionally financed | purchasePrice, upfrontPayment, financing |
| `INCOME_LOSS` | Income reduction stress test | incomeReductionMonthly |
| `RECURRING_EXPENSE` | New monthly cost | monthlyAmount |
| `ONE_TIME_EXPENSE` | Single expense | amount |

Each template maps to a Zod schema in `src/schemas/decision.schema.ts`. The `parseTemplateInputs(template, inputs)` function dispatches to the correct schema at runtime.

## Service Architecture

### Evaluation Pipeline

`evaluateDecision()` in `src/services/decision.service.ts` orchestrates six steps:

```
1. buildSnapshot(userId)        → baseline financial picture (SnapshotWithExtras)
2. resolveGuardrails(userId)    → merged UserSettings + DEFAULT_ASSUMPTIONS
3. computeTemplateImpact(...)   → TemplateImpact (upfront, monthly, new debt, etc.)
4. applyDecisionToSnapshot(...) → post-decision snapshot
5. computeStressSnapshot(...)   → stressed snapshot (guaranteed income only)
6. runGuardrails(...)           → per-guardrail PASS/CAUTION/FAIL + deriveVerdict
```

### Snapshot Service (`src/services/snapshot.service.ts`)

- **`buildSnapshot(userId)`** — Queries assets, liabilities, incomes, expenses from DB. Serializes Prisma Decimals to numbers. Delegates to `computeSnapshot()` from `src/lib/snapshot.ts` for the math. Returns both the computed `SnapshotWithExtras` and the raw `BaselineResponse` (needed by stress testing).

- **`resolveGuardrails(userId)`** — Fetches `UserSettings`, falls back to `DEFAULT_ASSUMPTIONS` for any unset field. Returns a flat `ResolvedGuardrails` object with all thresholds needed by guardrail checks.

### Template Impact (`computeTemplateImpact`)

Each template produces a `TemplateImpact`:

```typescript
{
  upfrontAmount: number;      // deducted from liquid assets
  monthlyImpact: number;      // added to monthly expenses
  newLiabilityBalance: number; // added to total liabilities
  monthlyIncomeChange: number; // added to monthly income (negative for loss)
  isHousing: boolean;         // triggers housing ratio guardrail
  monthlyHousingCost: number; // total housing cost (for ratio calc)
}
```

For debt templates, `computeAmortizationPayment()` uses the standard formula: `P * r(1+r)^n / ((1+r)^n - 1)`.

HOME_PURCHASE adds property tax, insurance, and maintenance on top of the mortgage P&I, and subtracts current rent as savings.

### Applying the Decision

`applyDecisionToSnapshot(baseline, impact)` produces a new `SnapshotWithExtras` by:
- Subtracting `upfrontAmount` from liquid assets and total assets
- Adding `newLiabilityBalance` to total liabilities
- Adding `monthlyImpact` to monthly expenses
- Adding `monthlyIncomeChange` to monthly income
- Recomputing derived fields (net worth, surplus, runway, DTI)

### Stress Snapshot

`computeStressSnapshot()` models a worst-case scenario:
- Income = guaranteed sources only (`isGuaranteed: true`)
- Expenses = essential at full amount (or `stressMonthlyAmount` override), non-essential reduced by `stressExpenseReductionRate` (default 20%)
- Decision's added expenses are preserved on top

### Guardrails

Five guardrails, each returning PASS / CAUTION / FAIL:

| Guardrail | Applies to | PASS | CAUTION | FAIL |
|---|---|---|---|---|
| `emergencyRunway` | All | >= min months | >= 75% of min | < 75% of min |
| `postDecisionCash` | All | >= min + emergency buffer | >= min | < min |
| `monthlySurplus` | All | >= min * 1.2 | >= min | < min |
| `debtToIncome` | HOME_PURCHASE, NEW_LOAN, LARGE_PURCHASE (financed) | <= max | <= max * 1.1 | > max * 1.1 |
| `housingRatio` | HOME_PURCHASE only | <= max | <= max * 1.1 | > max * 1.1 |

Thresholds come from `ResolvedGuardrails` (user settings merged with defaults).

**Verdict derivation:** FAIL if any guardrail fails. CAUTION if any guardrail is caution or stress runway < min. PASS otherwise.

### Confidence Level

Based on data completeness:
- **HIGH** — DETAILED mode + has assets, income, and expenses
- **MEDIUM** — Has income and expenses
- **LOW** — Missing income or expenses

## API Endpoints

### `POST /api/decisions/evaluate`

Stateless evaluation. No DB write.

**Request:**
```json
{
  "template": "HOME_PURCHASE",
  "inputs": {
    "purchasePrice": 400000,
    "downPaymentAmount": 80000,
    "mortgageTermMonths": 360,
    "annualInterestRate": 0.065
  }
}
```

**Response:** `EvaluateDecisionOutput` — verdict, guardrails, baseline/post/stress snapshots, computed amounts, confidence level.

### `POST /api/decisions`

Save an evaluated decision. Re-evaluates server-side for fresh results.

**Request:** Same as evaluate + `name` field.

**Response:** Created decision with id, verdict, and full result.

### `GET /api/decisions`

List user's decisions. Optional `?status=EVALUATED` filter. Returns `DecisionSummary[]` ordered by `updatedAt` desc.

### `GET /api/decisions/[id]`

Full decision detail including all JSON snapshot columns.

## UI Architecture

### Workspace State Machine

`DecisionWorkspace.tsx` manages three states:

```
"pick-template" → "input-form" → "results"
```

After first evaluation, the form stays visible alongside results in a side-by-side layout (2/5 + 3/5 grid on large screens). The user changes inputs and clicks "Re-evaluate" — no auto-debounce, manual trigger only.

### Components

| Component | Purpose |
|---|---|
| `TemplatePicker` | 2x3 grid of template cards |
| `DecisionInputForm` | Template-aware form with currency ($), percent (%), and number fields |
| `VerdictBanner` | Color-coded banner (green/amber/red) with verdict + key stat |
| `ComparisonTable` | Before/after table with delta coloring for 6 metrics |
| `StressTestSection` | Stressed metric cards + guardrail check list |
| `DecisionResults` | Composes VerdictBanner + ComparisonTable + StressTestSection |

### Decisions List Page

`/decisions` fetches `GET /api/decisions` and renders saved decisions as cards with verdict badges. Links to `/decisions/new` for creating new evaluations.

## Data Model

The `Decision` Prisma model stores:

- `template` — which of the 6 templates
- `name` — user-given name
- `inputs` (JSON) — template-specific inputs
- `upfrontAmount`, `monthlyImpact` — computed financial impact
- `status` — DRAFT / EVALUATED / ARCHIVED
- `verdict` — PASS / CAUTION / FAIL
- `confidenceLevel` — HIGH / MEDIUM / LOW
- `assumptionsSnapshot` (JSON) — guardrail settings at evaluation time
- `baselineSnapshot` (JSON) — user's financial state at evaluation time
- `resultSnapshot` (JSON) — full evaluation result

Snapshots are stored so saved decisions show historical context even if the user's finances change later.

## Deferred Scope

- **Goal impacts** — `evaluateDecision()` returns `goalImpacts: []`. Future work will compute projected delay to goals from the decision's financial impact.
- **Decision detail page** — `/decisions/[id]` is a placeholder. Will render saved results using the same `DecisionResults` component.
