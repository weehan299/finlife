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
  createGoal,
  createAsset,
  createGoalAssetAllocation,
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

function patchReq(url: string, data: unknown) {
  return new Request(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

function deleteReq(url: string) {
  return new Request(url, { method: "DELETE" });
}

function getReq(url: string) {
  return new Request(url, { method: "GET" });
}

// ─── POST /api/goals ────────────────────────────────────

describe("POST /api/goals", () => {
  it("creates a goal", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);

    const { POST } = await import("@/app/api/goals/route");
    const res = await POST(
      postReq("http://localhost:3000/api/goals", {
        type: "SAVINGS",
        name: "Emergency Fund",
        targetAmount: 25000,
        monthlyContribution: 500,
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.ok).toBe(true);
    expect(body.data.name).toBe("Emergency Fund");
    expect(body.data.targetAmount).toBeCloseTo(25000);
    expect(body.data.type).toBe("SAVINGS");
    expect(body.data.id).toBeDefined();
  });

  it("rejects invalid type", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);

    const { POST } = await import("@/app/api/goals/route");
    const res = await POST(
      postReq("http://localhost:3000/api/goals", {
        type: "INVALID",
        name: "Bad Goal",
        targetAmount: 1000,
      }),
    );

    expect(res.status).toBe(400);
  });

  it("rejects missing name", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);

    const { POST } = await import("@/app/api/goals/route");
    const res = await POST(
      postReq("http://localhost:3000/api/goals", {
        type: "SAVINGS",
        targetAmount: 1000,
      }),
    );

    expect(res.status).toBe(400);
  });

  it("rejects negative targetAmount", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);

    const { POST } = await import("@/app/api/goals/route");
    const res = await POST(
      postReq("http://localhost:3000/api/goals", {
        type: "SAVINGS",
        name: "Bad",
        targetAmount: -100,
      }),
    );

    expect(res.status).toBe(400);
  });
});

// ─── GET /api/goals ─────────────────────────────────────

describe("GET /api/goals", () => {
  it("returns goals with progress", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);
    await createGoal(user.id, {
      name: "Retirement",
      type: "RETIREMENT",
      targetAmount: "100000.00",
      monthlyContribution: "1000.00",
      startingAmount: "10000.00",
    });

    const { GET } = await import("@/app/api/goals/route");
    const res = await GET(getReq("http://localhost:3000/api/goals"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe("Retirement");
    expect(body.data[0].progress).toBeDefined();
    expect(body.data[0].progress.currentAmount).toBeCloseTo(10000);
    expect(body.data[0].progress.percentComplete).toBeCloseTo(10);
  });

  it("returns empty for new user", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);

    const { GET } = await import("@/app/api/goals/route");
    const res = await GET(getReq("http://localhost:3000/api/goals"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(0);
  });
});

// ─── GET /api/goals/[id] ────────────────────────────────

describe("GET /api/goals/[id]", () => {
  it("returns single goal with progress", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);
    const goal = await createGoal(user.id, {
      name: "My Savings",
      startingAmount: "5000.00",
    });

    const { GET } = await import("@/app/api/goals/[id]/route");
    const res = await GET(
      getReq(`http://localhost:3000/api/goals/${goal.id}`),
      { params: Promise.resolve({ id: goal.id }) },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.name).toBe("My Savings");
    expect(body.data.progress).toBeDefined();
    expect(body.data.impacts).toBeDefined();
  });

  it("returns 404 for other user's goal", async () => {
    const userA = await createUser();
    const userB = await createUser();
    mockAuth(userA.clerkUserId);
    const goal = await createGoal(userB.id);

    const { GET } = await import("@/app/api/goals/[id]/route");
    const res = await GET(
      getReq(`http://localhost:3000/api/goals/${goal.id}`),
      { params: Promise.resolve({ id: goal.id }) },
    );

    expect(res.status).toBe(404);
  });
});

// ─── PATCH /api/goals/[id] ──────────────────────────────

describe("PATCH /api/goals/[id]", () => {
  it("updates a goal", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);
    const goal = await createGoal(user.id);

    const { PATCH } = await import("@/app/api/goals/[id]/route");
    const res = await PATCH(
      patchReq(`http://localhost:3000/api/goals/${goal.id}`, {
        name: "Updated Goal",
        targetAmount: 75000,
      }),
      { params: Promise.resolve({ id: goal.id }) },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.name).toBe("Updated Goal");
    expect(body.data.targetAmount).toBeCloseTo(75000);
  });

  it("returns 404 for other user's goal", async () => {
    const userA = await createUser();
    const userB = await createUser();
    mockAuth(userA.clerkUserId);
    const goal = await createGoal(userB.id);

    const { PATCH } = await import("@/app/api/goals/[id]/route");
    const res = await PATCH(
      patchReq(`http://localhost:3000/api/goals/${goal.id}`, {
        name: "Hacked",
      }),
      { params: Promise.resolve({ id: goal.id }) },
    );

    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/goals/[id] ─────────────────────────────

describe("DELETE /api/goals/[id]", () => {
  it("deletes an owned goal", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);
    const goal = await createGoal(user.id);

    const { DELETE } = await import("@/app/api/goals/[id]/route");
    const res = await DELETE(
      deleteReq(`http://localhost:3000/api/goals/${goal.id}`),
      { params: Promise.resolve({ id: goal.id }) },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.deleted).toBe(true);

    const dbGoal = await prisma.goal.findUnique({ where: { id: goal.id } });
    expect(dbGoal).toBeNull();
  });

  it("returns 404 for non-existent goal", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);

    const { DELETE } = await import("@/app/api/goals/[id]/route");
    const res = await DELETE(
      deleteReq("http://localhost:3000/api/goals/nonexistent"),
      { params: Promise.resolve({ id: "nonexistent" }) },
    );

    expect(res.status).toBe(404);
  });
});

// ─── POST /api/goals/[id]/allocations ───────────────────

describe("POST /api/goals/[id]/allocations", () => {
  it("adds an allocation", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);
    const goal = await createGoal(user.id);
    const asset = await createAsset(user.id, { label: "Savings Account", value: "20000.00" });

    const { POST } = await import("@/app/api/goals/[id]/allocations/route");
    const res = await POST(
      postReq(`http://localhost:3000/api/goals/${goal.id}/allocations`, {
        assetId: asset.id,
        mode: "FULL_VALUE",
      }),
      { params: Promise.resolve({ id: goal.id }) },
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.ok).toBe(true);
    expect(body.data.assetId).toBe(asset.id);
    expect(body.data.mode).toBe("FULL_VALUE");
  });

  it("rejects other user's asset", async () => {
    const userA = await createUser();
    const userB = await createUser();
    mockAuth(userA.clerkUserId);
    const goal = await createGoal(userA.id);
    const asset = await createAsset(userB.id);

    const { POST } = await import("@/app/api/goals/[id]/allocations/route");
    const res = await POST(
      postReq(`http://localhost:3000/api/goals/${goal.id}/allocations`, {
        assetId: asset.id,
        mode: "FULL_VALUE",
      }),
      { params: Promise.resolve({ id: goal.id }) },
    );

    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/goals/[id]/allocations/[allocId] ───────

describe("DELETE /api/goals/[id]/allocations/[allocId]", () => {
  it("removes an allocation", async () => {
    const user = await createUser();
    mockAuth(user.clerkUserId);
    const goal = await createGoal(user.id);
    const asset = await createAsset(user.id);
    const allocation = await createGoalAssetAllocation(goal.id, asset.id);

    const { DELETE } = await import(
      "@/app/api/goals/[id]/allocations/[allocId]/route"
    );
    const res = await DELETE(
      deleteReq(
        `http://localhost:3000/api/goals/${goal.id}/allocations/${allocation.id}`,
      ),
      { params: Promise.resolve({ id: goal.id, allocId: allocation.id }) },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.deleted).toBe(true);
  });
});
