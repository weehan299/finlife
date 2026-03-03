import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "../helpers/prisma";
import { cleanDatabase } from "../helpers/cleanup";
import {
  createUser,
  createUserWithSettings,
  createAsset,
  createLiability,
  createIncome,
  createExpense,
  createGoal,
  createGoalAssetAllocation,
  createDecision,
  createDecisionGoalImpact,
} from "../helpers/factories";

beforeEach(cleanDatabase);

async function createFullUserGraph(suffix: string) {
  const user = await createUserWithSettings(
    { displayName: `User ${suffix}`, onboardingComplete: true, mode: "DETAILED" },
    { inflationRate: "0.0300" }
  );

  const asset1 = await createAsset(user.id, {
    category: "CASH_CHECKING",
    label: `Checking ${suffix}`,
  });
  const asset2 = await createAsset(user.id, {
    category: "INVESTMENTS",
    label: `Investment ${suffix}`,
  });

  const liability = await createLiability(user.id, {
    label: `Liability ${suffix}`,
  });
  const income = await createIncome(user.id, {
    label: `Income ${suffix}`,
  });
  const expense = await createExpense(user.id, {
    label: `Expense ${suffix}`,
  });

  const goal1 = await createGoal(user.id, { name: `Goal A ${suffix}` });
  const goal2 = await createGoal(user.id, { name: `Goal B ${suffix}` });

  const alloc = await createGoalAssetAllocation(goal1.id, asset1.id);

  const decision = await createDecision(user.id, {
    name: `Decision ${suffix}`,
  });
  const impact = await createDecisionGoalImpact(decision.id, goal1.id);

  return { user, assets: [asset1, asset2], liability, income, expense, goals: [goal1, goal2], alloc, decision, impact };
}

describe("Cascade Delete", () => {
  it("deleting a user removes all related records across all 10 models", async () => {
    const { user } = await createFullUserGraph("A");

    await prisma.user.delete({ where: { id: user.id } });

    // Verify every related table is empty
    expect(await prisma.userSettings.count({ where: { userId: user.id } })).toBe(0);
    expect(await prisma.asset.count({ where: { userId: user.id } })).toBe(0);
    expect(await prisma.liability.count({ where: { userId: user.id } })).toBe(0);
    expect(await prisma.income.count({ where: { userId: user.id } })).toBe(0);
    expect(await prisma.expense.count({ where: { userId: user.id } })).toBe(0);
    expect(await prisma.goal.count({ where: { userId: user.id } })).toBe(0);
    expect(await prisma.decision.count({ where: { userId: user.id } })).toBe(0);

    // Join tables — check by specific IDs since they don't have userId
    expect(await prisma.goalAssetAllocation.count()).toBe(0);
    expect(await prisma.decisionGoalImpact.count()).toBe(0);
  });

  it("two-user isolation: deleting user 1 leaves user 2 data intact", async () => {
    const graph1 = await createFullUserGraph("1");
    const graph2 = await createFullUserGraph("2");

    await prisma.user.delete({ where: { id: graph1.user.id } });

    // User 1 gone
    expect(await prisma.user.findUnique({ where: { id: graph1.user.id } })).toBeNull();

    // User 2 fully intact
    expect(await prisma.user.findUnique({ where: { id: graph2.user.id } })).not.toBeNull();
    expect(await prisma.userSettings.count({ where: { userId: graph2.user.id } })).toBe(1);
    expect(await prisma.asset.count({ where: { userId: graph2.user.id } })).toBe(2);
    expect(await prisma.liability.count({ where: { userId: graph2.user.id } })).toBe(1);
    expect(await prisma.income.count({ where: { userId: graph2.user.id } })).toBe(1);
    expect(await prisma.expense.count({ where: { userId: graph2.user.id } })).toBe(1);
    expect(await prisma.goal.count({ where: { userId: graph2.user.id } })).toBe(2);
    expect(await prisma.decision.count({ where: { userId: graph2.user.id } })).toBe(1);
    expect(
      await prisma.goalAssetAllocation.count({
        where: { goal: { userId: graph2.user.id } },
      })
    ).toBe(1);
    expect(
      await prisma.decisionGoalImpact.count({
        where: { decision: { userId: graph2.user.id } },
      })
    ).toBe(1);
  });
});
