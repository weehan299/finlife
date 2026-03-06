import { withApi } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { liabilityInputSchema } from "@/schemas/baseline.schema";
import { serializeLiability } from "@/lib/baseline/serialize";

export const POST = withApi(async (req: Request) => {
  const userId = await requireAuth();
  const body = await req.json();
  const data = liabilityInputSchema.parse(body);

  const liability = await prisma.liability.create({
    data: { ...data, userId },
  });

  return ok(serializeLiability(liability), { status: 201 });
});
