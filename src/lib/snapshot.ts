import type { FinancialSnapshot, BaselineResponse } from "@/types/baseline.types";
import { DEFAULT_ASSUMPTIONS } from "@/lib/defaults";

export interface SnapshotWithExtras extends FinancialSnapshot {
  emergencyRunwayMonths: number;
  liquidAssets: number;
  debtToIncomeRatio: number;
}

export function computeSnapshot(data: BaselineResponse): SnapshotWithExtras {
  const totalAssets = data.assets.reduce((sum, a) => sum + a.value, 0);
  const liquidAssets = data.assets
    .filter((a) => a.isLiquid)
    .reduce((sum, a) => sum + a.value, 0);
  const totalLiabilities = data.liabilities.reduce(
    (sum, l) => sum + l.balance,
    0,
  );
  const monthlyIncome = data.incomes.reduce(
    (sum, i) => sum + i.monthlyAmount,
    0,
  );
  const monthlyExpenses = data.expenses.reduce(
    (sum, e) => sum + e.monthlyAmount,
    0,
  );

  const netWorth = totalAssets - totalLiabilities;
  const monthlySurplus = monthlyIncome - monthlyExpenses;

  const emergencyRunwayMonths =
    monthlyExpenses > 0 ? liquidAssets / monthlyExpenses : 0;

  const debtToIncomeRatio =
    monthlyIncome > 0 ? totalLiabilities / (monthlyIncome * 12) : 0;

  return {
    totalAssets,
    totalLiabilities,
    netWorth,
    monthlyIncome,
    monthlyExpenses,
    monthlySurplus,
    emergencyRunwayMonths,
    liquidAssets,
    debtToIncomeRatio,
  };
}

export function summarizeSnapshot(s: SnapshotWithExtras): string {
  const parts: string[] = [];

  if (s.monthlySurplus >= 0) {
    parts.push(`You have a monthly surplus of $${Math.round(s.monthlySurplus).toLocaleString("en-US")}.`);
  } else {
    parts.push(`You have a monthly deficit of $${Math.round(Math.abs(s.monthlySurplus)).toLocaleString("en-US")}.`);
  }

  const recommended = DEFAULT_ASSUMPTIONS.minEmergencyMonths;
  const runway = Math.round(s.emergencyRunwayMonths * 10) / 10;
  if (runway >= recommended) {
    parts.push(
      `Your emergency runway is ${runway} months, meeting the ${recommended}-month recommendation.`,
    );
  } else {
    parts.push(
      `Your emergency runway is ${runway} months, below the recommended ${recommended} months.`,
    );
  }

  return parts.join(" ");
}
