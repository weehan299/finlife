import type { Goal, GoalAssetAllocation, Asset } from "@prisma/client";
import type { SerializedGoal, SerializedGoalAllocation } from "@/types/goal.types";

type GoalWithAllocations = Goal & {
  assetAllocations: (GoalAssetAllocation & { asset: Asset })[];
};

function computeEffectiveValue(
  mode: string,
  assetValue: number,
  allocationValue: number | null,
): number {
  switch (mode) {
    case "FULL_VALUE":
      return assetValue;
    case "FIXED_AMOUNT":
      return allocationValue ?? 0;
    case "PERCENT_OF_VALUE":
      return assetValue * (allocationValue ?? 0);
    default:
      return 0;
  }
}

function serializeAllocation(
  a: GoalAssetAllocation & { asset: Asset },
): SerializedGoalAllocation {
  const assetValue = Number(a.asset.value);
  const allocationValue = a.allocationValue != null ? Number(a.allocationValue) : null;
  return {
    id: a.id,
    assetId: a.assetId,
    assetLabel: a.asset.label,
    assetValue,
    mode: a.mode,
    allocationValue,
    effectiveValue: computeEffectiveValue(a.mode, assetValue, allocationValue),
  };
}

export function serializeGoal(goal: GoalWithAllocations): SerializedGoal {
  return {
    id: goal.id,
    type: goal.type,
    name: goal.name,
    targetAmount: Number(goal.targetAmount),
    targetDate: goal.targetDate ? goal.targetDate.toISOString() : null,
    startingAmount: Number(goal.startingAmount),
    monthlyContribution: Number(goal.monthlyContribution),
    provenance: goal.provenance,
    createdAt: goal.createdAt.toISOString(),
    updatedAt: goal.updatedAt.toISOString(),
    allocations: goal.assetAllocations.map(serializeAllocation),
  };
}
