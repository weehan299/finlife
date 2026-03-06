import { withApi } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { ApiError } from "@/lib/api/error";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { goalAllocationInputSchema } from "@/schemas/goal.schema";

export const GET = withApi(
  async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const userId = await requireAuth();
    const { id } = await params;

    const goal = await prisma.goal.findUnique({ where: { id } });
    if (!goal || goal.userId !== userId) {
      throw ApiError.notFound();
    }

    const allocations = await prisma.goalAssetAllocation.findMany({
      where: { goalId: id },
      include: { asset: true },
    });

    return ok(
      allocations.map((a) => ({
        id: a.id,
        assetId: a.assetId,
        assetLabel: a.asset.label,
        assetValue: Number(a.asset.value),
        mode: a.mode,
        allocationValue: a.allocationValue != null ? Number(a.allocationValue) : null,
      })),
    );
  },
);

export const POST = withApi(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const userId = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const data = goalAllocationInputSchema.parse(body);

    const goal = await prisma.goal.findUnique({ where: { id } });
    if (!goal || goal.userId !== userId) {
      throw ApiError.notFound();
    }

    const asset = await prisma.asset.findUnique({ where: { id: data.assetId } });
    if (!asset || asset.userId !== userId) {
      throw ApiError.notFound("Asset not found");
    }

    const allocation = await prisma.goalAssetAllocation.create({
      data: {
        goalId: id,
        assetId: data.assetId,
        mode: data.mode,
        allocationValue: data.allocationValue,
      },
      include: { asset: true },
    });

    return ok(
      {
        id: allocation.id,
        assetId: allocation.assetId,
        assetLabel: allocation.asset.label,
        assetValue: Number(allocation.asset.value),
        mode: allocation.mode,
        allocationValue: allocation.allocationValue != null ? Number(allocation.allocationValue) : null,
      },
      { status: 201 },
    );
  },
);
