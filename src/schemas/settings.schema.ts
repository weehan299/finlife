import { z } from "zod";

export const updateSettingsSchema = z.object({
  inflationRate: z.number().min(0).max(1).optional(),
  investmentGrowthRate: z.number().min(0).max(1).optional(),
  savingsInterestRate: z.number().min(0).max(1).optional(),
  debtInterestFallback: z.number().min(0).max(1).optional(),
  safeWithdrawalRate: z.number().min(0).max(1).optional(),
  minEmergencyMonths: z.number().int().min(1).max(60).optional(),
  minPostDecisionCash: z.number().min(0).optional(),
  minMonthlySurplus: z.number().min(0).optional(),
  maxDebtToIncome: z.number().min(0).max(1).optional(),
  maxHousingRatio: z.number().min(0).max(1).optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
