-- Simplify financial category enums

-- ═══ 1. AssetCategory: merge CASH_CHECKING + SAVINGS → CASH_SAVINGS ═══
CREATE TYPE "AssetCategory_new" AS ENUM ('CASH_SAVINGS', 'INVESTMENTS', 'RETIREMENT', 'PROPERTY', 'OTHER');
ALTER TABLE "Asset" ALTER COLUMN "category" TYPE "AssetCategory_new"
  USING (CASE
    WHEN "category"::text IN ('CASH_CHECKING', 'SAVINGS') THEN 'CASH_SAVINGS'
    ELSE "category"::text
  END)::"AssetCategory_new";
DROP TYPE "AssetCategory";
ALTER TYPE "AssetCategory_new" RENAME TO "AssetCategory";

-- ═══ 2. LiabilityCategory: PERSONAL_LOAN → LOAN, OTHER → OTHER_DEBT ═══
CREATE TYPE "LiabilityCategory_new" AS ENUM ('CREDIT_CARD', 'STUDENT_LOAN', 'LOAN', 'MORTGAGE', 'OTHER_DEBT');
ALTER TABLE "Liability" ALTER COLUMN "category" TYPE "LiabilityCategory_new"
  USING (CASE
    WHEN "category"::text = 'PERSONAL_LOAN' THEN 'LOAN'
    WHEN "category"::text = 'OTHER' THEN 'OTHER_DEBT'
    ELSE "category"::text
  END)::"LiabilityCategory_new";
DROP TYPE "LiabilityCategory";
ALTER TYPE "LiabilityCategory_new" RENAME TO "LiabilityCategory";

-- ═══ 3. IncomeCategory: merge to SALARY, SIDE_INCOME, BENEFITS, OTHER_INCOME ═══
CREATE TYPE "IncomeCategory_new" AS ENUM ('SALARY', 'SIDE_INCOME', 'BENEFITS', 'OTHER_INCOME');
ALTER TABLE "Income" ALTER COLUMN "category" TYPE "IncomeCategory_new"
  USING (CASE
    WHEN "category"::text IN ('TAKE_HOME', 'GROSS') THEN 'SALARY'
    WHEN "category"::text = 'VARIABLE' THEN 'SIDE_INCOME'
    WHEN "category"::text IN ('OTHER_RECURRING', 'FALLBACK') THEN 'BENEFITS'
    ELSE 'OTHER_INCOME'
  END)::"IncomeCategory_new";
DROP TYPE "IncomeCategory";
ALTER TYPE "IncomeCategory_new" RENAME TO "IncomeCategory";

-- ═══ 4. Expense: add isVariable, backfill, swap enum, drop isEssential ═══

-- Add isVariable column first (while old enum still exists for backfill logic)
ALTER TABLE "Expense" ADD COLUMN "isVariable" BOOLEAN NOT NULL DEFAULT false;
-- Backfill: old ESSENTIAL_VARIABLE rows get isVariable = true
UPDATE "Expense" SET "isVariable" = true WHERE "category"::text = 'ESSENTIAL_VARIABLE';

-- Swap ExpenseCategory enum
CREATE TYPE "ExpenseCategory_new" AS ENUM ('ESSENTIAL', 'FLEXIBLE');
ALTER TABLE "Expense" ALTER COLUMN "category" TYPE "ExpenseCategory_new"
  USING (CASE
    WHEN "category"::text IN ('ESSENTIAL_FIXED', 'ESSENTIAL_VARIABLE') THEN 'ESSENTIAL'
    WHEN "category"::text = 'DISCRETIONARY' THEN 'FLEXIBLE'
    ELSE 'ESSENTIAL'
  END)::"ExpenseCategory_new";
DROP TYPE "ExpenseCategory";
ALTER TYPE "ExpenseCategory_new" RENAME TO "ExpenseCategory";

-- Drop isEssential column and its index
DROP INDEX IF EXISTS "Expense_userId_isEssential_idx";
ALTER TABLE "Expense" DROP COLUMN "isEssential";
