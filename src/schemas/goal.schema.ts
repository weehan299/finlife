import { z } from "zod";

export const goalTypeSchema = z.enum([
  "SAVINGS",
  "RETIREMENT",
  "FINANCIAL_INDEPENDENCE",
  "CUSTOM",
]);

export const createGoalSchema = z.object({
  type: goalTypeSchema,
  name: z.string().min(1).max(120),
  targetAmount: z.number().positive(),
  targetDate: z.iso.datetime().optional(),
  monthlyContribution: z.number().min(0).default(0),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
