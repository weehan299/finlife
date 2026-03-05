# Baseline API

This document describes the current baseline financial records API implementation in:

- `src/app/api/baseline/route.ts`
- `src/app/api/baseline/assets/[id]/route.ts`
- `src/app/api/baseline/liabilities/[id]/route.ts`
- `src/app/api/baseline/income/[id]/route.ts`
- `src/app/api/baseline/expenses/[id]/route.ts`

It also reflects validation and behavior verified by `tests/integration/baseline-api.test.ts`.

## Response Envelope

All baseline routes use the shared API response contract:

- Success: `{ ok: true, data, meta? }`
- Error: `{ ok: false, error: { code, message, fields? } }`

Relevant error codes used by baseline routes:

- `401 UNAUTHORIZED`
- `400 VALIDATION_ERROR`
- `404 NOT_FOUND`
- `500 INTERNAL_ERROR`

## Data Categories and Provenance

### Asset categories

- `CASH_CHECKING`
- `SAVINGS`
- `INVESTMENTS`
- `RETIREMENT`
- `PROPERTY`
- `OTHER`

### Liability categories

- `CREDIT_CARD`
- `STUDENT_LOAN`
- `PERSONAL_LOAN`
- `MORTGAGE`
- `OTHER`

### Income categories

- `TAKE_HOME`
- `GROSS`
- `OTHER_RECURRING`
- `VARIABLE`
- `FALLBACK`

### Expense categories

- `ESSENTIAL_FIXED`
- `ESSENTIAL_VARIABLE`
- `DISCRETIONARY`

### Provenance

- `USER_ENTERED`
- `USER_ESTIMATED`
- `SYSTEM_DEFAULT`

## Validation Schemas

Defined in `src/schemas/baseline.schema.ts`.

### Asset input (PUT and PATCH base)

- `category`: required enum
- `label`: required string, min 1, max 120
- `value`: required number, `>= 0`
- `isLiquid`: boolean, default `false`
- `monthlyContribution`: optional number, `>= 0`
- `annualGrowthRateOverride`: optional number, `0..1`
- `provenance`: enum, default `USER_ENTERED`

### Liability input

- `category`: required enum
- `label`: required string, min 1, max 120
- `balance`: required number, `>= 0`
- `annualInterestRate`: optional number, `0..1`
- `minimumPayment`: optional number, `>= 0`
- `remainingTermMonths`: optional positive integer
- `provenance`: enum, default `USER_ENTERED`

### Income input

- `category`: required enum
- `label`: required string, min 1, max 120
- `monthlyAmount`: required number, `> 0`
- `isGuaranteed`: boolean, default `true`
- `provenance`: enum, default `USER_ENTERED`

### Expense input

- `category`: required enum
- `label`: required string, min 1, max 120
- `monthlyAmount`: required number, `> 0`
- `stressMonthlyAmount`: optional number, `>= 0`
- `isEssential`: boolean, default `true`
- `provenance`: enum, default `USER_ENTERED`

### Patch schemas

Each PATCH route uses `.partial()` of the corresponding input schema:

- `patchAssetSchema`
- `patchLiabilitySchema`
- `patchIncomeSchema`
- `patchExpenseSchema`

All fields are optional on PATCH, but provided fields must satisfy the original constraints.

### Detailed baseline schema

`baselineInputSchema`:

- `assets`: array of asset input, default `[]`
- `liabilities`: array of liability input, default `[]`
- `incomes`: array of income input, default `[]`
- `expenses`: array of expense input, default `[]`

### Quick baseline schema

`quickBaselineInputSchema` (all optional, each `>= 0`):

- `monthlyTakeHome`
- `totalSavings`
- `totalInvestments`
- `totalDebt`
- `monthlyEssentialExpenses`
- `monthlyDiscretionaryExpenses`

## Serialization

Defined in `src/lib/baseline/serialize.ts`.

The route responses serialize Prisma Decimal fields to JSON numbers.

- Decimal values use `Number(...)`
- Nullable Decimal values become `number | null`
- `createdAt` and `updatedAt` are ISO strings

Serializer functions:

- `serializeAsset`
- `serializeLiability`
- `serializeIncome`
- `serializeExpense`

## Quick Mode Detection and Normalization

Defined in `src/lib/baseline/normalize.ts`.

### Structural quick detection

`isQuickPayload(body)` returns `true` when:

- body is an object and not null
- body does **not** contain the `assets` key

This means quick vs detailed mode is inferred structurally, not by explicit mode field.

### Quick field mapping

`normalizeQuickBaseline(input)` maps quick payload fields into canonical baseline records with `provenance: USER_ESTIMATED`.

- `totalSavings > 0` -> asset
  - `category: SAVINGS`
  - `label: Savings`
  - `isLiquid: true`
- `totalInvestments > 0` -> asset
  - `category: INVESTMENTS`
  - `label: Investments`
  - `isLiquid: false`
- `totalDebt > 0` -> liability
  - `category: OTHER`
  - `label: Total debt`
- `monthlyTakeHome > 0` -> income
  - `category: TAKE_HOME`
  - `label: Take-home pay`
  - `isGuaranteed: true`
- `monthlyEssentialExpenses > 0` -> expense
  - `category: ESSENTIAL_FIXED`
  - `label: Essential expenses`
  - `isEssential: true`
- `monthlyDiscretionaryExpenses > 0` -> expense
  - `category: DISCRETIONARY`
  - `label: Discretionary expenses`
  - `isEssential: false`

`0` and `undefined` values do not produce records.

## Endpoints

## `GET /api/baseline`

Returns all baseline records for the authenticated user.

Response `data` shape:

- `mode`: user `InputMode` (`QUICK` or `DETAILED`)
- `assets[]`
- `liabilities[]`
- `incomes[]`
- `expenses[]`

Ordering:

- Each array is ordered by `createdAt ASC`.

Response `meta`:

- `confidence`
  - `complete` when user mode is `DETAILED`
  - `estimated` when user mode is `QUICK`
- `defaultsUsed` (optional)
  - unique list of labels for records where `provenance = SYSTEM_DEFAULT`
  - omitted when none exist

Example:

```json
{
  "ok": true,
  "data": {
    "mode": "DETAILED",
    "assets": [],
    "liabilities": [],
    "incomes": [],
    "expenses": []
  },
  "meta": {
    "confidence": "complete"
  }
}
```

## `PUT /api/baseline`

Replaces the authenticated user's entire baseline atomically.

Behavior:

1. Parse JSON body.
2. Detect quick vs detailed payload using `isQuickPayload`.
3. Validate with:
   - quick: `quickBaselineInputSchema` then normalize
   - detailed: `baselineInputSchema`
4. Run a single transaction:
   - delete all existing user assets/liabilities/incomes/expenses
   - create new records from validated payload (only non-empty arrays)
5. Read back user baseline and return the same response structure as GET.

Important contract:

- PUT is **replace-all**, not merge.
- Sending empty arrays clears that record type.

Detailed example:

```json
{
  "assets": [{ "category": "SAVINGS", "label": "Emergency Fund", "value": 10000 }],
  "liabilities": [{ "category": "CREDIT_CARD", "label": "Visa", "balance": 2000 }],
  "incomes": [{ "category": "TAKE_HOME", "label": "Salary", "monthlyAmount": 5000 }],
  "expenses": [{ "category": "ESSENTIAL_FIXED", "label": "Rent", "monthlyAmount": 1500 }]
}
```

Quick example:

```json
{
  "totalSavings": 20000,
  "totalInvestments": 50000,
  "totalDebt": 10000,
  "monthlyTakeHome": 6000,
  "monthlyEssentialExpenses": 2000,
  "monthlyDiscretionaryExpenses": 500
}
```

## `PATCH /api/baseline/assets/{id}`
## `PATCH /api/baseline/liabilities/{id}`
## `PATCH /api/baseline/income/{id}`
## `PATCH /api/baseline/expenses/{id}`

Partially updates one existing record for the authenticated user.

Behavior for each route:

1. Parse JSON body.
2. Validate against corresponding patch schema.
3. Fetch record by `id`.
4. If record is missing or belongs to another user, return `404 NOT_FOUND`.
5. Update record with provided fields.
6. Return serialized updated record.

Example request (`PATCH /api/baseline/assets/{id}`):

```json
{
  "label": "Updated",
  "isLiquid": true
}
```

## Auth and Isolation

All baseline routes require authentication via `requireAuth()`.

Enforced behavior:

- unauthenticated requests return `401 UNAUTHORIZED`
- users can only read/write their own records
- PATCH ownership mismatches return `404`, not `403`

## Test Coverage Summary

`tests/integration/baseline-api.test.ts` contains 29 tests covering:

- GET:
  - empty baseline for new user
  - populated baseline retrieval
  - Decimal serialization to numbers
  - mode and confidence metadata
  - cross-user data isolation
- PUT detailed:
  - create all record types
  - replace previous records
  - validation failures (enum, required fields, negative values)
  - clear via empty arrays
  - user isolation
- PUT quick:
  - quick field normalization
  - `USER_ESTIMATED` provenance
  - omission of undefined/zero-valued fields
  - replacement semantics
- PATCH (all 4 resource types):
  - single and multi-field updates
  - validation failures
  - non-existent/foreign record 404 behavior

`tests/integration/api-routes-auth.test.ts` also includes auth-guard coverage for all four baseline PATCH routes.

## Verification Status

Current verification reported for this implementation:

- `npm run lint` passed
- `npx tsc --noEmit` passed
- `npm run build` passed
- Integration tests were not runnable locally due to missing PostgreSQL runtime in WSL (Docker unavailable), matching pre-existing test environment limitation.
