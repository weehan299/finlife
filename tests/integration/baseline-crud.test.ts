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

function postReq(url: string, data: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

function deleteReq(url: string) {
  return new Request(url, { method: "DELETE" });
}

// ─── POST /api/baseline/assets ──────────────────────────

describe("POST /api/baseline/assets", () => {
  it("creates an asset", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);

    const { POST } = await import("@/app/api/baseline/assets/route");
    const res = await POST(
      postReq("http://localhost:3000/api/baseline/assets", {
        category: "CASH_SAVINGS",
        label: "Emergency Fund",
        value: 10000,
        isLiquid: true,
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.ok).toBe(true);
    expect(body.data.label).toBe("Emergency Fund");
    expect(body.data.value).toBeCloseTo(10000);
    expect(body.data.isLiquid).toBe(true);
    expect(body.data.id).toBeDefined();
  });

  it("rejects invalid category", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);

    const { POST } = await import("@/app/api/baseline/assets/route");
    const res = await POST(
      postReq("http://localhost:3000/api/baseline/assets", {
        category: "INVALID",
        label: "Bad",
        value: 100,
      }),
    );

    expect(res.status).toBe(400);
  });

  it("rejects missing label", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);

    const { POST } = await import("@/app/api/baseline/assets/route");
    const res = await POST(
      postReq("http://localhost:3000/api/baseline/assets", {
        category: "CASH_SAVINGS",
        value: 100,
      }),
    );

    expect(res.status).toBe(400);
  });
});

// ─── DELETE /api/baseline/assets/[id] ───────────────────

describe("DELETE /api/baseline/assets/[id]", () => {
  it("deletes an owned asset", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);
    const asset = await createAsset(user.id);

    const { DELETE } = await import("@/app/api/baseline/assets/[id]/route");
    const res = await DELETE(
      deleteReq(`http://localhost:3000/api/baseline/assets/${asset.id}`),
      { params: Promise.resolve({ id: asset.id }) },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.deleted).toBe(true);

    const dbAsset = await prisma.asset.findUnique({ where: { id: asset.id } });
    expect(dbAsset).toBeNull();
  });

  it("returns 404 for another user's asset", async () => {
    const userA = await createUser();
    const userB = await createUser();
    mockAuth(userA.clerkUserId);
    const asset = await createAsset(userB.id);

    const { DELETE } = await import("@/app/api/baseline/assets/[id]/route");
    const res = await DELETE(
      deleteReq(`http://localhost:3000/api/baseline/assets/${asset.id}`),
      { params: Promise.resolve({ id: asset.id }) },
    );

    expect(res.status).toBe(404);
  });

  it("returns 404 for non-existent ID", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);

    const { DELETE } = await import("@/app/api/baseline/assets/[id]/route");
    const res = await DELETE(
      deleteReq("http://localhost:3000/api/baseline/assets/nonexistent"),
      { params: Promise.resolve({ id: "nonexistent" }) },
    );

    expect(res.status).toBe(404);
  });
});

// ─── POST /api/baseline/liabilities ─────────────────────

describe("POST /api/baseline/liabilities", () => {
  it("creates a liability", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);

    const { POST } = await import("@/app/api/baseline/liabilities/route");
    const res = await POST(
      postReq("http://localhost:3000/api/baseline/liabilities", {
        category: "CREDIT_CARD",
        label: "Visa",
        balance: 2500,
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.ok).toBe(true);
    expect(body.data.label).toBe("Visa");
    expect(body.data.balance).toBeCloseTo(2500);
  });
});

// ─── DELETE /api/baseline/liabilities/[id] ──────────────

describe("DELETE /api/baseline/liabilities/[id]", () => {
  it("deletes an owned liability", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);
    const liability = await createLiability(user.id);

    const { DELETE } = await import(
      "@/app/api/baseline/liabilities/[id]/route"
    );
    const res = await DELETE(
      deleteReq(
        `http://localhost:3000/api/baseline/liabilities/${liability.id}`,
      ),
      { params: Promise.resolve({ id: liability.id }) },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.deleted).toBe(true);
  });

  it("returns 404 for another user's liability", async () => {
    const userA = await createUser();
    const userB = await createUser();
    mockAuth(userA.clerkUserId);
    const liability = await createLiability(userB.id);

    const { DELETE } = await import(
      "@/app/api/baseline/liabilities/[id]/route"
    );
    const res = await DELETE(
      deleteReq(
        `http://localhost:3000/api/baseline/liabilities/${liability.id}`,
      ),
      { params: Promise.resolve({ id: liability.id }) },
    );

    expect(res.status).toBe(404);
  });
});

// ─── POST /api/baseline/income ──────────────────────────

describe("POST /api/baseline/income", () => {
  it("creates an income", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);

    const { POST } = await import("@/app/api/baseline/income/route");
    const res = await POST(
      postReq("http://localhost:3000/api/baseline/income", {
        category: "SALARY",
        label: "Salary",
        monthlyAmount: 5000,
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.ok).toBe(true);
    expect(body.data.label).toBe("Salary");
    expect(body.data.monthlyAmount).toBeCloseTo(5000);
  });
});

// ─── DELETE /api/baseline/income/[id] ───────────────────

describe("DELETE /api/baseline/income/[id]", () => {
  it("deletes an owned income", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);
    const income = await createIncome(user.id);

    const { DELETE } = await import("@/app/api/baseline/income/[id]/route");
    const res = await DELETE(
      deleteReq(`http://localhost:3000/api/baseline/income/${income.id}`),
      { params: Promise.resolve({ id: income.id }) },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.deleted).toBe(true);
  });

  it("returns 404 for another user's income", async () => {
    const userA = await createUser();
    const userB = await createUser();
    mockAuth(userA.clerkUserId);
    const income = await createIncome(userB.id);

    const { DELETE } = await import("@/app/api/baseline/income/[id]/route");
    const res = await DELETE(
      deleteReq(`http://localhost:3000/api/baseline/income/${income.id}`),
      { params: Promise.resolve({ id: income.id }) },
    );

    expect(res.status).toBe(404);
  });
});

// ─── POST /api/baseline/expenses ────────────────────────

describe("POST /api/baseline/expenses", () => {
  it("creates an expense", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);

    const { POST } = await import("@/app/api/baseline/expenses/route");
    const res = await POST(
      postReq("http://localhost:3000/api/baseline/expenses", {
        category: "ESSENTIAL",
        label: "Rent",
        monthlyAmount: 1500,
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.ok).toBe(true);
    expect(body.data.label).toBe("Rent");
    expect(body.data.monthlyAmount).toBeCloseTo(1500);
  });
});

// ─── DELETE /api/baseline/expenses/[id] ─────────────────

describe("DELETE /api/baseline/expenses/[id]", () => {
  it("deletes an owned expense", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);
    const expense = await createExpense(user.id);

    const { DELETE } = await import("@/app/api/baseline/expenses/[id]/route");
    const res = await DELETE(
      deleteReq(`http://localhost:3000/api/baseline/expenses/${expense.id}`),
      { params: Promise.resolve({ id: expense.id }) },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.deleted).toBe(true);
  });

  it("returns 404 for another user's expense", async () => {
    const userA = await createUser();
    const userB = await createUser();
    mockAuth(userA.clerkUserId);
    const expense = await createExpense(userB.id);

    const { DELETE } = await import("@/app/api/baseline/expenses/[id]/route");
    const res = await DELETE(
      deleteReq(`http://localhost:3000/api/baseline/expenses/${expense.id}`),
      { params: Promise.resolve({ id: expense.id }) },
    );

    expect(res.status).toBe(404);
  });
});
