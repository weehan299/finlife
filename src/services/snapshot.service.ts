import { prisma } from "@/lib/db";
import { DEFAULT_ASSUMPTIONS } from "@/lib/defaults";
import type { SnapshotWithExtras } from "@/lib/snapshot";
import type { BaselineResponse } from "@/types/baseline.types";
import type { ResolvedGuardrails } from "@/types/decision.types";
import { computeSnapshot } from "@/lib/snapshot";

function serializeBaseline(
  user: {
    settings: {
      id: string;
    } | null;
    assets: { id: string; category: string; label: string; value: unknown; isLiquid: boolean; monthlyContribution: unknown; annualGrowthRateOverride: unknown; provenance: string; createdAt: Date; updatedAt: Date }[];
    liabilities: { id: string; category: string; label: string; balance: unknown; annualInterestRate: unknown; minimumPayment: unknown; remainingTermMonths: unknown; provenance: string; createdAt: Date; updatedAt: Date }[];
    incomes: { id: string; category: string; label: string; monthlyAmount: unknown; isGuaranteed: boolean; provenance: string; createdAt: Date; updatedAt: Date }[];
    expenses: { id: string; category: string; label: string; monthlyAmount: unknown; stressMonthlyAmount: unknown; isEssential: boolean; provenance: string; createdAt: Date; updatedAt: Date }[];
  },
): BaselineResponse {
  return {
    mode: user.settings ? "DETAILED" : "QUICK",
    assets: user.assets.map((a) => ({
      id: a.id,
      category: a.category,
      label: a.label,
      value: Number(a.value),
      isLiquid: a.isLiquid,
      monthlyContribution: a.monthlyContribution != null ? Number(a.monthlyContribution) : null,
      annualGrowthRateOverride: a.annualGrowthRateOverride != null ? Number(a.annualGrowthRateOverride) : null,
      provenance: a.provenance,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    })),
    liabilities: user.liabilities.map((l) => ({
      id: l.id,
      category: l.category,
      label: l.label,
      balance: Number(l.balance),
      annualInterestRate: l.annualInterestRate != null ? Number(l.annualInterestRate) : null,
      minimumPayment: l.minimumPayment != null ? Number(l.minimumPayment) : null,
      remainingTermMonths: l.remainingTermMonths != null ? Number(l.remainingTermMonths) : null,
      provenance: l.provenance,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
    })),
    incomes: user.incomes.map((i) => ({
      id: i.id,
      category: i.category,
      label: i.label,
      monthlyAmount: Number(i.monthlyAmount),
      isGuaranteed: i.isGuaranteed,
      provenance: i.provenance,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
    })),
    expenses: user.expenses.map((e) => ({
      id: e.id,
      category: e.category,
      label: e.label,
      monthlyAmount: Number(e.monthlyAmount),
      stressMonthlyAmount: e.stressMonthlyAmount != null ? Number(e.stressMonthlyAmount) : null,
      isEssential: e.isEssential,
      provenance: e.provenance,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    })),
  };
}

export async function buildSnapshot(userId: string): Promise<{ snapshot: SnapshotWithExtras; baseline: BaselineResponse }> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      settings: { select: { id: true } },
      assets: true,
      liabilities: true,
      incomes: true,
      expenses: true,
    },
  });

  const baseline = serializeBaseline(user);
  const snapshot = computeSnapshot(baseline);
  return { snapshot, baseline };
}

export async function resolveGuardrails(userId: string): Promise<ResolvedGuardrails> {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
  });

  return {
    minEmergencyMonths: settings?.minEmergencyMonths ?? DEFAULT_ASSUMPTIONS.minEmergencyMonths,
    minPostDecisionCash: settings ? Number(settings.minPostDecisionCash) : DEFAULT_ASSUMPTIONS.minPostDecisionCash,
    minMonthlySurplus: settings ? Number(settings.minMonthlySurplus) : DEFAULT_ASSUMPTIONS.minMonthlySurplus,
    maxDebtToIncome: settings ? Number(settings.maxDebtToIncome) : DEFAULT_ASSUMPTIONS.maxDebtToIncome,
    maxHousingRatio: settings ? Number(settings.maxHousingRatio) : DEFAULT_ASSUMPTIONS.maxHousingRatio,
    stressExpenseReductionRate: settings?.stressExpenseReductionDefault != null
      ? Number(settings.stressExpenseReductionDefault)
      : 0.2,
    housingTaxRateDefault: settings?.housingTaxRateDefault != null
      ? Number(settings.housingTaxRateDefault)
      : 0.012,
    housingInsuranceMonthlyDefault: settings?.housingInsuranceMonthlyDefault != null
      ? Number(settings.housingInsuranceMonthlyDefault)
      : 150,
    housingMaintenanceRateDefault: settings?.housingMaintenanceRateDefault != null
      ? Number(settings.housingMaintenanceRateDefault)
      : 0.01,
  };
}
