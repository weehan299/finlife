import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  currentUser: vi.fn().mockResolvedValue({ emailAddresses: [] }),
}));

import { auth } from "@clerk/nextjs/server";
import { cleanDatabase } from "../helpers/cleanup";
import { prisma } from "../helpers/prisma";
import {
  createUser,
  createAsset,
  createLiability,
  createIncome,
  createExpense,
} from "../helpers/factories";

beforeEach(cleanDatabase);

function mockAuth(clerkUserId: string | null) {
  vi.mocked(auth).mockResolvedValue({ userId: clerkUserId } as any);
}

function json(data: unknown) {
  return new Request("http://localhost:3000/api/baseline", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

function patchReq(url: string, data: unknown) {
  return new Request(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// ─── GET /api/baseline ──────────────────────────────────

describe("GET /api/baseline", () => {
  it("returns empty arrays for a new user", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);

    const { GET } = await import("@/app/api/baseline/route");
    const res = await GET(new Request("http://localhost:3000/api/baseline"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.assets).toEqual([]);
    expect(body.data.liabilities).toEqual([]);
    expect(body.data.incomes).toEqual([]);
    expect(body.data.expenses).toEqual([]);
  });

  it("returns all records for a populated user", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);
    await createAsset(user.id);
    await createLiability(user.id);
    await createIncome(user.id);
    await createExpense(user.id);

    const { GET } = await import("@/app/api/baseline/route");
    const res = await GET(new Request("http://localhost:3000/api/baseline"));
    const body = await res.json();

    expect(body.ok).toBe(true);
    expect(body.data.assets).toHaveLength(1);
    expect(body.data.liabilities).toHaveLength(1);
    expect(body.data.incomes).toHaveLength(1);
    expect(body.data.expenses).toHaveLength(1);
  });

  it("serializes Decimals as numbers", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);
    await createAsset(user.id, { value: "2500.50" });

    const { GET } = await import("@/app/api/baseline/route");
    const res = await GET(new Request("http://localhost:3000/api/baseline"));
    const body = await res.json();

    expect(typeof body.data.assets[0].value).toBe("number");
    expect(body.data.assets[0].value).toBeCloseTo(2500.5);
  });

  it("includes mode in response", async () => {
    const user = await createUser({ mode: "DETAILED" });
    mockAuth(user.clerkUserId);

    const { GET } = await import("@/app/api/baseline/route");
    const res = await GET(new Request("http://localhost:3000/api/baseline"));
    const body = await res.json();

    expect(body.data.mode).toBe("DETAILED");
  });

  it("meta.confidence is 'complete' for DETAILED mode", async () => {
    const user = await createUser({ mode: "DETAILED" });
    mockAuth(user.clerkUserId);

    const { GET } = await import("@/app/api/baseline/route");
    const res = await GET(new Request("http://localhost:3000/api/baseline"));
    const body = await res.json();

    expect(body.meta.confidence).toBe("complete");
  });

  it("meta.confidence is 'estimated' for QUICK mode", async () => {
    const user = await createUser({ mode: "QUICK" });
    mockAuth(user.clerkUserId);

    const { GET } = await import("@/app/api/baseline/route");
    const res = await GET(new Request("http://localhost:3000/api/baseline"));
    const body = await res.json();

    expect(body.meta.confidence).toBe("estimated");
  });

  it("isolates data between users", async () => {
    const userA = await createUser();
    const userB = await createUser();
    await createAsset(userA.id, { label: "A's asset" });
    await createAsset(userB.id, { label: "B's asset" });

    mockAuth(userA.clerkUserId);
    const { GET } = await import("@/app/api/baseline/route");
    const res = await GET(new Request("http://localhost:3000/api/baseline"));
    const body = await res.json();

    expect(body.data.assets).toHaveLength(1);
    expect(body.data.assets[0].label).toBe("A's asset");
  });
});

// ─── PUT /api/baseline (detailed mode) ──────────────────

describe("PUT /api/baseline (detailed)", () => {
  it("creates all record types atomically", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);

    const payload = {
      dateOfBirth: "1990-05-20",
      assets: [{ category: "CASH_SAVINGS", label: "Emergency Fund", value: 10000 }],
      liabilities: [
        { category: "CREDIT_CARD", label: "Visa", balance: 2000 },
      ],
      incomes: [
        { category: "SALARY", label: "Salary", monthlyAmount: 5000 },
      ],
      expenses: [
        {
          category: "ESSENTIAL",
          label: "Rent",
          monthlyAmount: 1500,
        },
      ],
    };

    const { PUT } = await import("@/app/api/baseline/route");
    const res = await PUT(json(payload));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.assets).toHaveLength(1);
    expect(body.data.assets[0].label).toBe("Emergency Fund");
    expect(body.data.liabilities).toHaveLength(1);
    expect(body.data.incomes).toHaveLength(1);
    expect(body.data.expenses).toHaveLength(1);
  });

  it("replaces existing records", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);
    await createAsset(user.id, { label: "Old asset" });

    const { PUT } = await import("@/app/api/baseline/route");
    const res = await PUT(
      json({
        dateOfBirth: "1990-05-20",
        assets: [{ category: "CASH_SAVINGS", label: "New asset", value: 500 }],
      }),
    );
    const body = await res.json();

    expect(body.data.assets).toHaveLength(1);
    expect(body.data.assets[0].label).toBe("New asset");

    // Verify old record is gone from DB
    const dbAssets = await prisma.asset.findMany({
      where: { userId: user.id },
    });
    expect(dbAssets).toHaveLength(1);
    expect(dbAssets[0].label).toBe("New asset");
  });

  it("rejects invalid category", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);

    const { PUT } = await import("@/app/api/baseline/route");
    const res = await PUT(
      json({
        dateOfBirth: "1990-05-20",
        assets: [{ category: "INVALID", label: "Bad", value: 100 }],
      }),
    );

    expect(res.status).toBe(400);
  });

  it("rejects missing label", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);

    const { PUT } = await import("@/app/api/baseline/route");
    const res = await PUT(
      json({
        dateOfBirth: "1990-05-20",
        assets: [{ category: "CASH_SAVINGS", value: 100 }],
      }),
    );

    expect(res.status).toBe(400);
  });

  it("rejects negative values", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);

    const { PUT } = await import("@/app/api/baseline/route");
    const res = await PUT(
      json({
        dateOfBirth: "1990-05-20",
        assets: [{ category: "CASH_SAVINGS", label: "Bad", value: -100 }],
      }),
    );

    expect(res.status).toBe(400);
  });

  it("clears records with empty arrays", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);
    await createAsset(user.id);
    await createIncome(user.id);

    const { PUT } = await import("@/app/api/baseline/route");
    const res = await PUT(json({ dateOfBirth: "1990-05-20", assets: [], incomes: [] }));
    const body = await res.json();

    expect(body.data.assets).toHaveLength(0);
    expect(body.data.incomes).toHaveLength(0);
  });

  it("does not affect another user's records", async () => {
    const userA = await createUser();
    const userB = await createUser();
    await createAsset(userB.id, { label: "B's asset" });
    mockAuth(userA.clerkUserId);

    const { PUT } = await import("@/app/api/baseline/route");
    await PUT(
      json({
        dateOfBirth: "1990-05-20",
        assets: [{ category: "CASH_SAVINGS", label: "A's new", value: 1000 }],
      }),
    );

    const bAssets = await prisma.asset.findMany({
      where: { userId: userB.id },
    });
    expect(bAssets).toHaveLength(1);
    expect(bAssets[0].label).toBe("B's asset");
  });
});

// ─── PUT /api/baseline (quick mode) ─────────────────────

describe("PUT /api/baseline (quick mode)", () => {
  it("normalizes quick fields to correct record types", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);

    const { PUT } = await import("@/app/api/baseline/route");
    const res = await PUT(
      json({
        dateOfBirth: "1990-05-20",
        totalSavings: 20000,
        totalInvestments: 50000,
        totalDebt: 10000,
        monthlyTakeHome: 6000,
        monthlyEssentialExpenses: 2000,
        monthlyDiscretionaryExpenses: 500,
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.assets).toHaveLength(2);
    expect(body.data.liabilities).toHaveLength(1);
    expect(body.data.incomes).toHaveLength(1);
    expect(body.data.expenses).toHaveLength(2);
  });

  it("sets provenance to USER_ESTIMATED", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);

    const { PUT } = await import("@/app/api/baseline/route");
    const res = await PUT(json({ dateOfBirth: "1990-05-20", totalSavings: 5000 }));
    const body = await res.json();

    expect(body.data.assets[0].provenance).toBe("USER_ESTIMATED");
  });

  it("omits records for undefined/zero fields", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);

    const { PUT } = await import("@/app/api/baseline/route");
    const res = await PUT(
      json({
        dateOfBirth: "1990-05-20",
        totalSavings: 5000,
        totalDebt: 0,
      }),
    );
    const body = await res.json();

    expect(body.data.assets).toHaveLength(1);
    expect(body.data.liabilities).toHaveLength(0);
    expect(body.data.incomes).toHaveLength(0);
    expect(body.data.expenses).toHaveLength(0);
  });

  it("replaces existing records", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);
    await createAsset(user.id, { label: "Old" });

    const { PUT } = await import("@/app/api/baseline/route");
    const res = await PUT(json({ dateOfBirth: "1990-05-20", totalSavings: 1000 }));
    const body = await res.json();

    expect(body.data.assets).toHaveLength(1);
    expect(body.data.assets[0].label).toBe("Savings");
  });
});

// ─── PUT /api/baseline — dateOfBirth ────────────────────

describe("PUT /api/baseline (dateOfBirth)", () => {
  it("persists dateOfBirth on the User record", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);

    const { PUT } = await import("@/app/api/baseline/route");
    const res = await PUT(
      json({ dateOfBirth: "1995-08-10", totalSavings: 1000 }),
    );
    expect(res.status).toBe(200);

    const updated = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    expect(updated.dateOfBirth!.toISOString().slice(0, 10)).toBe("1995-08-10");
  });

  it("rejects quick payload without dateOfBirth", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);

    const { PUT } = await import("@/app/api/baseline/route");
    const res = await PUT(json({ totalSavings: 1000 }));

    expect(res.status).toBe(400);
  });

  it("rejects detailed payload without dateOfBirth", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);

    const { PUT } = await import("@/app/api/baseline/route");
    const res = await PUT(
      json({
        assets: [{ category: "CASH_SAVINGS", label: "Test", value: 100 }],
      }),
    );

    expect(res.status).toBe(400);
  });
});

// ─── PATCH /api/baseline/assets/[id] ────────────────────

describe("PATCH /api/baseline/assets/[id]", () => {
  it("updates a single field", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);
    const asset = await createAsset(user.id, { value: "1000" });

    const { PATCH } = await import(
      "@/app/api/baseline/assets/[id]/route"
    );
    const res = await PATCH(
      patchReq(`http://localhost:3000/api/baseline/assets/${asset.id}`, {
        value: 2000,
      }),
      { params: Promise.resolve({ id: asset.id }) },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.value).toBeCloseTo(2000);
  });

  it("updates multiple fields", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);
    const asset = await createAsset(user.id);

    const { PATCH } = await import(
      "@/app/api/baseline/assets/[id]/route"
    );
    const res = await PATCH(
      patchReq(`http://localhost:3000/api/baseline/assets/${asset.id}`, {
        label: "Updated",
        isLiquid: true,
      }),
      { params: Promise.resolve({ id: asset.id }) },
    );
    const body = await res.json();

    expect(body.data.label).toBe("Updated");
    expect(body.data.isLiquid).toBe(true);
  });

  it("returns 404 for non-existent ID", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);

    const { PATCH } = await import(
      "@/app/api/baseline/assets/[id]/route"
    );
    const res = await PATCH(
      patchReq("http://localhost:3000/api/baseline/assets/nonexistent", {
        value: 100,
      }),
      { params: Promise.resolve({ id: "nonexistent" }) },
    );

    expect(res.status).toBe(404);
  });

  it("returns 404 for another user's record", async () => {
    const userA = await createUser();
    const userB = await createUser();
    mockAuth(userA.clerkUserId);
    const asset = await createAsset(userB.id);

    const { PATCH } = await import(
      "@/app/api/baseline/assets/[id]/route"
    );
    const res = await PATCH(
      patchReq(`http://localhost:3000/api/baseline/assets/${asset.id}`, {
        value: 999,
      }),
      { params: Promise.resolve({ id: asset.id }) },
    );

    expect(res.status).toBe(404);
  });
});

// ─── PATCH /api/baseline/liabilities/[id] ───────────────

describe("PATCH /api/baseline/liabilities/[id]", () => {
  it("updates a single field", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);
    const liability = await createLiability(user.id);

    const { PATCH } = await import(
      "@/app/api/baseline/liabilities/[id]/route"
    );
    const res = await PATCH(
      patchReq(
        `http://localhost:3000/api/baseline/liabilities/${liability.id}`,
        { balance: 3000 },
      ),
      { params: Promise.resolve({ id: liability.id }) },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.balance).toBeCloseTo(3000);
  });

  it("returns 404 for another user's record", async () => {
    const userA = await createUser();
    const userB = await createUser();
    mockAuth(userA.clerkUserId);
    const liability = await createLiability(userB.id);

    const { PATCH } = await import(
      "@/app/api/baseline/liabilities/[id]/route"
    );
    const res = await PATCH(
      patchReq(
        `http://localhost:3000/api/baseline/liabilities/${liability.id}`,
        { balance: 999 },
      ),
      { params: Promise.resolve({ id: liability.id }) },
    );

    expect(res.status).toBe(404);
  });
});

// ─── PATCH /api/baseline/income/[id] ────────────────────

describe("PATCH /api/baseline/income/[id]", () => {
  it("updates a single field", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);
    const income = await createIncome(user.id);

    const { PATCH } = await import(
      "@/app/api/baseline/income/[id]/route"
    );
    const res = await PATCH(
      patchReq(
        `http://localhost:3000/api/baseline/income/${income.id}`,
        { monthlyAmount: 7000 },
      ),
      { params: Promise.resolve({ id: income.id }) },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.monthlyAmount).toBeCloseTo(7000);
  });

  it("returns 404 for another user's record", async () => {
    const userA = await createUser();
    const userB = await createUser();
    mockAuth(userA.clerkUserId);
    const income = await createIncome(userB.id);

    const { PATCH } = await import(
      "@/app/api/baseline/income/[id]/route"
    );
    const res = await PATCH(
      patchReq(
        `http://localhost:3000/api/baseline/income/${income.id}`,
        { monthlyAmount: 999 },
      ),
      { params: Promise.resolve({ id: income.id }) },
    );

    expect(res.status).toBe(404);
  });
});

// ─── PATCH /api/baseline/expenses/[id] ──────────────────

describe("PATCH /api/baseline/expenses/[id]", () => {
  it("updates a single field", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);
    const expense = await createExpense(user.id);

    const { PATCH } = await import(
      "@/app/api/baseline/expenses/[id]/route"
    );
    const res = await PATCH(
      patchReq(
        `http://localhost:3000/api/baseline/expenses/${expense.id}`,
        { monthlyAmount: 2000 },
      ),
      { params: Promise.resolve({ id: expense.id }) },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.monthlyAmount).toBeCloseTo(2000);
  });

  it("returns 404 for another user's record", async () => {
    const userA = await createUser();
    const userB = await createUser();
    mockAuth(userA.clerkUserId);
    const expense = await createExpense(userB.id);

    const { PATCH } = await import(
      "@/app/api/baseline/expenses/[id]/route"
    );
    const res = await PATCH(
      patchReq(
        `http://localhost:3000/api/baseline/expenses/${expense.id}`,
        { monthlyAmount: 999 },
      ),
      { params: Promise.resolve({ id: expense.id }) },
    );

    expect(res.status).toBe(404);
  });

  it("validates partial schema", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);
    const expense = await createExpense(user.id);

    const { PATCH } = await import(
      "@/app/api/baseline/expenses/[id]/route"
    );
    const res = await PATCH(
      patchReq(
        `http://localhost:3000/api/baseline/expenses/${expense.id}`,
        { category: "INVALID_CATEGORY" },
      ),
      { params: Promise.resolve({ id: expense.id }) },
    );

    expect(res.status).toBe(400);
  });
});
