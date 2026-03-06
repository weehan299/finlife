import { withApi } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { ApiError } from "@/lib/api/error";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const DELETE = withApi(
  async (
    _req: Request,
    { params }: { params: Promise<{ id: string; allocId: string }> },
  ) => {
    const userId = await requireAuth();
    const { id, allocId } = await params;

    const allocation = await prisma.goalAssetAllocation.findUnique({
      where: { id: allocId },
      include: { goal: true },
    });

    if (!allocation || allocation.goalId !== id || allocation.goal.userId !== userId) {
      throw ApiError.notFound();
    }

    await prisma.goalAssetAllocation.delete({ where: { id: allocId } });
    return ok({ deleted: true });
  },
);
