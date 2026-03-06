import { withApi } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createGoalSchema } from "@/schemas/goal.schema";
import { serializeGoal } from "@/lib/goals";
import { computeAllGoalProgress } from "@/services/goal.service";

export const GET = withApi(async (_req: Request) => {
  const userId = await requireAuth();
  const goalsWithProgress = await computeAllGoalProgress(userId);
  return ok(goalsWithProgress);
});

export const POST = withApi(async (req: Request) => {
  const userId = await requireAuth();
  const body = await req.json();
  const data = createGoalSchema.parse(body);

  const goal = await prisma.goal.create({
    data: {
      ...data,
      targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
      userId,
    },
    include: { assetAllocations: { include: { asset: true } } },
  });

  return ok(serializeGoal(goal), { status: 201 });
});
