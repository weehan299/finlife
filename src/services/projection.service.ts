import type { ProjectionMilestone } from "@/types/snapshot.types";

export function projectNetWorth(
  currentNetWorth: number,
  monthlySurplus: number,
  annualGrowthRate: number,
  milestoneMonths: number[],
): ProjectionMilestone[] {
  const monthlyRate = Math.pow(1 + annualGrowthRate, 1 / 12) - 1;

  return milestoneMonths.map((months) => {
    let netWorth: number;

    if (monthlyRate === 0) {
      netWorth = currentNetWorth + monthlySurplus * months;
    } else {
      const compoundFactor = Math.pow(1 + monthlyRate, months);
      const fvLumpSum = currentNetWorth * compoundFactor;
      const fvAnnuity = monthlySurplus * ((compoundFactor - 1) / monthlyRate);
      netWorth = fvLumpSum + fvAnnuity;
    }

    return {
      label: "",
      months,
      netWorth: Math.round(netWorth * 100) / 100,
    };
  });
}
