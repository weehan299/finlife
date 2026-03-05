import { describe, it, expect } from "vitest";
import { computeSnapshot, summarizeSnapshot } from "@/lib/snapshot";
import type { BaselineResponse } from "@/types/baseline.types";

function makeBaseline(
  overrides: Partial<BaselineResponse> = {},
): BaselineResponse {
  return {
    mode: "QUICK",
    assets: [],
    liabilities: [],
    incomes: [],
    expenses: [],
    ...overrides,
  };
}

describe("computeSnapshot", () => {
  it("returns all zeros for an empty baseline", () => {
    const s = computeSnapshot(makeBaseline());
    expect(s.totalAssets).toBe(0);
    expect(s.totalLiabilities).toBe(0);
    expect(s.netWorth).toBe(0);
    expect(s.monthlyIncome).toBe(0);
    expect(s.monthlyExpenses).toBe(0);
    expect(s.monthlySurplus).toBe(0);
    expect(s.emergencyRunwayMonths).toBe(0);
    expect(s.liquidAssets).toBe(0);
    expect(s.debtToIncomeRatio).toBe(0);
  });

  it("computes positive surplus correctly", () => {
    const s = computeSnapshot(
      makeBaseline({
        assets: [
          {
            id: "a1",
            category: "SAVINGS",
            label: "Savings",
            value: 10000,
            isLiquid: true,
            monthlyContribution: null,
            annualGrowthRateOverride: null,
            provenance: "USER_ESTIMATED",
            createdAt: "",
            updatedAt: "",
          },
          {
            id: "a2",
            category: "INVESTMENTS",
            label: "Investments",
            value: 50000,
            isLiquid: false,
            monthlyContribution: null,
            annualGrowthRateOverride: null,
            provenance: "USER_ESTIMATED",
            createdAt: "",
            updatedAt: "",
          },
        ],
        liabilities: [
          {
            id: "l1",
            category: "OTHER",
            label: "Debt",
            balance: 5000,
            annualInterestRate: null,
            minimumPayment: null,
            remainingTermMonths: null,
            provenance: "USER_ESTIMATED",
            createdAt: "",
            updatedAt: "",
          },
        ],
        incomes: [
          {
            id: "i1",
            category: "TAKE_HOME",
            label: "Pay",
            monthlyAmount: 5000,
            isGuaranteed: true,
            provenance: "USER_ESTIMATED",
            createdAt: "",
            updatedAt: "",
          },
        ],
        expenses: [
          {
            id: "e1",
            category: "ESSENTIAL_FIXED",
            label: "Rent",
            monthlyAmount: 2000,
            stressMonthlyAmount: null,
            isEssential: true,
            provenance: "USER_ESTIMATED",
            createdAt: "",
            updatedAt: "",
          },
        ],
      }),
    );

    expect(s.totalAssets).toBe(60000);
    expect(s.liquidAssets).toBe(10000);
    expect(s.totalLiabilities).toBe(5000);
    expect(s.netWorth).toBe(55000);
    expect(s.monthlyIncome).toBe(5000);
    expect(s.monthlyExpenses).toBe(2000);
    expect(s.monthlySurplus).toBe(3000);
    expect(s.emergencyRunwayMonths).toBe(5); // 10000 / 2000
    expect(s.debtToIncomeRatio).toBeCloseTo(5000 / 60000); // 5000 / (5000*12)
  });

  it("computes deficit when expenses exceed income", () => {
    const s = computeSnapshot(
      makeBaseline({
        incomes: [
          {
            id: "i1",
            category: "TAKE_HOME",
            label: "Pay",
            monthlyAmount: 3000,
            isGuaranteed: true,
            provenance: "USER_ESTIMATED",
            createdAt: "",
            updatedAt: "",
          },
        ],
        expenses: [
          {
            id: "e1",
            category: "ESSENTIAL_FIXED",
            label: "Expenses",
            monthlyAmount: 4500,
            stressMonthlyAmount: null,
            isEssential: true,
            provenance: "USER_ESTIMATED",
            createdAt: "",
            updatedAt: "",
          },
        ],
      }),
    );

    expect(s.monthlySurplus).toBe(-1500);
    expect(s.netWorth).toBe(0);
  });

  it("handles zero income gracefully", () => {
    const s = computeSnapshot(
      makeBaseline({
        liabilities: [
          {
            id: "l1",
            category: "OTHER",
            label: "Debt",
            balance: 10000,
            annualInterestRate: null,
            minimumPayment: null,
            remainingTermMonths: null,
            provenance: "USER_ESTIMATED",
            createdAt: "",
            updatedAt: "",
          },
        ],
      }),
    );

    expect(s.debtToIncomeRatio).toBe(0);
    expect(s.monthlySurplus).toBe(0);
  });

  it("handles zero expenses gracefully", () => {
    const s = computeSnapshot(
      makeBaseline({
        assets: [
          {
            id: "a1",
            category: "SAVINGS",
            label: "Cash",
            value: 5000,
            isLiquid: true,
            monthlyContribution: null,
            annualGrowthRateOverride: null,
            provenance: "USER_ESTIMATED",
            createdAt: "",
            updatedAt: "",
          },
        ],
      }),
    );

    expect(s.emergencyRunwayMonths).toBe(0);
  });
});

describe("summarizeSnapshot", () => {
  it("reports surplus and good runway", () => {
    const text = summarizeSnapshot({
      totalAssets: 60000,
      totalLiabilities: 0,
      netWorth: 60000,
      monthlyIncome: 5000,
      monthlyExpenses: 2000,
      monthlySurplus: 3000,
      emergencyRunwayMonths: 10,
      liquidAssets: 20000,
      debtToIncomeRatio: 0,
    });

    expect(text).toContain("surplus");
    expect(text).toContain("3,000");
    expect(text).toContain("meeting the");
  });

  it("reports deficit and low runway", () => {
    const text = summarizeSnapshot({
      totalAssets: 5000,
      totalLiabilities: 20000,
      netWorth: -15000,
      monthlyIncome: 3000,
      monthlyExpenses: 4000,
      monthlySurplus: -1000,
      emergencyRunwayMonths: 1.3,
      liquidAssets: 5000,
      debtToIncomeRatio: 0.56,
    });

    expect(text).toContain("deficit");
    expect(text).toContain("1,000");
    expect(text).toContain("below the recommended");
  });

  it("handles zero surplus", () => {
    const text = summarizeSnapshot({
      totalAssets: 0,
      totalLiabilities: 0,
      netWorth: 0,
      monthlyIncome: 3000,
      monthlyExpenses: 3000,
      monthlySurplus: 0,
      emergencyRunwayMonths: 0,
      liquidAssets: 0,
      debtToIncomeRatio: 0,
    });

    expect(text).toContain("surplus");
    expect(text).toContain("$0");
  });
});
