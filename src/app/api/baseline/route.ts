import { withApi } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import type { ApiMeta } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  baselineInputSchema,
  quickBaselineInputSchema,
} from "@/schemas/baseline.schema";
import {
  serializeAsset,
  serializeLiability,
  serializeIncome,
  serializeExpense,
} from "@/lib/baseline/serialize";
import {
  isQuickPayload,
  normalizeQuickBaseline,
} from "@/lib/baseline/normalize";

const baselineSelect = {
  mode: true,
  assets: { orderBy: { createdAt: "asc" as const } },
  liabilities: { orderBy: { createdAt: "asc" as const } },
  incomes: { orderBy: { createdAt: "asc" as const } },
  expenses: { orderBy: { createdAt: "asc" as const } },
};

import type { Asset, Liability, Income, Expense, InputMode } from "@prisma/client";

function buildResponse(user: {
  mode: InputMode;
  assets: Asset[];
  liabilities: Liability[];
  incomes: Income[];
  expenses: Expense[];
}) {
  const assets = user.assets.map(serializeAsset);
  const liabilities = user.liabilities.map(serializeLiability);
  const incomes = user.incomes.map(serializeIncome);
  const expenses = user.expenses.map(serializeExpense);

  const allRecords = [
    ...user.assets,
    ...user.liabilities,
    ...user.incomes,
    ...user.expenses,
  ];
  const defaultsUsed = allRecords
    .filter((r) => r.provenance === "SYSTEM_DEFAULT")
    .map((r) => r.label);
  const uniqueDefaults = [...new Set(defaultsUsed)];

  const meta: ApiMeta = {
    confidence: user.mode === "DETAILED" ? "complete" : "estimated",
    ...(uniqueDefaults.length > 0 ? { defaultsUsed: uniqueDefaults } : {}),
  };

  return { data: { mode: user.mode, assets, liabilities, incomes, expenses }, meta };
}

export const GET = withApi(async (_req: Request) => {
  const userId = await requireAuth();

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: baselineSelect,
  });

  const { data, meta } = buildResponse(user);
  return ok(data, undefined, meta);
});

export const PUT = withApi(async (req: Request) => {
  const userId = await requireAuth();
  const body = await req.json();

  const quick = isQuickPayload(body);
  const validated = quick
    ? normalizeQuickBaseline(quickBaselineInputSchema.parse(body))
    : baselineInputSchema.parse(body);

  await prisma.$transaction(async (tx) => {
    await tx.asset.deleteMany({ where: { userId } });
    await tx.liability.deleteMany({ where: { userId } });
    await tx.income.deleteMany({ where: { userId } });
    await tx.expense.deleteMany({ where: { userId } });

    if (validated.assets.length > 0) {
      await tx.asset.createMany({
        data: validated.assets.map((a) => ({ ...a, userId })),
      });
    }
    if (validated.liabilities.length > 0) {
      await tx.liability.createMany({
        data: validated.liabilities.map((l) => ({ ...l, userId })),
      });
    }
    if (validated.incomes.length > 0) {
      await tx.income.createMany({
        data: validated.incomes.map((i) => ({ ...i, userId })),
      });
    }
    if (validated.expenses.length > 0) {
      await tx.expense.createMany({
        data: validated.expenses.map((e) => ({ ...e, userId })),
      });
    }

    await tx.user.update({
      where: { id: userId },
      data: {
        dateOfBirth: validated.dateOfBirth,
        onboardingComplete: true,
        mode: quick ? "QUICK" : "DETAILED",
      },
    });
  });

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: baselineSelect,
  });

  const { data, meta } = buildResponse(user);
  return ok(data, undefined, meta);
});
