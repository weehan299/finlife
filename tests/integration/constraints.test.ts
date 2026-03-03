import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "../helpers/prisma";
import { cleanDatabase } from "../helpers/cleanup";
import {
  createUser,
  createAsset,
  createGoal,
  createDecision,
} from "../helpers/factories";

beforeEach(cleanDatabase);

describe("Required field violations", () => {
  it("rejects User without clerkUserId", async () => {
    await expect(
      prisma.user.create({ data: {} as any })
    ).rejects.toThrow();
  });

  it("rejects Asset without label", async () => {
    const user = await createUser();
    await expect(
      prisma.asset.create({
        data: {
          userId: user.id,
          category: "CASH_CHECKING",
          value: "100.00",
        } as any,
      })
    ).rejects.toThrow();
  });

  it("rejects Decision without inputs", async () => {
    const user = await createUser();
    await expect(
      prisma.decision.create({
        data: {
          userId: user.id,
          template: "HOME_PURCHASE",
          name: "No inputs",
        } as any,
      })
    ).rejects.toThrow();
  });
});

describe("Foreign key violations", () => {
  it("rejects Asset with nonexistent userId", async () => {
    await expect(
      prisma.asset.create({
        data: {
          userId: "nonexistent_cuid_12345",
          category: "CASH_CHECKING",
          label: "Orphan",
          value: "100.00",
        },
      })
    ).rejects.toThrow();
  });

  it("rejects GoalAssetAllocation with nonexistent goalId", async () => {
    const user = await createUser();
    const asset = await createAsset(user.id);

    await expect(
      prisma.goalAssetAllocation.create({
        data: {
          goalId: "nonexistent_cuid_12345",
          assetId: asset.id,
          mode: "FULL_VALUE",
        },
      })
    ).rejects.toThrow();
  });
});

describe("Invalid enum via raw SQL", () => {
  it("rejects invalid enum value at the database level", async () => {
    const user = await createUser();

    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO "Asset" (id, "userId", category, label, value, "isLiquid", provenance, "createdAt", "updatedAt")
         VALUES ('test_id', $1, 'INVALID_CATEGORY', 'Bad', 100.00, false, 'USER_ENTERED', NOW(), NOW())`,
        user.id
      )
    ).rejects.toThrow();
  });
});

describe("Decimal overflow", () => {
  it("rejects value exceeding Decimal(14,2) capacity", async () => {
    const user = await createUser();

    // Decimal(14,2) max is 999999999999.99 (12 digits before decimal + 2 after)
    // 10000000000000.00 (13 digits before decimal) should overflow
    await expect(
      createAsset(user.id, { value: "10000000000000.00" })
    ).rejects.toThrow();
  });

  it("rejects rate exceeding Decimal(5,4) capacity", async () => {
    const user = await createUser();

    // Decimal(5,4) max is 9.9999 (1 digit before decimal + 4 after)
    // 10.0000 should overflow
    await expect(
      createAsset(user.id, { annualGrowthRateOverride: "10.0000" })
    ).rejects.toThrow();
  });
});

describe("Concurrent unique constraint", () => {
  it("two users with same clerkUserId — exactly one P2002", async () => {
    const clerkId = "clerk_concurrent_test";

    const results = await Promise.allSettled([
      prisma.user.create({ data: { clerkUserId: clerkId } }),
      prisma.user.create({ data: { clerkUserId: clerkId } }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
  });
});
