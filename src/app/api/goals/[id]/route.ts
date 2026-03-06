import { withApi } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { ApiError } from "@/lib/api/error";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateGoalSchema } from "@/schemas/goal.schema";
import { serializeGoal } from "@/lib/goals";
import { resolveGrowthRate, getGoalProgress } from "@/services/goal.service";
import type { GoalImpactSummary } from "@/types/goal.types";

export const GET = withApi(
  async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const userId = await requireAuth();
    const { id } = await params;

    const goal = await prisma.goal.findUnique({
      where: { id },
      include: {
        assetAllocations: { include: { asset: true } },
        decisionImpacts: { include: { decision: true } },
      },
    });

    if (!goal || goal.userId !== userId) {
      throw ApiError.notFound();
    }

    const serialized = serializeGoal(goal);
    const growthRate = resolveGrowthRate(serialized.type);
    const progress = getGoalProgress(serialized, growthRate);

    const impacts: GoalImpactSummary[] = goal.decisionImpacts.map((di) => ({
      id: di.id,
      decisionId: di.decisionId,
      decisionName: di.decision.name,
      projectedDelayMonths: di.projectedDelayMonths,
      deltaToTarget: di.deltaToTarget != null ? Number(di.deltaToTarget) : null,
    }));

    return ok({ ...serialized, progress, impacts });
  },
);

export const PATCH = withApi(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const userId = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const data = updateGoalSchema.parse(body);

    const existing = await prisma.goal.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      throw ApiError.notFound();
    }

    const updated = await prisma.goal.update({
      where: { id },
      data: {
        ...data,
        targetDate: data.targetDate !== undefined ? (data.targetDate ? new Date(data.targetDate) : null) : undefined,
      },
      include: { assetAllocations: { include: { asset: true } } },
    });

    return ok(serializeGoal(updated));
  },
);

export const DELETE = withApi(
  async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const userId = await requireAuth();
    const { id } = await params;

    const existing = await prisma.goal.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      throw ApiError.notFound();
    }

    await prisma.goal.delete({ where: { id } });
    return ok({ deleted: true });
  },
);
