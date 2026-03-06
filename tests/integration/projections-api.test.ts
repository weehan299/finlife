import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  currentUser: vi.fn().mockResolvedValue({ emailAddresses: [] }),
}));

import { auth } from "@clerk/nextjs/server";
import { cleanDatabase } from "../helpers/cleanup";
import {
  createUser,
  createUserWithSettings,
  createAsset,
  createLiability,
  createIncome,
  createExpense,
} from "../helpers/factories";

beforeEach(cleanDatabase);

function mockAuth(clerkUserId: string | null) {
  vi.mocked(auth).mockResolvedValue({ userId: clerkUserId } as any);
}

function getReq() {
  return new Request("http://localhost:3000/api/projections");
}

// ─── GET /api/projections ──────────────────────────────────

describe("GET /api/projections", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth(null);

    const { GET } = await import("@/app/api/projections/route");
    const res = await GET(getReq());

    expect(res.status).toBe(401);
  });

  it("returns milestones for user with financial data", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);

    await createAsset(user.id, { value: "100000.00" });
    await createLiability(user.id, { balance: "20000.00" });
    await createIncome(user.id, { monthlyAmount: "8000.00" });
    await createExpense(user.id, { monthlyAmount: "5000.00" });

    const { GET } = await import("@/app/api/projections/route");
    const res = await GET(getReq());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.currentNetWorth).toBe(80000);
    expect(body.data.milestones).toHaveLength(5); // 1, 5, 10, 20 + retirement (user has dateOfBirth)
    expect(body.data.milestones[0].label).toBe("1 Year");
    expect(body.data.milestones[0].months).toBe(12);
  });

  it("net worth increases over time for positive surplus", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);

    await createAsset(user.id, { value: "50000.00" });
    await createIncome(user.id, { monthlyAmount: "5000.00" });
    await createExpense(user.id, { monthlyAmount: "3000.00" });

    const { GET } = await import("@/app/api/projections/route");
    const res = await GET(getReq());
    const body = await res.json();

    const milestones = body.data.milestones;
    for (let i = 1; i < milestones.length; i++) {
      expect(milestones[i].netWorth).toBeGreaterThan(milestones[i - 1].netWorth);
    }
  });

  it("includes retirement milestone when user has dateOfBirth", async () => {
    const user = await createUser({ dateOfBirth: new Date("1990-01-15") });
    mockAuth(user.clerkUserId);

    await createAsset(user.id, { value: "10000.00" });

    const { GET } = await import("@/app/api/projections/route");
    const res = await GET(getReq());
    const body = await res.json();

    const retirementMilestone = body.data.milestones.find((m: any) =>
      m.label.startsWith("Retirement"),
    );
    expect(retirementMilestone).toBeDefined();
    expect(retirementMilestone.label).toContain("age 65");
    expect(body.data.currentAge).toBeGreaterThan(0);
  });

  it("omits retirement milestone when dateOfBirth is null", async () => {
    const user = await createUser({ dateOfBirth: null });
    mockAuth(user.clerkUserId);

    await createAsset(user.id, { value: "10000.00" });

    const { GET } = await import("@/app/api/projections/route");
    const res = await GET(getReq());
    const body = await res.json();

    expect(body.data.milestones).toHaveLength(4); // 1, 5, 10, 20 only
    expect(body.data.currentAge).toBeNull();
    const retirementMilestone = body.data.milestones.find((m: any) =>
      m.label.startsWith("Retirement"),
    );
    expect(retirementMilestone).toBeUndefined();
  });

  it("handles user with no financial data", async () => {
    const user = await createUser({ dateOfBirth: null });
    mockAuth(user.clerkUserId);

    const { GET } = await import("@/app/api/projections/route");
    const res = await GET(getReq());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.currentNetWorth).toBe(0);
    body.data.milestones.forEach((m: any) => {
      expect(m.netWorth).toBe(0);
    });
  });

  it("uses custom retirementAge from settings", async () => {
    const user = await createUserWithSettings(
      { dateOfBirth: new Date("1990-01-15") },
      { retirementAge: 60 },
    );
    mockAuth(user.clerkUserId);

    await createAsset(user.id, { value: "10000.00" });

    const { GET } = await import("@/app/api/projections/route");
    const res = await GET(getReq());
    const body = await res.json();

    expect(body.data.retirementAge).toBe(60);
    const retirementMilestone = body.data.milestones.find((m: any) =>
      m.label.startsWith("Retirement"),
    );
    expect(retirementMilestone).toBeDefined();
    expect(retirementMilestone.label).toContain("age 60");
  });
});

// ─── projectNetWorth (pure function) ────────────────────────

describe("projectNetWorth", () => {
  it("computes compound growth correctly", async () => {
    const { projectNetWorth } = await import("@/services/projection.service");

    const result = projectNetWorth(100000, 1000, 0.05, [12]);
    // FV of lump sum: 100000 * (1 + monthlyRate)^12 ≈ 105000
    // FV of annuity: 1000 * ((1 + monthlyRate)^12 - 1) / monthlyRate ≈ 12279
    expect(result[0].netWorth).toBeGreaterThan(116000);
    expect(result[0].netWorth).toBeLessThan(118000);
  });

  it("handles zero surplus", async () => {
    const { projectNetWorth } = await import("@/services/projection.service");

    const result = projectNetWorth(100000, 0, 0.05, [12]);
    // Only compound growth on principal: 100000 * (1+0.05)^(12/12) = 105000
    expect(result[0].netWorth).toBe(105000);
  });

  it("handles zero growth rate", async () => {
    const { projectNetWorth } = await import("@/services/projection.service");

    const result = projectNetWorth(100000, 1000, 0, [12]);
    expect(result[0].netWorth).toBe(112000);
  });

  it("handles negative surplus", async () => {
    const { projectNetWorth } = await import("@/services/projection.service");

    const result = projectNetWorth(100000, -2000, 0, [12]);
    expect(result[0].netWorth).toBe(76000);
  });
});
