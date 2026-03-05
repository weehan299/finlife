import { withApi } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth";
import { evaluateRequestSchema } from "@/schemas/decision.schema";
import { evaluateDecision } from "@/services/decision.service";

export const POST = withApi(async (req: Request) => {
  const userId = await requireAuth();
  const body = await req.json();
  const { template, inputs } = evaluateRequestSchema.parse(body);

  const result = await evaluateDecision({ template, inputs, userId });
  return ok(result);
});
