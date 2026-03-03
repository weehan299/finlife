import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";

let counter = 0;

function uniqueClerkId(): string {
  return `clerk_test_${Date.now()}_${++counter}`;
}

// ─── User ───────────────────────────────────────────────

type UserOverrides = Partial<Prisma.UserCreateInput>;

export async function createUser(overrides: UserOverrides = {}) {
  return prisma.user.create({
    data: {
      clerkUserId: uniqueClerkId(),
      ...overrides,
    },
  });
}

// ─── UserSettings ───────────────────────────────────────

type SettingsOverrides = Partial<
  Omit<Prisma.UserSettingsCreateWithoutUserInput, "user">
>;

export async function createUserWithSettings(
  userOverrides: UserOverrides = {},
  settingsOverrides: SettingsOverrides = {}
) {
  return prisma.user.create({
    data: {
      clerkUserId: uniqueClerkId(),
      ...userOverrides,
      settings: {
        create: settingsOverrides,
      },
    },
    include: { settings: true },
  });
}

// ─── Asset ──────────────────────────────────────────────

type AssetOverrides = Partial<Omit<Prisma.AssetCreateWithoutUserInput, "user">>;

export async function createAsset(userId: string, overrides: AssetOverrides = {}) {
  return prisma.asset.create({
    data: {
      category: "CASH_CHECKING",
      label: "Test Asset",
      value: "1000.00",
      userId,
      ...overrides,
    },
  });
}

// ─── Liability ──────────────────────────────────────────

type LiabilityOverrides = Partial<
  Omit<Prisma.LiabilityCreateWithoutUserInput, "user">
>;

export async function createLiability(
  userId: string,
  overrides: LiabilityOverrides = {}
) {
  return prisma.liability.create({
    data: {
      category: "CREDIT_CARD",
      label: "Test Liability",
      balance: "500.00",
      userId,
      ...overrides,
    },
  });
}

// ─── Income ─────────────────────────────────────────────

type IncomeOverrides = Partial<Omit<Prisma.IncomeCreateWithoutUserInput, "user">>;

export async function createIncome(
  userId: string,
  overrides: IncomeOverrides = {}
) {
  return prisma.income.create({
    data: {
      category: "TAKE_HOME",
      label: "Test Income",
      monthlyAmount: "5000.00",
      userId,
      ...overrides,
    },
  });
}

// ─── Expense ────────────────────────────────────────────

type ExpenseOverrides = Partial<
  Omit<Prisma.ExpenseCreateWithoutUserInput, "user">
>;

export async function createExpense(
  userId: string,
  overrides: ExpenseOverrides = {}
) {
  return prisma.expense.create({
    data: {
      category: "ESSENTIAL_FIXED",
      label: "Test Expense",
      monthlyAmount: "1500.00",
      userId,
      ...overrides,
    },
  });
}

// ─── Goal ───────────────────────────────────────────────

type GoalOverrides = Partial<Omit<Prisma.GoalCreateWithoutUserInput, "user">>;

export async function createGoal(userId: string, overrides: GoalOverrides = {}) {
  return prisma.goal.create({
    data: {
      type: "SAVINGS",
      name: "Test Goal",
      targetAmount: "50000.00",
      userId,
      ...overrides,
    },
  });
}

// ─── GoalAssetAllocation ────────────────────────────────

type AllocationOverrides = Partial<
  Omit<Prisma.GoalAssetAllocationUncheckedCreateInput, "goalId" | "assetId">
>;

export async function createGoalAssetAllocation(
  goalId: string,
  assetId: string,
  overrides: AllocationOverrides = {}
) {
  return prisma.goalAssetAllocation.create({
    data: {
      goalId,
      assetId,
      mode: "FULL_VALUE",
      ...overrides,
    },
  });
}

// ─── Decision ───────────────────────────────────────────

type DecisionOverrides = Partial<
  Omit<Prisma.DecisionCreateWithoutUserInput, "user">
>;

export async function createDecision(
  userId: string,
  overrides: DecisionOverrides = {}
) {
  return prisma.decision.create({
    data: {
      template: "HOME_PURCHASE",
      name: "Test Decision",
      inputs: { description: "test inputs" },
      userId,
      ...overrides,
    },
  });
}

// ─── DecisionGoalImpact ─────────────────────────────────

type ImpactOverrides = Partial<
  Omit<Prisma.DecisionGoalImpactUncheckedCreateInput, "decisionId" | "goalId">
>;

export async function createDecisionGoalImpact(
  decisionId: string,
  goalId: string,
  overrides: ImpactOverrides = {}
) {
  return prisma.decisionGoalImpact.create({
    data: {
      decisionId,
      goalId,
      ...overrides,
    },
  });
}
