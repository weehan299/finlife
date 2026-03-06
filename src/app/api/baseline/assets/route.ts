import { withApi } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assetInputSchema } from "@/schemas/baseline.schema";
import { serializeAsset } from "@/lib/baseline/serialize";

export const POST = withApi(async (req: Request) => {
  const userId = await requireAuth();
  const body = await req.json();
  const data = assetInputSchema.parse(body);

  const asset = await prisma.asset.create({
    data: { ...data, userId },
  });

  return ok(serializeAsset(asset), { status: 201 });
});
