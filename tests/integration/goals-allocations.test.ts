import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "../helpers/prisma";
import { cleanDatabase } from "../helpers/cleanup";
import {
  createUser,
  createGoal,
  createAsset,
  createGoalAssetAllocation,
} from "../helpers/factories";

beforeEach(cleanDatabase);

describe("Goal", () => {
  it("creates goals with all 4 GoalType values", async () => {
    const user = await createUser();
    const types = [
      "SAVINGS",
      "RETIREMENT",
      "FINANCIAL_INDEPENDENCE",
      "CUSTOM",
    ] as const;

    for (const type of types) {
      const goal = await createGoal(user.id, { type, name: `${type} goal` });
      expect(goal.type).toBe(type);
    }

    const count = await prisma.goal.count({ where: { userId: user.id } });
    expect(count).toBe(4);
  });

  it("defaults startingAmount and monthlyContribution to 0", async () => {
    const user = await createUser();
    const goal = await createGoal(user.id);

    expect(Number(goal.startingAmount)).toBe(0);
    expect(Number(goal.monthlyContribution)).toBe(0);
  });

  it("has null targetDate when omitted", async () => {
    const user = await createUser();
    const goal = await createGoal(user.id);
    expect(goal.targetDate).toBeNull();
  });

  it("stores targetDate when provided", async () => {
    const user = await createUser();
    const target = new Date("2030-06-15");
    const goal = await createGoal(user.id, { targetDate: target });

    expect(goal.targetDate).toBeInstanceOf(Date);
    expect(goal.targetDate!.toISOString().startsWith("2030-06-15")).toBe(true);
  });

  it("queries by composite index (userId, type)", async () => {
    const user = await createUser();
    await createGoal(user.id, { type: "SAVINGS", name: "S" });
    await createGoal(user.id, { type: "RETIREMENT", name: "R" });

    const savings = await prisma.goal.findMany({
      where: { userId: user.id, type: "SAVINGS" },
    });
    expect(savings).toHaveLength(1);
    expect(savings[0].name).toBe("S");
  });

  it("queries by composite index (userId, targetDate)", async () => {
    const user = await createUser();
    const d1 = new Date("2028-01-01T00:00:00.000Z");
    const d2 = new Date("2035-01-01T00:00:00.000Z");
    await createGoal(user.id, { name: "Near", targetDate: d1 });
    await createGoal(user.id, { name: "Far", targetDate: d2 });

    const results = await prisma.goal.findMany({
      where: {
        userId: user.id,
        targetDate: { lte: new Date("2030-01-01T00:00:00.000Z") },
      },
    });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Near");
  });
});

describe("GoalAssetAllocation", () => {
  it("creates allocation with FULL_VALUE mode and null allocationValue", async () => {
    const user = await createUser();
    const goal = await createGoal(user.id);
    const asset = await createAsset(user.id);

    const alloc = await createGoalAssetAllocation(goal.id, asset.id, {
      mode: "FULL_VALUE",
    });

    expect(alloc.mode).toBe("FULL_VALUE");
    expect(alloc.allocationValue).toBeNull();
  });

  it("creates allocation with FIXED_AMOUNT mode", async () => {
    const user = await createUser();
    const goal = await createGoal(user.id);
    const asset = await createAsset(user.id);

    const alloc = await createGoalAssetAllocation(goal.id, asset.id, {
      mode: "FIXED_AMOUNT",
      allocationValue: "25000.0000",
    });

    expect(alloc.mode).toBe("FIXED_AMOUNT");
    expect(Number(alloc.allocationValue)).toBeCloseTo(25000, 4);
  });

  it("creates allocation with PERCENT_OF_VALUE mode", async () => {
    const user = await createUser();
    const goal = await createGoal(user.id);
    const asset = await createAsset(user.id);

    const alloc = await createGoalAssetAllocation(goal.id, asset.id, {
      mode: "PERCENT_OF_VALUE",
      allocationValue: "0.5000",
    });

    expect(alloc.mode).toBe("PERCENT_OF_VALUE");
    expect(Number(alloc.allocationValue)).toBeCloseTo(0.5, 4);
  });

  it("rejects duplicate (goalId, assetId) with P2002", async () => {
    const user = await createUser();
    const goal = await createGoal(user.id);
    const asset = await createAsset(user.id);

    await createGoalAssetAllocation(goal.id, asset.id);

    await expect(
      createGoalAssetAllocation(goal.id, asset.id)
    ).rejects.toThrow(/Unique constraint/i);
  });

  it("supports nested include query: goal → assetAllocations → asset", async () => {
    const user = await createUser();
    const goal = await createGoal(user.id);
    const asset = await createAsset(user.id, { label: "My Asset" });
    await createGoalAssetAllocation(goal.id, asset.id);

    const result = await prisma.goal.findUnique({
      where: { id: goal.id },
      include: { assetAllocations: { include: { asset: true } } },
    });

    expect(result!.assetAllocations).toHaveLength(1);
    expect(result!.assetAllocations[0].asset.label).toBe("My Asset");
  });

  it("cascades delete from Goal to allocations", async () => {
    const user = await createUser();
    const goal = await createGoal(user.id);
    const asset = await createAsset(user.id);
    const alloc = await createGoalAssetAllocation(goal.id, asset.id);

    await prisma.goal.delete({ where: { id: goal.id } });

    const found = await prisma.goalAssetAllocation.findUnique({
      where: { id: alloc.id },
    });
    expect(found).toBeNull();
  });

  it("cascades delete from Asset to allocations but goal remains", async () => {
    const user = await createUser();
    const goal = await createGoal(user.id);
    const asset = await createAsset(user.id);
    const alloc = await createGoalAssetAllocation(goal.id, asset.id);

    await prisma.asset.delete({ where: { id: asset.id } });

    const foundAlloc = await prisma.goalAssetAllocation.findUnique({
      where: { id: alloc.id },
    });
    expect(foundAlloc).toBeNull();

    const foundGoal = await prisma.goal.findUnique({
      where: { id: goal.id },
    });
    expect(foundGoal).not.toBeNull();
  });
});
