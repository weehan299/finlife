import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "../helpers/prisma";
import { cleanDatabase } from "../helpers/cleanup";
import { createUser, createUserWithSettings } from "../helpers/factories";

beforeEach(cleanDatabase);

describe("User", () => {
  it("creates user with minimal fields and verifies defaults", async () => {
    const user = await createUser();

    expect(user.id).toMatch(/^c/); // cuid
    expect(user.clerkUserId).toBeTruthy();
    expect(user.displayName).toBeNull();
    expect(user.onboardingComplete).toBe(false);
    expect(user.mode).toBe("QUICK");
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
  });

  it("creates user with all fields", async () => {
    const user = await createUser({
      displayName: "Test User",
      onboardingComplete: true,
      mode: "DETAILED",
    });

    expect(user.displayName).toBe("Test User");
    expect(user.onboardingComplete).toBe(true);
    expect(user.mode).toBe("DETAILED");
  });

  it("reads by id and by clerkUserId returning the same result", async () => {
    const created = await createUser();

    const byId = await prisma.user.findUnique({ where: { id: created.id } });
    const byClerk = await prisma.user.findUnique({
      where: { clerkUserId: created.clerkUserId },
    });

    expect(byId).toEqual(byClerk);
  });

  it("updates user fields and advances updatedAt", async () => {
    const user = await createUser();
    const originalUpdatedAt = user.updatedAt;

    await new Promise((r) => setTimeout(r, 50));

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { displayName: "Updated Name", mode: "DETAILED" },
    });

    expect(updated.displayName).toBe("Updated Name");
    expect(updated.mode).toBe("DETAILED");
    expect(updated.updatedAt.getTime()).toBeGreaterThan(
      originalUpdatedAt.getTime()
    );
  });

  it("deletes user and returns null on findUnique", async () => {
    const user = await createUser();
    await prisma.user.delete({ where: { id: user.id } });

    const found = await prisma.user.findUnique({ where: { id: user.id } });
    expect(found).toBeNull();
  });

  it("rejects duplicate clerkUserId with P2002", async () => {
    const user = await createUser();

    await expect(
      prisma.user.create({
        data: { clerkUserId: user.clerkUserId },
      })
    ).rejects.toThrow(/Unique constraint/i);
  });
});

describe("UserSettings", () => {
  it("creates settings via nested create and verifies 1:1 relation", async () => {
    const user = await createUserWithSettings();

    expect(user.settings).not.toBeNull();
    expect(user.settings!.userId).toBe(user.id);
  });

  it("has correct default values for all Decimal fields and nulls", async () => {
    const user = await createUserWithSettings();
    const s = user.settings!;

    expect(Number(s.inflationRate)).toBeCloseTo(0.03, 4);
    expect(Number(s.investmentGrowthRate)).toBeCloseTo(0.05, 4);
    expect(Number(s.savingsInterestRate)).toBeCloseTo(0.015, 4);
    expect(Number(s.debtInterestFallback)).toBeCloseTo(0.08, 4);
    expect(Number(s.safeWithdrawalRate)).toBeCloseTo(0.04, 4);
    expect(s.minEmergencyMonths).toBe(6);
    expect(Number(s.minPostDecisionCash)).toBeCloseTo(0, 2);
    expect(Number(s.minMonthlySurplus)).toBeCloseTo(0, 2);
    expect(Number(s.maxDebtToIncome)).toBeCloseTo(0.36, 4);
    expect(Number(s.maxHousingRatio)).toBeCloseTo(0.28, 4);

    // Optional fields null by default
    expect(s.housingTaxRateDefault).toBeNull();
    expect(s.housingInsuranceMonthlyDefault).toBeNull();
    expect(s.housingMaintenanceRateDefault).toBeNull();
    expect(s.stressExpenseReductionDefault).toBeNull();
  });

  it("stores custom Decimal values with correct precision", async () => {
    const user = await createUserWithSettings(
      {},
      {
        inflationRate: "0.0250",
        investmentGrowthRate: "0.0700",
        housingTaxRateDefault: "1.2500",
        housingInsuranceMonthlyDefault: "150.00",
        stressExpenseReductionDefault: "0.1500",
      }
    );
    const s = user.settings!;

    expect(Number(s.inflationRate)).toBeCloseTo(0.025, 4);
    expect(Number(s.investmentGrowthRate)).toBeCloseTo(0.07, 4);
    expect(Number(s.housingTaxRateDefault)).toBeCloseTo(1.25, 4);
    expect(Number(s.housingInsuranceMonthlyDefault)).toBeCloseTo(150, 2);
    expect(Number(s.stressExpenseReductionDefault)).toBeCloseTo(0.15, 4);
  });

  it("rejects duplicate userId on UserSettings with P2002", async () => {
    const user = await createUserWithSettings();

    await expect(
      prisma.userSettings.create({
        data: { userId: user.id },
      })
    ).rejects.toThrow(/Unique constraint/i);
  });

  it("cascades delete from user to settings", async () => {
    const user = await createUserWithSettings();
    const settingsId = user.settings!.id;

    await prisma.user.delete({ where: { id: user.id } });

    const found = await prisma.userSettings.findUnique({
      where: { id: settingsId },
    });
    expect(found).toBeNull();
  });
});
