import { withApi } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { ApiError } from "@/lib/api/error";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { patchIncomeSchema } from "@/schemas/baseline.schema";
import { serializeIncome } from "@/lib/baseline/serialize";

export const PATCH = withApi(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const userId = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const data = patchIncomeSchema.parse(body);

    const existing = await prisma.income.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      throw ApiError.notFound();
    }

    const updated = await prisma.income.update({ where: { id }, data });
    return ok(serializeIncome(updated));
  },
);

export const DELETE = withApi(
  async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const userId = await requireAuth();
    const { id } = await params;

    const existing = await prisma.income.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      throw ApiError.notFound();
    }

    await prisma.income.delete({ where: { id } });
    return ok({ deleted: true });
  },
);
