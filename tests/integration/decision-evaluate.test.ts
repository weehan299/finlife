import { describe, it, expect, beforeEach } from "vitest";
import { cleanDatabase } from "../helpers/cleanup";
import { prisma } from "../helpers/prisma";
import {
  createUser,
  createAsset,
  createLiability,
  createIncome,
  createExpense,
} from "../helpers/factories";
import {
  computeAmortizationPayment,
  computeTemplateImpact,
  applyDecisionToSnapshot,
  runGuardrails,
  deriveVerdict,
  evaluateDecision,
} from "@/services/decision.service";
import { buildSnapshot, resolveGuardrails } from "@/services/snapshot.service";
import type { ResolvedGuardrails } from "@/types/decision.types";

const defaultSettings: ResolvedGuardrails = {
  minEmergencyMonths: 6,
  minPostDecisionCash: 0,
  minMonthlySurplus: 0,
  maxDebtToIncome: 0.36,
  maxHousingRatio: 0.28,
  stressExpenseReductionRate: 0.2,
  housingTaxRateDefault: 0.012,
  housingInsuranceMonthlyDefault: 150,
  housingMaintenanceRateDefault: 0.01,
};

describe("amortization", () => {
  it("computes standard monthly payment", () => {
    // $200,000 at 6% for 30 years = ~$1,199.10
    const payment = computeAmortizationPayment(200000, 0.06, 360);
    expect(payment).toBeCloseTo(1199.1, 0);
  });

  it("returns simple division for zero interest rate", () => {
    const payment = computeAmortizationPayment(12000, 0, 12);
    expect(payment).toBeCloseTo(1000, 2);
  });

  it("returns 0 for zero principal", () => {
    expect(computeAmortizationPayment(0, 0.05, 60)).toBe(0);
  });
});

describe("computeTemplateImpact", () => {
  it("HOME_PURCHASE computes upfront, monthly, and housing cost", () => {
    const impact = computeTemplateImpact("HOME_PURCHASE", {
      purchasePrice: 400000,
      downPaymentAmount: 80000,
      mortgageTermMonths: 360,
      annualInterestRate: 0.065,
      currentRentMonthly: 1500,
    }, defaultSettings);

    expect(impact.upfrontAmount).toBe(80000);
    expect(impact.newLiabilityBalance).toBe(320000);
    expect(impact.isHousing).toBe(true);
    expect(impact.monthlyHousingCost).toBeGreaterThan(1500);
    // Monthly impact = total housing - rent savings
    expect(impact.monthlyImpact).toBe(impact.monthlyHousingCost - 1500);
  });

  it("NEW_LOAN computes monthly payment from amortization", () => {
    const impact = computeTemplateImpact("NEW_LOAN", {
      loanAmount: 30000,
      annualInterestRate: 0.075,
      termMonths: 60,
    }, defaultSettings);

    expect(impact.upfrontAmount).toBe(0);
    expect(impact.newLiabilityBalance).toBe(30000);
    expect(impact.monthlyImpact).toBeGreaterThan(500);
  });

  it("ONE_TIME_EXPENSE has upfront only", () => {
    const impact = computeTemplateImpact("ONE_TIME_EXPENSE", {
      amount: 5000,
    }, defaultSettings);

    expect(impact.upfrontAmount).toBe(5000);
    expect(impact.monthlyImpact).toBe(0);
    expect(impact.newLiabilityBalance).toBe(0);
  });

  it("INCOME_LOSS reduces monthly income", () => {
    const impact = computeTemplateImpact("INCOME_LOSS", {
      incomeReductionMonthly: 2000,
    }, defaultSettings);

    expect(impact.monthlyIncomeChange).toBe(-2000);
    expect(impact.upfrontAmount).toBe(0);
  });

  it("RECURRING_EXPENSE adds monthly cost", () => {
    const impact = computeTemplateImpact("RECURRING_EXPENSE", {
      monthlyAmount: 300,
    }, defaultSettings);

    expect(impact.monthlyImpact).toBe(300);
  });
});

describe("applyDecisionToSnapshot", () => {
  it("adjusts snapshot correctly for a purchase", () => {
    const baseline = {
      totalAssets: 100000,
      totalLiabilities: 10000,
      netWorth: 90000,
      monthlyIncome: 8000,
      monthlyExpenses: 4000,
      monthlySurplus: 4000,
      emergencyRunwayMonths: 12.5,
      liquidAssets: 50000,
      debtToIncomeRatio: 0.104,
    };

    const post = applyDecisionToSnapshot(baseline, {
      upfrontAmount: 20000,
      monthlyImpact: 500,
      newLiabilityBalance: 30000,
      monthlyIncomeChange: 0,
      isHousing: false,
      monthlyHousingCost: 0,
    });

    expect(post.liquidAssets).toBe(30000);
    expect(post.totalLiabilities).toBe(40000);
    expect(post.monthlyExpenses).toBe(4500);
    expect(post.monthlySurplus).toBe(3500);
  });
});

describe("runGuardrails", () => {
  it("returns PASS for healthy post-decision snapshot", () => {
    const post = {
      totalAssets: 100000,
      totalLiabilities: 20000,
      netWorth: 80000,
      monthlyIncome: 8000,
      monthlyExpenses: 4000,
      monthlySurplus: 4000,
      emergencyRunwayMonths: 12.5,
      liquidAssets: 50000,
      debtToIncomeRatio: 0.2,
    };

    const results = runGuardrails(post, defaultSettings, "ONE_TIME_EXPENSE", {
      upfrontAmount: 1000,
      monthlyImpact: 0,
      newLiabilityBalance: 0,
      monthlyIncomeChange: 0,
      isHousing: false,
      monthlyHousingCost: 0,
    });

    expect(results.every((g) => g.status === "PASS")).toBe(true);
  });

  it("returns FAIL for insufficient runway", () => {
    const post = {
      totalAssets: 5000,
      totalLiabilities: 0,
      netWorth: 5000,
      monthlyIncome: 4000,
      monthlyExpenses: 3800,
      monthlySurplus: 200,
      emergencyRunwayMonths: 1.3,
      liquidAssets: 5000,
      debtToIncomeRatio: 0,
    };

    const results = runGuardrails(post, defaultSettings, "ONE_TIME_EXPENSE", {
      upfrontAmount: 3000,
      monthlyImpact: 0,
      newLiabilityBalance: 0,
      monthlyIncomeChange: 0,
      isHousing: false,
      monthlyHousingCost: 0,
    });

    const runway = results.find((g) => g.key === "emergencyRunway");
    expect(runway?.status).toBe("FAIL");
  });

  it("includes housingRatio for HOME_PURCHASE", () => {
    const post = {
      totalAssets: 100000,
      totalLiabilities: 300000,
      netWorth: -200000,
      monthlyIncome: 6000,
      monthlyExpenses: 5000,
      monthlySurplus: 1000,
      emergencyRunwayMonths: 10,
      liquidAssets: 50000,
      debtToIncomeRatio: 4.17,
    };

    const results = runGuardrails(post, defaultSettings, "HOME_PURCHASE", {
      upfrontAmount: 60000,
      monthlyImpact: 2000,
      newLiabilityBalance: 240000,
      monthlyIncomeChange: 0,
      isHousing: true,
      monthlyHousingCost: 2500,
    });

    const housing = results.find((g) => g.key === "housingRatio");
    expect(housing).toBeDefined();
    // 2500/6000 = 41.7% > 28% limit
    expect(housing?.status).toBe("FAIL");
  });
});

describe("evaluateDecision (integration)", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it("evaluates a ONE_TIME_EXPENSE for a user with baseline data", async () => {
    const user = await createUser();
    await createAsset(user.id, { value: 50000, isLiquid: true, category: "CASH_SAVINGS", label: "Savings" });
    await createIncome(user.id, { monthlyAmount: 6000, isGuaranteed: true, category: "SALARY", label: "Salary" });
    await createExpense(user.id, { monthlyAmount: 3000, category: "ESSENTIAL", label: "Rent" });

    const result = await evaluateDecision({
      template: "ONE_TIME_EXPENSE",
      inputs: { amount: 5000 },
      userId: user.id,
    });

    expect(result.verdict).toBeDefined();
    expect(["PASS", "CAUTION", "FAIL"]).toContain(result.verdict);
    expect(result.baselineSnapshot.liquidAssets).toBeCloseTo(50000, 0);
    expect(result.postDecisionSnapshot.liquidAssets).toBeCloseTo(45000, 0);
    expect(result.computedUpfrontAmount).toBe(5000);
    expect(result.computedMonthlyImpact).toBe(0);
    expect(result.confidenceLevel).toBeDefined();
    expect(result.goalImpacts).toEqual([]);
  });

  it("evaluates HOME_PURCHASE with full data", async () => {
    const user = await createUser();
    await createAsset(user.id, { value: 100000, isLiquid: true, category: "CASH_SAVINGS", label: "Savings" });
    await createAsset(user.id, { value: 200000, isLiquid: false, category: "INVESTMENTS", label: "Investments" });
    await createLiability(user.id, { balance: 10000, category: "LOAN", label: "Car loan" });
    await createIncome(user.id, { monthlyAmount: 8000, isGuaranteed: true, category: "SALARY", label: "Salary" });
    await createExpense(user.id, { monthlyAmount: 2000, category: "ESSENTIAL", label: "Current rent" });
    await createExpense(user.id, { monthlyAmount: 500, category: "FLEXIBLE", label: "Fun" });

    const result = await evaluateDecision({
      template: "HOME_PURCHASE",
      inputs: {
        purchasePrice: 350000,
        downPaymentAmount: 70000,
        mortgageTermMonths: 360,
        annualInterestRate: 0.065,
        currentRentMonthly: 2000,
      },
      userId: user.id,
    });

    expect(result.verdict).toBeDefined();
    expect(result.guardrails.length).toBeGreaterThanOrEqual(4); // emergency, cash, surplus, DTI, housing
    expect(result.postDecisionSnapshot.liquidAssets).toBeCloseTo(30000, 0);
    expect(result.stressSnapshot.monthlyIncome).toBeCloseTo(8000, 0); // guaranteed only
    const housingGuardrail = result.guardrails.find((g) => g.key === "housingRatio");
    expect(housingGuardrail).toBeDefined();
  });

  it("returns LOW confidence for user with no data", async () => {
    const user = await createUser();

    const result = await evaluateDecision({
      template: "ONE_TIME_EXPENSE",
      inputs: { amount: 100 },
      userId: user.id,
    });

    expect(result.confidenceLevel).toBe("LOW");
  });
});

describe("buildSnapshot + resolveGuardrails", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it("buildSnapshot returns correct totals", async () => {
    const user = await createUser();
    await createAsset(user.id, { value: 10000, isLiquid: true, category: "CASH_SAVINGS", label: "Cash" });
    await createAsset(user.id, { value: 20000, isLiquid: false, category: "INVESTMENTS", label: "Stocks" });
    await createIncome(user.id, { monthlyAmount: 5000, isGuaranteed: true, category: "SALARY", label: "Pay" });
    await createExpense(user.id, { monthlyAmount: 3000, category: "ESSENTIAL", label: "Rent" });

    const { snapshot } = await buildSnapshot(user.id);

    expect(snapshot.totalAssets).toBeCloseTo(30000, 0);
    expect(snapshot.liquidAssets).toBeCloseTo(10000, 0);
    expect(snapshot.monthlyIncome).toBeCloseTo(5000, 0);
    expect(snapshot.monthlyExpenses).toBeCloseTo(3000, 0);
    expect(snapshot.monthlySurplus).toBeCloseTo(2000, 0);
  });

  it("resolveGuardrails returns defaults when no settings exist", async () => {
    const user = await createUser();
    const guardrails = await resolveGuardrails(user.id);

    expect(guardrails.minEmergencyMonths).toBe(6);
    expect(guardrails.maxDebtToIncome).toBeCloseTo(0.36, 4);
    expect(guardrails.maxHousingRatio).toBeCloseTo(0.28, 4);
  });

  it("resolveGuardrails merges user settings", async () => {
    const user = await createUser();
    await prisma.userSettings.create({
      data: {
        userId: user.id,
        minEmergencyMonths: 3,
        maxDebtToIncome: 0.4,
      },
    });

    const guardrails = await resolveGuardrails(user.id);
    expect(guardrails.minEmergencyMonths).toBe(3);
    expect(guardrails.maxDebtToIncome).toBeCloseTo(0.4, 4);
  });
});
