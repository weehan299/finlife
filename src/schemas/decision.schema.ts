import { z } from "zod";

export const decisionTemplateSchema = z.enum([
  "HOME_PURCHASE",
  "NEW_LOAN",
  "LARGE_PURCHASE",
  "INCOME_LOSS",
  "RECURRING_EXPENSE",
  "ONE_TIME_EXPENSE",
]);

export const createDecisionSchema = z.object({
  template: decisionTemplateSchema,
  name: z.string().min(1).max(120),
  inputs: z.record(z.string(), z.unknown()),
});

export type CreateDecisionInput = z.infer<typeof createDecisionSchema>;
