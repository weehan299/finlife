import { z } from "zod";

export const goalTypeSchema = z.enum([
  "SAVINGS",
  "RETIREMENT",
  "FINANCIAL_INDEPENDENCE",
  "CUSTOM",
]);

export const allocationModeSchema = z.enum([
  "FULL_VALUE",
  "FIXED_AMOUNT",
  "PERCENT_OF_VALUE",
]);

export const createGoalSchema = z.object({
  type: goalTypeSchema,
  name: z.string().min(1).max(120),
  targetAmount: z.number().positive(),
  targetDate: z.string().datetime().optional(),
  startingAmount: z.number().min(0).default(0),
  monthlyContribution: z.number().min(0).default(0),
  provenance: z.enum(["USER_ENTERED", "USER_ESTIMATED", "SYSTEM_DEFAULT"]).default("USER_ENTERED"),
});

export const updateGoalSchema = createGoalSchema.partial();

export const goalAllocationInputSchema = z.object({
  assetId: z.string().min(1),
  mode: allocationModeSchema,
  allocationValue: z.number().min(0).optional(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type GoalAllocationInput = z.infer<typeof goalAllocationInputSchema>;
