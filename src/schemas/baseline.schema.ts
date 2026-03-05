import { z } from "zod";

// ─── Enum schemas ────────────────────────────────────────

export const assetCategorySchema = z.enum([
  "CASH_CHECKING",
  "SAVINGS",
  "INVESTMENTS",
  "RETIREMENT",
  "PROPERTY",
  "OTHER",
]);

export const liabilityCategorySchema = z.enum([
  "CREDIT_CARD",
  "STUDENT_LOAN",
  "PERSONAL_LOAN",
  "MORTGAGE",
  "OTHER",
]);

export const incomeCategorySchema = z.enum([
  "TAKE_HOME",
  "GROSS",
  "OTHER_RECURRING",
  "VARIABLE",
  "FALLBACK",
]);

export const expenseCategorySchema = z.enum([
  "ESSENTIAL_FIXED",
  "ESSENTIAL_VARIABLE",
  "DISCRETIONARY",
]);

export const provenanceSchema = z.enum([
  "USER_ENTERED",
  "USER_ESTIMATED",
  "SYSTEM_DEFAULT",
]);

// ─── Item input schemas (for PUT creates) ────────────────

export const assetInputSchema = z.object({
  category: assetCategorySchema,
  label: z.string().min(1).max(120),
  value: z.number().nonnegative(),
  isLiquid: z.boolean().default(false),
  monthlyContribution: z.number().nonnegative().optional(),
  annualGrowthRateOverride: z.number().min(0).max(1).optional(),
  provenance: provenanceSchema.default("USER_ENTERED"),
});

export const liabilityInputSchema = z.object({
  category: liabilityCategorySchema,
  label: z.string().min(1).max(120),
  balance: z.number().nonnegative(),
  annualInterestRate: z.number().min(0).max(1).optional(),
  minimumPayment: z.number().nonnegative().optional(),
  remainingTermMonths: z.number().int().positive().optional(),
  provenance: provenanceSchema.default("USER_ENTERED"),
});

export const incomeInputSchema = z.object({
  category: incomeCategorySchema,
  label: z.string().min(1).max(120),
  monthlyAmount: z.number().positive(),
  isGuaranteed: z.boolean().default(true),
  provenance: provenanceSchema.default("USER_ENTERED"),
});

export const expenseInputSchema = z.object({
  category: expenseCategorySchema,
  label: z.string().min(1).max(120),
  monthlyAmount: z.number().positive(),
  stressMonthlyAmount: z.number().nonnegative().optional(),
  isEssential: z.boolean().default(true),
  provenance: provenanceSchema.default("USER_ENTERED"),
});

// ─── Patch schemas (all fields optional) ─────────────────

export const patchAssetSchema = assetInputSchema.partial();
export const patchLiabilitySchema = liabilityInputSchema.partial();
export const patchIncomeSchema = incomeInputSchema.partial();
export const patchExpenseSchema = expenseInputSchema.partial();

// ─── Full baseline schema (detailed mode) ────────────────

export const baselineInputSchema = z.object({
  assets: z.array(assetInputSchema).default([]),
  liabilities: z.array(liabilityInputSchema).default([]),
  incomes: z.array(incomeInputSchema).default([]),
  expenses: z.array(expenseInputSchema).default([]),
});

// ─── Quick-mode schema ───────────────────────────────────

export const quickBaselineInputSchema = z.object({
  monthlyTakeHome: z.number().nonnegative().optional(),
  totalSavings: z.number().nonnegative().optional(),
  totalInvestments: z.number().nonnegative().optional(),
  totalDebt: z.number().nonnegative().optional(),
  monthlyEssentialExpenses: z.number().nonnegative().optional(),
  monthlyDiscretionaryExpenses: z.number().nonnegative().optional(),
});

// ─── Inferred types ──────────────────────────────────────

export type AssetInput = z.infer<typeof assetInputSchema>;
export type LiabilityInput = z.infer<typeof liabilityInputSchema>;
export type IncomeInput = z.infer<typeof incomeInputSchema>;
export type ExpenseInput = z.infer<typeof expenseInputSchema>;
export type BaselineInput = z.infer<typeof baselineInputSchema>;
export type QuickBaselineInput = z.infer<typeof quickBaselineInputSchema>;
