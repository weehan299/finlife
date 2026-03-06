import { z } from "zod";

export const decisionTemplateSchema = z.enum([
  "HOME_PURCHASE",
  "NEW_LOAN",
  "LARGE_PURCHASE",
  "INCOME_LOSS",
  "RECURRING_EXPENSE",
  "ONE_TIME_EXPENSE",
]);

// ---------- Per-template input schemas ----------

export const homePurchaseInputsSchema = z.object({
  purchasePrice: z.number().positive(),
  downPaymentAmount: z.number().min(0),
  mortgageTermMonths: z.number().int().positive(),
  annualInterestRate: z.number().min(0).max(1),
  annualPropertyTaxRate: z.number().min(0).max(1).optional(),
  monthlyInsurance: z.number().min(0).optional(),
  annualMaintenanceRate: z.number().min(0).max(1).optional(),
  currentRentMonthly: z.number().min(0).optional(),
});

export const newLoanInputsSchema = z.object({
  loanAmount: z.number().positive(),
  annualInterestRate: z.number().min(0).max(1),
  termMonths: z.number().int().positive(),
  purpose: z.string().max(200).optional(),
});

export const largePurchaseInputsSchema = z.object({
  purchasePrice: z.number().positive(),
  upfrontPayment: z.number().min(0),
  financedAmount: z.number().min(0).optional(),
  financedTermMonths: z.number().int().positive().optional(),
  financedInterestRate: z.number().min(0).max(1).optional(),
});

export const incomeLossInputsSchema = z.object({
  incomeReductionMonthly: z.number().positive(),
  durationMonths: z.number().int().positive().optional(),
  expenseReductionRate: z.number().min(0).max(1).optional(),
});

export const recurringExpenseInputsSchema = z.object({
  monthlyAmount: z.number().positive(),
  durationMonths: z.number().int().positive().optional(),
  description: z.string().max(200).optional(),
});

export const oneTimeExpenseInputsSchema = z.object({
  amount: z.number().positive(),
  description: z.string().max(200).optional(),
});

const templateInputsSchemaMap = {
  HOME_PURCHASE: homePurchaseInputsSchema,
  NEW_LOAN: newLoanInputsSchema,
  LARGE_PURCHASE: largePurchaseInputsSchema,
  INCOME_LOSS: incomeLossInputsSchema,
  RECURRING_EXPENSE: recurringExpenseInputsSchema,
  ONE_TIME_EXPENSE: oneTimeExpenseInputsSchema,
} as const;

export function parseTemplateInputs(
  template: z.infer<typeof decisionTemplateSchema>,
  inputs: unknown,
) {
  return templateInputsSchemaMap[template].parse(inputs);
}

// ---------- Evaluate request (stateless, no name required) ----------

export const evaluateRequestSchema = z
  .object({
    template: decisionTemplateSchema,
    inputs: z.record(z.string(), z.unknown()),
  })
  .transform((data) => ({
    ...data,
    inputs: parseTemplateInputs(data.template, data.inputs),
  }));

export type EvaluateRequestInput = z.infer<typeof evaluateRequestSchema>;

// ---------- Create (save) decision ----------

export const createDecisionSchema = z
  .object({
    template: decisionTemplateSchema,
    name: z
      .string()
      .max(120)
      .transform((value) => value.trim())
      .optional(),
    inputs: z.record(z.string(), z.unknown()),
  })
  .transform((data) => ({
    ...data,
    inputs: parseTemplateInputs(data.template, data.inputs),
  }));

export type CreateDecisionInput = z.infer<typeof createDecisionSchema>;
