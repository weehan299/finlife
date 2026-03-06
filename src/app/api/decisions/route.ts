import { withApi } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildDecisionName } from "@/lib/decision-name";
import { createDecisionSchema } from "@/schemas/decision.schema";
import { evaluateDecision } from "@/services/decision.service";
import type { DecisionSummary } from "@/types/decision.types";

export const GET = withApi(async (req: Request) => {
  const userId = await requireAuth();
  const url = new URL(req.url);
  const status = url.searchParams.get("status");

  const where: Record<string, unknown> = { userId };
  if (status) where.status = status;

  const decisions = await prisma.decision.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });

  const summaries: DecisionSummary[] = decisions.map((d) => ({
    id: d.id,
    template: d.template as DecisionSummary["template"],
    name: d.name,
    status: d.status,
    verdict: d.verdict as DecisionSummary["verdict"],
    confidenceLevel: d.confidenceLevel as DecisionSummary["confidenceLevel"],
    computedUpfrontAmount: d.upfrontAmount != null ? Number(d.upfrontAmount) : null,
    computedMonthlyImpact: d.monthlyImpact != null ? Number(d.monthlyImpact) : null,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
    evaluatedAt: d.evaluatedAt?.toISOString() ?? null,
  }));

  return ok(summaries);
});

export const POST = withApi(async (req: Request) => {
  const userId = await requireAuth();
  const body = await req.json();
  const { template, name, inputs } = createDecisionSchema.parse(body);
  const finalName = name && name.length > 0 ? name : buildDecisionName(template, inputs);

  const result = await evaluateDecision({ template, inputs, userId });

  const decision = await prisma.decision.create({
    data: {
      userId,
      template,
      name: finalName,
      inputs: JSON.parse(JSON.stringify(inputs)),
      upfrontAmount: result.computedUpfrontAmount,
      monthlyImpact: result.computedMonthlyImpact,
      status: "EVALUATED",
      verdict: result.verdict,
      confidenceLevel: result.confidenceLevel,
      evaluatedAt: new Date(),
      assumptionsSnapshot: {},
      baselineSnapshot: JSON.parse(JSON.stringify(result.baselineSnapshot)),
      resultSnapshot: JSON.parse(JSON.stringify(result)),
    },
  });

  return ok({
    id: decision.id,
    template: decision.template,
    name: decision.name,
    status: decision.status,
    verdict: decision.verdict,
    confidenceLevel: decision.confidenceLevel,
    result,
  }, { status: 201 });
});
