import { withApi } from "@/lib/api/handler";
import { ok, fail } from "@/lib/api/response";
import { ApiError } from "@/lib/api/error";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const GET = withApi(
  async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const userId = await requireAuth();
    const { id } = await params;

    const decision = await prisma.decision.findUnique({
      where: { id },
    });

    if (!decision || decision.userId !== userId) {
      return fail(ApiError.notFound("Decision not found"));
    }

    return ok({
      id: decision.id,
      template: decision.template,
      name: decision.name,
      status: decision.status,
      verdict: decision.verdict,
      confidenceLevel: decision.confidenceLevel,
      inputs: decision.inputs,
      upfrontAmount: decision.upfrontAmount != null ? Number(decision.upfrontAmount) : null,
      monthlyImpact: decision.monthlyImpact != null ? Number(decision.monthlyImpact) : null,
      assumptionsSnapshot: decision.assumptionsSnapshot,
      baselineSnapshot: decision.baselineSnapshot,
      resultSnapshot: decision.resultSnapshot,
      createdAt: decision.createdAt.toISOString(),
      updatedAt: decision.updatedAt.toISOString(),
      evaluatedAt: decision.evaluatedAt?.toISOString() ?? null,
    });
  },
);
