-- AlterEnum
BEGIN;
CREATE TYPE "ExpenseCategory_new" AS ENUM ('ESSENTIAL_FIXED', 'ESSENTIAL_VARIABLE', 'DISCRETIONARY');
ALTER TABLE "Expense" ALTER COLUMN "category" TYPE "ExpenseCategory_new" USING ("category"::text::"ExpenseCategory_new");
DROP TYPE "ExpenseCategory";
ALTER TYPE "ExpenseCategory_new" RENAME TO "ExpenseCategory";
COMMIT;
