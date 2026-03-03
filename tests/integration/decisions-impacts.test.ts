import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "../helpers/prisma";
import { cleanDatabase } from "../helpers/cleanup";
import {
  createUser,
  createGoal,
  createDecision,
  createDecisionGoalImpact,
} from "../helpers/factories";

beforeEach(cleanDatabase);

describe("Decision", () => {
  it("defaults status to DRAFT, verdict and confidence to null", async () => {
    const user = await createUser();
    const decision = await createDecision(user.id);

    expect(decision.status).toBe("DRAFT");
    expect(decision.verdict).toBeNull();
    expect(decision.confidenceLevel).toBeNull();
    expect(decision.evaluatedAt).toBeNull();
  });

  it("stores and retrieves complex JSON inputs", async () => {
    const user = await createUser();
    const complexInputs = {
      purchasePrice: 400000,
      breakdown: { principal: 320000, interest: 80000 },
      tags: ["housing", "investment"],
      nested: { deep: { value: true } },
    };

    const decision = await createDecision(user.id, { inputs: complexInputs });
    const found = await prisma.decision.findUnique({
      where: { id: decision.id },
    });

    expect(found!.inputs).toEqual(complexInputs);
  });

  it("stores and retrieves JSON snapshots", async () => {
    const user = await createUser();
    const assumptions = { inflationRate: 0.025, growthRate: 0.07 };
    const baseline = { netWorth: 500000, monthlySurplus: 3000 };
    const result = { projectedNetWorth: 650000, monthsToBreakeven: 48 };

    const decision = await createDecision(user.id, {
      assumptionsSnapshot: assumptions,
      baselineSnapshot: baseline,
      resultSnapshot: result,
    });

    const found = await prisma.decision.findUnique({
      where: { id: decision.id },
    });
    expect(found!.assumptionsSnapshot).toEqual(assumptions);
    expect(found!.baselineSnapshot).toEqual(baseline);
    expect(found!.resultSnapshot).toEqual(result);
  });

  it("supports status workflow: DRAFT → EVALUATED → ARCHIVED", async () => {
    const user = await createUser();
    const decision = await createDecision(user.id);
    expect(decision.status).toBe("DRAFT");

    const evaluated = await prisma.decision.update({
      where: { id: decision.id },
      data: {
        status: "EVALUATED",
        verdict: "PASS",
        confidenceLevel: "HIGH",
        evaluatedAt: new Date(),
      },
    });
    expect(evaluated.status).toBe("EVALUATED");
    expect(evaluated.verdict).toBe("PASS");
    expect(evaluated.confidenceLevel).toBe("HIGH");
    expect(evaluated.evaluatedAt).toBeInstanceOf(Date);

    const archived = await prisma.decision.update({
      where: { id: decision.id },
      data: { status: "ARCHIVED" },
    });
    expect(archived.status).toBe("ARCHIVED");
  });

  it("creates decisions with all 6 DecisionTemplate values", async () => {
    const user = await createUser();
    const templates = [
      "HOME_PURCHASE",
      "NEW_LOAN",
      "LARGE_PURCHASE",
      "INCOME_LOSS",
      "RECURRING_EXPENSE",
      "ONE_TIME_EXPENSE",
    ] as const;

    for (const template of templates) {
      const d = await createDecision(user.id, {
        template,
        name: `${template} decision`,
      });
      expect(d.template).toBe(template);
    }

    const count = await prisma.decision.count({ where: { userId: user.id } });
    expect(count).toBe(6);
  });

  it("persists all 3 DecisionVerdict values", async () => {
    const user = await createUser();
    const verdicts = ["PASS", "CAUTION", "FAIL"] as const;

    for (const verdict of verdicts) {
      const d = await createDecision(user.id, {
        status: "EVALUATED",
        verdict,
        confidenceLevel: "HIGH",
        evaluatedAt: new Date(),
        name: `${verdict} decision`,
      });
      expect(d.verdict).toBe(verdict);
    }
  });

  it("persists all 3 OutputConfidence values", async () => {
    const user = await createUser();
    const levels = ["HIGH", "MEDIUM", "LOW"] as const;

    for (const cl of levels) {
      const d = await createDecision(user.id, {
        status: "EVALUATED",
        verdict: "PASS",
        confidenceLevel: cl,
        evaluatedAt: new Date(),
        name: `${cl} decision`,
      });
      expect(d.confidenceLevel).toBe(cl);
    }
  });

  it("queries by composite index (userId, template, updatedAt)", async () => {
    const user = await createUser();
    await createDecision(user.id, {
      template: "HOME_PURCHASE",
      name: "HP",
    });
    await createDecision(user.id, {
      template: "NEW_LOAN",
      name: "NL",
    });

    const results = await prisma.decision.findMany({
      where: { userId: user.id, template: "HOME_PURCHASE" },
      orderBy: { updatedAt: "desc" },
    });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("HP");
  });

  it("queries by composite index (userId, status, updatedAt)", async () => {
    const user = await createUser();
    await createDecision(user.id, { name: "Draft 1" });
    await createDecision(user.id, {
      name: "Evaluated",
      status: "EVALUATED",
      verdict: "PASS",
      confidenceLevel: "HIGH",
      evaluatedAt: new Date(),
    });

    const drafts = await prisma.decision.findMany({
      where: { userId: user.id, status: "DRAFT" },
      orderBy: { updatedAt: "desc" },
    });
    expect(drafts).toHaveLength(1);
    expect(drafts[0].name).toBe("Draft 1");
  });
});

describe("DecisionGoalImpact", () => {
  it("creates impact with all fields populated", async () => {
    const user = await createUser();
    const goal = await createGoal(user.id);
    const decision = await createDecision(user.id);

    const impact = await createDecisionGoalImpact(decision.id, goal.id, {
      projectedDelayMonths: 6,
      projectedTargetDate: new Date("2030-06-01"),
      deltaToTarget: "-5000.00",
      impactSnapshot: { reduced: true, months: 6 },
    });

    expect(impact.projectedDelayMonths).toBe(6);
    expect(impact.projectedTargetDate).toBeInstanceOf(Date);
    expect(Number(impact.deltaToTarget)).toBeCloseTo(-5000, 2);
    expect(impact.impactSnapshot).toEqual({ reduced: true, months: 6 });
  });

  it("creates impact with all optional fields null", async () => {
    const user = await createUser();
    const goal = await createGoal(user.id);
    const decision = await createDecision(user.id);

    const impact = await createDecisionGoalImpact(decision.id, goal.id);

    expect(impact.projectedDelayMonths).toBeNull();
    expect(impact.projectedTargetDate).toBeNull();
    expect(impact.deltaToTarget).toBeNull();
    expect(impact.impactSnapshot).toBeNull();
  });

  it("rejects duplicate (decisionId, goalId) with P2002", async () => {
    const user = await createUser();
    const goal = await createGoal(user.id);
    const decision = await createDecision(user.id);

    await createDecisionGoalImpact(decision.id, goal.id);

    await expect(
      createDecisionGoalImpact(decision.id, goal.id)
    ).rejects.toThrow(/Unique constraint/i);
  });

  it("cascades delete from Decision to impacts", async () => {
    const user = await createUser();
    const goal = await createGoal(user.id);
    const decision = await createDecision(user.id);
    const impact = await createDecisionGoalImpact(decision.id, goal.id);

    await prisma.decision.delete({ where: { id: decision.id } });

    const found = await prisma.decisionGoalImpact.findUnique({
      where: { id: impact.id },
    });
    expect(found).toBeNull();
  });

  it("cascades delete from Goal to impacts but decision remains", async () => {
    const user = await createUser();
    const goal = await createGoal(user.id);
    const decision = await createDecision(user.id);
    const impact = await createDecisionGoalImpact(decision.id, goal.id);

    await prisma.goal.delete({ where: { id: goal.id } });

    const foundImpact = await prisma.decisionGoalImpact.findUnique({
      where: { id: impact.id },
    });
    expect(foundImpact).toBeNull();

    const foundDecision = await prisma.decision.findUnique({
      where: { id: decision.id },
    });
    expect(foundDecision).not.toBeNull();
  });
});
