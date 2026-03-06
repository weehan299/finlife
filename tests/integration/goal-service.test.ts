import { describe, it, expect } from "vitest";
import {
  computeAllocatedAmount,
  getGoalProgress,
  resolveGrowthRate,
  computeDecisionGoalImpact,
} from "@/services/goal.service";
import type { SerializedGoal, SerializedGoalAllocation } from "@/types/goal.types";

function makeAllocation(
  overrides: Partial<SerializedGoalAllocation> = {},
): SerializedGoalAllocation {
  return {
    id: "alloc-1",
    assetId: "asset-1",
    assetLabel: "Test Asset",
    assetValue: 10000,
    mode: "FULL_VALUE",
    allocationValue: null,
    effectiveValue: 10000,
    ...overrides,
  };
}

function makeGoal(overrides: Partial<SerializedGoal> = {}): SerializedGoal {
  return {
    id: "goal-1",
    type: "SAVINGS",
    name: "Test Goal",
    targetAmount: 50000,
    targetDate: null,
    startingAmount: 0,
    monthlyContribution: 500,
    provenance: "USER_ENTERED",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    allocations: [],
    ...overrides,
  };
}

// ─── computeAllocatedAmount ─────────────────────────────

describe("computeAllocatedAmount", () => {
  it("sums FULL_VALUE allocations", () => {
    const allocations = [
      makeAllocation({ effectiveValue: 10000 }),
      makeAllocation({ id: "alloc-2", effectiveValue: 5000 }),
    ];
    expect(computeAllocatedAmount(allocations)).toBe(15000);
  });

  it("handles FIXED_AMOUNT mode", () => {
    const allocations = [
      makeAllocation({ mode: "FIXED_AMOUNT", effectiveValue: 3000 }),
    ];
    expect(computeAllocatedAmount(allocations)).toBe(3000);
  });

  it("handles PERCENT_OF_VALUE mode", () => {
    const allocations = [
      makeAllocation({
        mode: "PERCENT_OF_VALUE",
        assetValue: 10000,
        allocationValue: 0.5,
        effectiveValue: 5000,
      }),
    ];
    expect(computeAllocatedAmount(allocations)).toBe(5000);
  });

  it("returns 0 for empty allocations", () => {
    expect(computeAllocatedAmount([])).toBe(0);
  });
});

// ─── getGoalProgress ────────────────────────────────────

describe("getGoalProgress", () => {
  it("uses startingAmount when no allocations", () => {
    const goal = makeGoal({ startingAmount: 5000 });
    const progress = getGoalProgress(goal, 0.015);
    expect(progress.currentAmount).toBe(5000);
    expect(progress.percentComplete).toBe(10);
    expect(progress.amountRemaining).toBe(45000);
  });

  it("uses allocated amount when allocations exist", () => {
    const goal = makeGoal({
      startingAmount: 1000,
      allocations: [makeAllocation({ effectiveValue: 20000 })],
    });
    const progress = getGoalProgress(goal, 0.015);
    expect(progress.currentAmount).toBe(20000);
    expect(progress.percentComplete).toBe(40);
    expect(progress.amountRemaining).toBe(30000);
  });

  it("returns null months when no contribution", () => {
    const goal = makeGoal({ monthlyContribution: 0, startingAmount: 1000 });
    const progress = getGoalProgress(goal, 0.015);
    expect(progress.estimatedMonthsToTarget).toBeNull();
  });

  it("returns 0 remaining when goal is already met", () => {
    const goal = makeGoal({
      startingAmount: 60000,
      targetAmount: 50000,
    });
    const progress = getGoalProgress(goal, 0.015);
    expect(progress.amountRemaining).toBe(0);
    expect(progress.percentComplete).toBe(100);
  });

  it("uses simple division when growth rate is 0", () => {
    const goal = makeGoal({
      startingAmount: 0,
      targetAmount: 12000,
      monthlyContribution: 1000,
    });
    const progress = getGoalProgress(goal, 0);
    expect(progress.estimatedMonthsToTarget).toBe(12);
  });

  it("computes months with growth rate", () => {
    const goal = makeGoal({
      startingAmount: 10000,
      targetAmount: 50000,
      monthlyContribution: 1000,
    });
    const progress = getGoalProgress(goal, 0.05);
    expect(progress.estimatedMonthsToTarget).not.toBeNull();
    expect(progress.estimatedMonthsToTarget!).toBeGreaterThan(0);
    // With 5% growth, should be faster than simple division (40 months)
    expect(progress.estimatedMonthsToTarget!).toBeLessThan(40);
  });
});

// ─── resolveGrowthRate ──────────────────────────────────

describe("resolveGrowthRate", () => {
  it("returns savings rate for SAVINGS type", () => {
    expect(resolveGrowthRate("SAVINGS")).toBe(0.015);
  });

  it("returns investment rate for RETIREMENT type", () => {
    expect(resolveGrowthRate("RETIREMENT")).toBe(0.05);
  });

  it("returns investment rate for FINANCIAL_INDEPENDENCE type", () => {
    expect(resolveGrowthRate("FINANCIAL_INDEPENDENCE")).toBe(0.05);
  });

  it("returns savings rate for CUSTOM type", () => {
    expect(resolveGrowthRate("CUSTOM")).toBe(0.015);
  });

  it("uses user settings when provided", () => {
    const settings = { investmentGrowthRate: 0.07, savingsInterestRate: 0.02 };
    expect(resolveGrowthRate("RETIREMENT", settings)).toBe(0.07);
    expect(resolveGrowthRate("SAVINGS", settings)).toBe(0.02);
  });
});

// ─── computeDecisionGoalImpact ──────────────────────────

describe("computeDecisionGoalImpact", () => {
  it("computes delay with reduced contribution", () => {
    const goal = makeGoal({
      startingAmount: 10000,
      targetAmount: 50000,
      monthlyContribution: 1000,
    });
    const progress = getGoalProgress(goal, 0.05);
    const impact = computeDecisionGoalImpact(goal, progress, 200, 0.05);

    expect(impact.projectedDelayMonths).not.toBeNull();
    expect(impact.projectedDelayMonths!).toBeGreaterThan(0);
    expect(impact.deltaToTarget).not.toBeNull();
    expect(impact.deltaToTarget!).toBeLessThan(0);
  });

  it("returns nulls when contribution reduced to zero", () => {
    const goal = makeGoal({
      startingAmount: 10000,
      targetAmount: 50000,
      monthlyContribution: 500,
    });
    const progress = getGoalProgress(goal, 0.05);
    const impact = computeDecisionGoalImpact(goal, progress, 500, 0.05);

    expect(impact.projectedDelayMonths).toBeNull();
    expect(impact.deltaToTarget).toBeNull();
  });

  it("returns nulls when original contribution is zero", () => {
    const goal = makeGoal({
      startingAmount: 10000,
      targetAmount: 50000,
      monthlyContribution: 0,
    });
    const progress = getGoalProgress(goal, 0.05);
    const impact = computeDecisionGoalImpact(goal, progress, 200, 0.05);

    expect(impact.projectedDelayMonths).toBeNull();
    expect(impact.deltaToTarget).toBeNull();
  });
});
