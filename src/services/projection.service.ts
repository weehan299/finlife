import type { ProjectionMilestone } from "@/types/snapshot.types";

export function projectNetWorthWithBreakdown(
  totalAssets: number,
  totalLiabilities: number,
  monthlySurplus: number,
  annualGrowthRate: number,
  milestoneMonths: number[],
): ProjectionMilestone[] {
  const monthlyRate = Math.pow(1 + annualGrowthRate, 1 / 12) - 1;

  return milestoneMonths.map((months) => {
    let projectedAssets: number;

    if (monthlyRate === 0) {
      projectedAssets = totalAssets + monthlySurplus * months;
    } else {
      const compoundFactor = Math.pow(1 + monthlyRate, months);
      const fvLumpSum = totalAssets * compoundFactor;
      const fvAnnuity = monthlySurplus * ((compoundFactor - 1) / monthlyRate);
      projectedAssets = fvLumpSum + fvAnnuity;
    }

    projectedAssets = Math.round(projectedAssets * 100) / 100;

    return {
      label: "",
      months,
      netWorth: Math.round((projectedAssets - totalLiabilities) * 100) / 100,
      totalAssets: projectedAssets,
      totalLiabilities,
    };
  });
}

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

    const rounded = Math.round(netWorth * 100) / 100;
    return {
      label: "",
      months,
      netWorth: rounded,
      totalAssets: rounded,
      totalLiabilities: 0,
    };
  });
}
