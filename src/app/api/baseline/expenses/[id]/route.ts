import { withApi } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { ApiError } from "@/lib/api/error";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { patchExpenseSchema } from "@/schemas/baseline.schema";
import { serializeExpense } from "@/lib/baseline/serialize";

export const PATCH = withApi(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const userId = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const data = patchExpenseSchema.parse(body);

    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      throw ApiError.notFound();
    }

    const updated = await prisma.expense.update({ where: { id }, data });
    return ok(serializeExpense(updated));
  },
);
