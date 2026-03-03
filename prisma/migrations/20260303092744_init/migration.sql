-- CreateEnum
CREATE TYPE "InputMode" AS ENUM ('QUICK', 'DETAILED');

-- CreateEnum
CREATE TYPE "InputProvenance" AS ENUM ('USER_ENTERED', 'USER_ESTIMATED', 'SYSTEM_DEFAULT');

-- CreateEnum
CREATE TYPE "AssetCategory" AS ENUM ('CASH_CHECKING', 'SAVINGS', 'INVESTMENTS', 'RETIREMENT', 'PROPERTY', 'OTHER');

-- CreateEnum
CREATE TYPE "LiabilityCategory" AS ENUM ('CREDIT_CARD', 'STUDENT_LOAN', 'PERSONAL_LOAN', 'MORTGAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "IncomeCategory" AS ENUM ('TAKE_HOME', 'GROSS', 'OTHER_RECURRING', 'VARIABLE', 'FALLBACK');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('ESSENTIAL_FIXED', 'ESSENTIAL_VARIABLE', 'DISCRETIONARY', 'DEBT_PAYMENT');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('SAVINGS', 'RETIREMENT', 'FINANCIAL_INDEPENDENCE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "GoalAssetAllocationMode" AS ENUM ('FULL_VALUE', 'FIXED_AMOUNT', 'PERCENT_OF_VALUE');

-- CreateEnum
CREATE TYPE "DecisionTemplate" AS ENUM ('HOME_PURCHASE', 'NEW_LOAN', 'LARGE_PURCHASE', 'INCOME_LOSS', 'RECURRING_EXPENSE', 'ONE_TIME_EXPENSE');

-- CreateEnum
CREATE TYPE "DecisionStatus" AS ENUM ('DRAFT', 'EVALUATED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DecisionVerdict" AS ENUM ('PASS', 'CAUTION', 'FAIL');

-- CreateEnum
CREATE TYPE "OutputConfidence" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "displayName" TEXT,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "mode" "InputMode" NOT NULL DEFAULT 'QUICK',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "inflationRate" DECIMAL(5,4) NOT NULL DEFAULT 0.03,
    "investmentGrowthRate" DECIMAL(5,4) NOT NULL DEFAULT 0.05,
    "savingsInterestRate" DECIMAL(5,4) NOT NULL DEFAULT 0.015,
    "debtInterestFallback" DECIMAL(5,4) NOT NULL DEFAULT 0.08,
    "safeWithdrawalRate" DECIMAL(5,4) NOT NULL DEFAULT 0.04,
    "minEmergencyMonths" INTEGER NOT NULL DEFAULT 6,
    "minPostDecisionCash" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "minMonthlySurplus" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "maxDebtToIncome" DECIMAL(5,4) NOT NULL DEFAULT 0.36,
    "maxHousingRatio" DECIMAL(5,4) NOT NULL DEFAULT 0.28,
    "housingTaxRateDefault" DECIMAL(7,4),
    "housingInsuranceMonthlyDefault" DECIMAL(14,2),
    "housingMaintenanceRateDefault" DECIMAL(7,4),
    "stressExpenseReductionDefault" DECIMAL(5,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "AssetCategory" NOT NULL,
    "label" TEXT NOT NULL,
    "value" DECIMAL(14,2) NOT NULL,
    "isLiquid" BOOLEAN NOT NULL DEFAULT false,
    "monthlyContribution" DECIMAL(14,2),
    "annualGrowthRateOverride" DECIMAL(5,4),
    "provenance" "InputProvenance" NOT NULL DEFAULT 'USER_ENTERED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Liability" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "LiabilityCategory" NOT NULL,
    "label" TEXT NOT NULL,
    "balance" DECIMAL(14,2) NOT NULL,
    "annualInterestRate" DECIMAL(5,4),
    "minimumPayment" DECIMAL(14,2),
    "remainingTermMonths" INTEGER,
    "provenance" "InputProvenance" NOT NULL DEFAULT 'USER_ENTERED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Liability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Income" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "IncomeCategory" NOT NULL,
    "label" TEXT NOT NULL,
    "monthlyAmount" DECIMAL(14,2) NOT NULL,
    "isGuaranteed" BOOLEAN NOT NULL DEFAULT true,
    "provenance" "InputProvenance" NOT NULL DEFAULT 'USER_ENTERED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Income_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "label" TEXT NOT NULL,
    "monthlyAmount" DECIMAL(14,2) NOT NULL,
    "stressMonthlyAmount" DECIMAL(14,2),
    "isEssential" BOOLEAN NOT NULL DEFAULT true,
    "provenance" "InputProvenance" NOT NULL DEFAULT 'USER_ENTERED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "GoalType" NOT NULL,
    "name" TEXT NOT NULL,
    "targetAmount" DECIMAL(14,2) NOT NULL,
    "targetDate" TIMESTAMP(3),
    "startingAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "monthlyContribution" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "provenance" "InputProvenance" NOT NULL DEFAULT 'USER_ENTERED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalAssetAllocation" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "mode" "GoalAssetAllocationMode" NOT NULL,
    "allocationValue" DECIMAL(10,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoalAssetAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Decision" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "template" "DecisionTemplate" NOT NULL,
    "status" "DecisionStatus" NOT NULL DEFAULT 'DRAFT',
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "durationMonths" INTEGER,
    "upfrontAmount" DECIMAL(14,2),
    "monthlyImpact" DECIMAL(14,2),
    "inputs" JSONB NOT NULL,
    "assumptionsSnapshot" JSONB,
    "baselineSnapshot" JSONB,
    "resultSnapshot" JSONB,
    "verdict" "DecisionVerdict",
    "confidenceLevel" "OutputConfidence",
    "evaluatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionGoalImpact" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "projectedDelayMonths" INTEGER,
    "projectedTargetDate" TIMESTAMP(3),
    "deltaToTarget" DECIMAL(14,2),
    "impactSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DecisionGoalImpact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkUserId_key" ON "User"("clerkUserId");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE INDEX "Asset_userId_category_idx" ON "Asset"("userId", "category");

-- CreateIndex
CREATE INDEX "Asset_userId_isLiquid_idx" ON "Asset"("userId", "isLiquid");

-- CreateIndex
CREATE INDEX "Liability_userId_category_idx" ON "Liability"("userId", "category");

-- CreateIndex
CREATE INDEX "Income_userId_category_idx" ON "Income"("userId", "category");

-- CreateIndex
CREATE INDEX "Income_userId_isGuaranteed_idx" ON "Income"("userId", "isGuaranteed");

-- CreateIndex
CREATE INDEX "Expense_userId_category_idx" ON "Expense"("userId", "category");

-- CreateIndex
CREATE INDEX "Expense_userId_isEssential_idx" ON "Expense"("userId", "isEssential");

-- CreateIndex
CREATE INDEX "Goal_userId_type_idx" ON "Goal"("userId", "type");

-- CreateIndex
CREATE INDEX "Goal_userId_targetDate_idx" ON "Goal"("userId", "targetDate");

-- CreateIndex
CREATE INDEX "GoalAssetAllocation_assetId_idx" ON "GoalAssetAllocation"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "GoalAssetAllocation_goalId_assetId_key" ON "GoalAssetAllocation"("goalId", "assetId");

-- CreateIndex
CREATE INDEX "Decision_userId_template_updatedAt_idx" ON "Decision"("userId", "template", "updatedAt");

-- CreateIndex
CREATE INDEX "Decision_userId_status_updatedAt_idx" ON "Decision"("userId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "DecisionGoalImpact_goalId_idx" ON "DecisionGoalImpact"("goalId");

-- CreateIndex
CREATE UNIQUE INDEX "DecisionGoalImpact_decisionId_goalId_key" ON "DecisionGoalImpact"("decisionId", "goalId");

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Liability" ADD CONSTRAINT "Liability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalAssetAllocation" ADD CONSTRAINT "GoalAssetAllocation_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalAssetAllocation" ADD CONSTRAINT "GoalAssetAllocation_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionGoalImpact" ADD CONSTRAINT "DecisionGoalImpact_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionGoalImpact" ADD CONSTRAINT "DecisionGoalImpact_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
