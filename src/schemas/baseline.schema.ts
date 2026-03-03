import { z } from "zod";

export const baselineInputSchema = z.object({
  assets: z.array(z.object({})).default([]),
  liabilities: z.array(z.object({})).default([]),
  incomes: z.array(z.object({})).default([]),
  expenses: z.array(z.object({})).default([]),
});

export type BaselineInput = z.infer<typeof baselineInputSchema>;
