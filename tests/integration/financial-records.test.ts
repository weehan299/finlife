import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "../helpers/prisma";
import { cleanDatabase } from "../helpers/cleanup";
import {
  createUser,
  createAsset,
  createLiability,
  createIncome,
  createExpense,
} from "../helpers/factories";

beforeEach(cleanDatabase);

describe("Asset", () => {
  it("creates one asset per AssetCategory", async () => {
    const user = await createUser();
    const categories = [
      "CASH_CHECKING",
      "SAVINGS",
      "INVESTMENTS",
      "RETIREMENT",
      "PROPERTY",
      "OTHER",
    ] as const;

    for (const category of categories) {
      const asset = await createAsset(user.id, {
        category,
        label: `${category} asset`,
      });
      expect(asset.category).toBe(category);
    }

    const count = await prisma.asset.count({ where: { userId: user.id } });
    expect(count).toBe(6);
  });

  it("stores Decimal(14,2) boundary values", async () => {
    const user = await createUser();

    const asset = await createAsset(user.id, {
      value: "999999999999.99",
    });
    expect(Number(asset.value)).toBeCloseTo(999999999999.99, 2);

    const zero = await createAsset(user.id, {
      label: "Zero Asset",
      value: "0.00",
    });
    expect(Number(zero.value)).toBe(0);
  });

  it("has null optional fields when omitted", async () => {
    const user = await createUser();
    const asset = await createAsset(user.id);

    expect(asset.monthlyContribution).toBeNull();
    expect(asset.annualGrowthRateOverride).toBeNull();
  });

  it("defaults isLiquid to false and provenance to USER_ENTERED", async () => {
    const user = await createUser();
    const asset = await createAsset(user.id, {
      isLiquid: undefined,
      provenance: undefined,
    });

    expect(asset.isLiquid).toBe(false);
    expect(asset.provenance).toBe("USER_ENTERED");
  });

  it("persists all 3 InputProvenance values", async () => {
    const user = await createUser();
    const provenances = [
      "USER_ENTERED",
      "USER_ESTIMATED",
      "SYSTEM_DEFAULT",
    ] as const;

    for (const prov of provenances) {
      const asset = await createAsset(user.id, {
        label: `${prov} asset`,
        provenance: prov,
      });
      expect(asset.provenance).toBe(prov);
    }
  });

  it("updates and advances updatedAt", async () => {
    const user = await createUser();
    const asset = await createAsset(user.id);
    await new Promise((r) => setTimeout(r, 50));

    const updated = await prisma.asset.update({
      where: { id: asset.id },
      data: { value: "2000.00" },
    });

    expect(updated.updatedAt.getTime()).toBeGreaterThan(
      asset.updatedAt.getTime()
    );
  });

  it("queries by composite index (userId, category)", async () => {
    const user = await createUser();
    await createAsset(user.id, { category: "CASH_CHECKING" });
    await createAsset(user.id, {
      category: "SAVINGS",
      label: "Savings",
    });

    const results = await prisma.asset.findMany({
      where: { userId: user.id, category: "CASH_CHECKING" },
    });
    expect(results).toHaveLength(1);
  });

  it("queries by composite index (userId, isLiquid)", async () => {
    const user = await createUser();
    await createAsset(user.id, { isLiquid: true, label: "Liquid" });
    await createAsset(user.id, { isLiquid: false, label: "Illiquid" });

    const liquid = await prisma.asset.findMany({
      where: { userId: user.id, isLiquid: true },
    });
    expect(liquid).toHaveLength(1);
    expect(liquid[0].label).toBe("Liquid");
  });
});

describe("Liability", () => {
  it("creates one liability per LiabilityCategory", async () => {
    const user = await createUser();
    const categories = [
      "CREDIT_CARD",
      "STUDENT_LOAN",
      "PERSONAL_LOAN",
      "MORTGAGE",
      "OTHER",
    ] as const;

    for (const category of categories) {
      const liability = await createLiability(user.id, {
        category,
        label: `${category} liability`,
      });
      expect(liability.category).toBe(category);
    }

    const count = await prisma.liability.count({ where: { userId: user.id } });
    expect(count).toBe(5);
  });

  it("has null optional fields when omitted", async () => {
    const user = await createUser();
    const liability = await createLiability(user.id);

    expect(liability.annualInterestRate).toBeNull();
    expect(liability.minimumPayment).toBeNull();
    expect(liability.remainingTermMonths).toBeNull();
  });

  it("queries by composite index (userId, category)", async () => {
    const user = await createUser();
    await createLiability(user.id, { category: "MORTGAGE", label: "Mortgage" });
    await createLiability(user.id, {
      category: "CREDIT_CARD",
      label: "Card",
    });

    const results = await prisma.liability.findMany({
      where: { userId: user.id, category: "MORTGAGE" },
    });
    expect(results).toHaveLength(1);
    expect(results[0].label).toBe("Mortgage");
  });
});

describe("Income", () => {
  it("creates one income per IncomeCategory", async () => {
    const user = await createUser();
    const categories = [
      "TAKE_HOME",
      "GROSS",
      "OTHER_RECURRING",
      "VARIABLE",
      "FALLBACK",
    ] as const;

    for (const category of categories) {
      const income = await createIncome(user.id, {
        category,
        label: `${category} income`,
      });
      expect(income.category).toBe(category);
    }

    const count = await prisma.income.count({ where: { userId: user.id } });
    expect(count).toBe(5);
  });

  it("defaults isGuaranteed to true", async () => {
    const user = await createUser();
    const income = await createIncome(user.id);
    expect(income.isGuaranteed).toBe(true);
  });

  it("queries by composite index (userId, isGuaranteed)", async () => {
    const user = await createUser();
    await createIncome(user.id, { isGuaranteed: true, label: "Guaranteed" });
    await createIncome(user.id, {
      isGuaranteed: false,
      label: "Not Guaranteed",
    });

    const guaranteed = await prisma.income.findMany({
      where: { userId: user.id, isGuaranteed: true },
    });
    expect(guaranteed).toHaveLength(1);
    expect(guaranteed[0].label).toBe("Guaranteed");
  });
});

describe("Expense", () => {
  it("creates one expense per ExpenseCategory", async () => {
    const user = await createUser();
    const categories = [
      "ESSENTIAL_FIXED",
      "ESSENTIAL_VARIABLE",
      "DISCRETIONARY",
    ] as const;

    for (const category of categories) {
      const expense = await createExpense(user.id, {
        category,
        label: `${category} expense`,
      });
      expect(expense.category).toBe(category);
    }

    const count = await prisma.expense.count({ where: { userId: user.id } });
    expect(count).toBe(3);
  });

  it("defaults isEssential to true and stressMonthlyAmount to null", async () => {
    const user = await createUser();
    const expense = await createExpense(user.id);

    expect(expense.isEssential).toBe(true);
    expect(expense.stressMonthlyAmount).toBeNull();
  });

  it("stores stressMonthlyAmount when provided", async () => {
    const user = await createUser();
    const expense = await createExpense(user.id, {
      stressMonthlyAmount: "1200.00",
    });

    expect(Number(expense.stressMonthlyAmount)).toBeCloseTo(1200, 2);
  });

  it("queries by composite index (userId, isEssential)", async () => {
    const user = await createUser();
    await createExpense(user.id, { isEssential: true, label: "Essential" });
    await createExpense(user.id, {
      isEssential: false,
      label: "Non-essential",
    });

    const essential = await prisma.expense.findMany({
      where: { userId: user.id, isEssential: true },
    });
    expect(essential).toHaveLength(1);
    expect(essential[0].label).toBe("Essential");
  });
});
