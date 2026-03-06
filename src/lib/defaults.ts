export const DEFAULT_ASSUMPTIONS = {
  inflationRate: 0.03,
  investmentGrowthRate: 0.05,
  savingsInterestRate: 0.015,
  debtInterestFallback: 0.08,
  safeWithdrawalRate: 0.04,
  retirementAge: 65,
  minEmergencyMonths: 6,
  minPostDecisionCash: 0,
  minMonthlySurplus: 0,
  maxDebtToIncome: 0.36,
  maxHousingRatio: 0.28,
} as const;
