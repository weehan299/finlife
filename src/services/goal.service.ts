import type { GoalProgress, SerializedGoal, SerializedGoalAllocation, GoalWithProgress } from "@/types/goal.types";
import { DEFAULT_ASSUMPTIONS } from "@/lib/defaults";
import { prisma } from "@/lib/db";
import { serializeGoal } from "@/lib/goals";

// ---------- Pure functions ----------

export function computeAllocatedAmount(allocations: SerializedGoalAllocation[]): number {
  return allocations.reduce((sum, a) => sum + a.effectiveValue, 0);
}

export function resolveGrowthRate(
  goalType: string,
  settings?: { investmentGrowthRate?: number; savingsInterestRate?: number },
): number {
  const investmentRate = settings?.investmentGrowthRate ?? DEFAULT_ASSUMPTIONS.investmentGrowthRate;
  const savingsRate = settings?.savingsInterestRate ?? DEFAULT_ASSUMPTIONS.savingsInterestRate;

  switch (goalType) {
    case "RETIREMENT":
    case "FINANCIAL_INDEPENDENCE":
      return investmentRate;
    case "SAVINGS":
    case "CUSTOM":
    default:
      return savingsRate;
  }
}

export function getGoalProgress(
  goal: SerializedGoal,
  growthRate: number,
): GoalProgress {
  const allocatedAmount = computeAllocatedAmount(goal.allocations);
  const currentAmount = allocatedAmount > 0 ? allocatedAmount : goal.startingAmount;
  const targetAmount = goal.targetAmount;
  const percentComplete = targetAmount > 0 ? Math.min(100, (currentAmount / targetAmount) * 100) : 0;
  const amountRemaining = Math.max(0, targetAmount - currentAmount);

  let estimatedMonthsToTarget: number | null = null;

  if (amountRemaining > 0 && goal.monthlyContribution > 0) {
    const monthlyRate = growthRate / 12;
    if (monthlyRate > 0) {
      // Future value of annuity: FV = PMT * ((1+r)^n - 1) / r + PV * (1+r)^n
      // We need to find n such that FV >= targetAmount
      // PMT * ((1+r)^n - 1) / r + currentAmount * (1+r)^n = targetAmount
      // Let's solve iteratively or use the logarithmic formula:
      // n = ln((targetAmount * r + PMT) / (currentAmount * r + PMT)) / ln(1 + r)
      const numerator = goal.targetAmount * monthlyRate + goal.monthlyContribution;
      const denominator = currentAmount * monthlyRate + goal.monthlyContribution;
      if (denominator > 0 && numerator > 0) {
        const months = Math.log(numerator / denominator) / Math.log(1 + monthlyRate);
        estimatedMonthsToTarget = Math.ceil(months);
      }
    } else {
      estimatedMonthsToTarget = Math.ceil(amountRemaining / goal.monthlyContribution);
    }
  }

  return {
    goalId: goal.id,
    currentAmount,
    percentComplete: Math.round(percentComplete * 100) / 100,
    amountRemaining,
    estimatedMonthsToTarget,
  };
}

export function computeDecisionGoalImpact(
  goal: SerializedGoal,
  progress: GoalProgress,
  monthlyImpactReduction: number,
  growthRate: number,
): { projectedDelayMonths: number | null; deltaToTarget: number | null } {
  const reducedContribution = goal.monthlyContribution - monthlyImpactReduction;

  if (reducedContribution <= 0 || goal.monthlyContribution <= 0) {
    return { projectedDelayMonths: null, deltaToTarget: null };
  }

  const monthlyRate = growthRate / 12;

  // Compute months with reduced contribution
  const reducedGoal: SerializedGoal = { ...goal, monthlyContribution: reducedContribution };
  const reducedProgress = getGoalProgress(reducedGoal, growthRate);

  const projectedDelayMonths =
    progress.estimatedMonthsToTarget != null && reducedProgress.estimatedMonthsToTarget != null
      ? reducedProgress.estimatedMonthsToTarget - progress.estimatedMonthsToTarget
      : null;

  // Compute shortfall: how much less you'd have at the original timeframe
  let deltaToTarget: number | null = null;
  if (progress.estimatedMonthsToTarget != null) {
    const n = progress.estimatedMonthsToTarget;
    const fvOriginal = computeFutureValue(progress.currentAmount, goal.monthlyContribution, monthlyRate, n);
    const fvReduced = computeFutureValue(progress.currentAmount, reducedContribution, monthlyRate, n);
    deltaToTarget = Math.round((fvReduced - fvOriginal) * 100) / 100;
  }

  return { projectedDelayMonths, deltaToTarget };
}

function computeFutureValue(
  pv: number,
  pmt: number,
  monthlyRate: number,
  months: number,
): number {
  if (monthlyRate > 0) {
    const factor = Math.pow(1 + monthlyRate, months);
    return pv * factor + pmt * (factor - 1) / monthlyRate;
  }
  return pv + pmt * months;
}

// ---------- Async entry point ----------

export async function computeAllGoalProgress(userId: string): Promise<GoalWithProgress[]> {
  const [goals, userSettings] = await Promise.all([
    prisma.goal.findMany({
      where: { userId },
      include: { assetAllocations: { include: { asset: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.userSettings.findUnique({ where: { userId } }),
  ]);

  const settings = userSettings
    ? {
        investmentGrowthRate: Number(userSettings.investmentGrowthRate),
        savingsInterestRate: Number(userSettings.savingsInterestRate),
      }
    : undefined;

  return goals.map((goal) => {
    const serialized = serializeGoal(goal);
    const growthRate = resolveGrowthRate(serialized.type, settings);
    const progress = getGoalProgress(serialized, growthRate);
    return { ...serialized, progress };
  });
}
