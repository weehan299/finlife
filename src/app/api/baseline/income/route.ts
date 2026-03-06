import { withApi } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { incomeInputSchema } from "@/schemas/baseline.schema";
import { serializeIncome } from "@/lib/baseline/serialize";

export const POST = withApi(async (req: Request) => {
  const userId = await requireAuth();
  const body = await req.json();
  const data = incomeInputSchema.parse(body);

  const income = await prisma.income.create({
    data: { ...data, userId },
  });

  return ok(serializeIncome(income), { status: 201 });
});
