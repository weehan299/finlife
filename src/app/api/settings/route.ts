import { withApi } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DEFAULT_ASSUMPTIONS } from "@/lib/defaults";
import { updateSettingsSchema } from "@/schemas/settings.schema";

export const GET = withApi(async () => {
  const userId = await requireAuth();

  const settings = await prisma.userSettings.findUnique({
    where: { userId },
  });

  if (!settings) {
    return ok({ ...DEFAULT_ASSUMPTIONS, retirementAge: DEFAULT_ASSUMPTIONS.retirementAge });
  }

  return ok({
    inflationRate: Number(settings.inflationRate),
    investmentGrowthRate: Number(settings.investmentGrowthRate),
    savingsInterestRate: Number(settings.savingsInterestRate),
    debtInterestFallback: Number(settings.debtInterestFallback),
    safeWithdrawalRate: Number(settings.safeWithdrawalRate),
    retirementAge: settings.retirementAge,
    minEmergencyMonths: settings.minEmergencyMonths,
    minPostDecisionCash: Number(settings.minPostDecisionCash),
    minMonthlySurplus: Number(settings.minMonthlySurplus),
    maxDebtToIncome: Number(settings.maxDebtToIncome),
    maxHousingRatio: Number(settings.maxHousingRatio),
  });
});

export const PUT = withApi(async (req: Request) => {
  const userId = await requireAuth();
  const body = await req.json();
  const data = updateSettingsSchema.parse(body);

  const updated = await prisma.userSettings.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });

  return ok({
    inflationRate: Number(updated.inflationRate),
    investmentGrowthRate: Number(updated.investmentGrowthRate),
    savingsInterestRate: Number(updated.savingsInterestRate),
    debtInterestFallback: Number(updated.debtInterestFallback),
    safeWithdrawalRate: Number(updated.safeWithdrawalRate),
    retirementAge: updated.retirementAge,
    minEmergencyMonths: updated.minEmergencyMonths,
    minPostDecisionCash: Number(updated.minPostDecisionCash),
    minMonthlySurplus: Number(updated.minMonthlySurplus),
    maxDebtToIncome: Number(updated.maxDebtToIncome),
    maxHousingRatio: Number(updated.maxHousingRatio),
  });
});
