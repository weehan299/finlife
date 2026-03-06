import { withApi } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DEFAULT_ASSUMPTIONS } from "@/lib/defaults";
import { projectNetWorth } from "@/services/projection.service";
import type { ProjectionResponse } from "@/types/snapshot.types";

export const GET = withApi(async (_req: Request) => {
  const userId = await requireAuth();

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      settings: true,
      assets: true,
      liabilities: true,
      incomes: true,
      expenses: true,
    },
  });

  const totalAssets = user.assets.reduce((sum, a) => sum + Number(a.value), 0);
  const totalLiabilities = user.liabilities.reduce((sum, l) => sum + Number(l.balance), 0);
  const monthlyIncome = user.incomes.reduce((sum, i) => sum + Number(i.monthlyAmount), 0);
  const monthlyExpenses = user.expenses.reduce((sum, e) => sum + Number(e.monthlyAmount), 0);

  const currentNetWorth = totalAssets - totalLiabilities;
  const monthlySurplus = monthlyIncome - monthlyExpenses;

  const investmentGrowthRate = user.settings
    ? Number(user.settings.investmentGrowthRate)
    : DEFAULT_ASSUMPTIONS.investmentGrowthRate;

  const retirementAge = user.settings?.retirementAge ?? DEFAULT_ASSUMPTIONS.retirementAge;

  const milestoneMonths = [12, 60, 120, 240];
  const labels = ["1 Year", "5 Years", "10 Years", "20 Years"];

  let currentAge: number | null = null;

  if (user.dateOfBirth) {
    const now = new Date();
    const ageMs = now.getTime() - user.dateOfBirth.getTime();
    const ageMonths = Math.floor(ageMs / (1000 * 60 * 60 * 24 * 30.4375));
    currentAge = Math.floor(ageMonths / 12);

    const monthsToRetirement = retirementAge * 12 - ageMonths;
    if (monthsToRetirement > 0) {
      milestoneMonths.push(monthsToRetirement);
      labels.push(`Retirement (age ${retirementAge})`);
    }
  }

  const milestones = projectNetWorth(
    currentNetWorth,
    monthlySurplus,
    investmentGrowthRate,
    milestoneMonths,
  );

  milestones.forEach((m, i) => {
    m.label = labels[i];
  });

  const response: ProjectionResponse = {
    currentNetWorth,
    milestones,
    currentAge,
    retirementAge,
  };

  return ok(response);
});
