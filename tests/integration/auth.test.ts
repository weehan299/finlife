import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

import { auth, currentUser } from "@clerk/nextjs/server";
import { requireAuth, requireAuthContext } from "@/lib/auth";
import { ApiError } from "@/lib/api/error";
import { prisma } from "../helpers/prisma";
import { cleanDatabase } from "../helpers/cleanup";

beforeEach(cleanDatabase);

function mockAuth(userId: string | null) {
  vi.mocked(auth).mockResolvedValue({ userId } as any);
}

function mockCurrentUser(email: string | null) {
  vi.mocked(currentUser).mockResolvedValue(
    email
      ? ({ emailAddresses: [{ emailAddress: email }] } as any)
      : null,
  );
}

describe("requireAuth", () => {
  it("throws ApiError 401 + UNAUTHORIZED when Clerk returns no userId", async () => {
    mockAuth(null);
    await expect(requireAuth()).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHORIZED",
    });
  });

  it("creates a User row in DB on first call", async () => {
    mockAuth("clerk_test_new_user");
    const userId = await requireAuth();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user).not.toBeNull();
    expect(user!.clerkUserId).toBe("clerk_test_new_user");
  });

  it("upserts idempotently — second call with same Clerk ID does not create a duplicate", async () => {
    mockAuth("clerk_test_idempotent");
    await requireAuth();
    await requireAuth();

    const count = await prisma.user.count({
      where: { clerkUserId: "clerk_test_idempotent" },
    });
    expect(count).toBe(1);
  });

  it("returns the same internal userId on repeated calls", async () => {
    mockAuth("clerk_test_stable_id");
    const id1 = await requireAuth();
    const id2 = await requireAuth();
    expect(id1).toBe(id2);
  });
});

describe("requireAuthContext", () => {
  it("throws 401 when unauthenticated", async () => {
    mockAuth(null);
    await expect(requireAuthContext()).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHORIZED",
    });
  });

  it("returns both clerkUserId and internal userId", async () => {
    mockAuth("clerk_test_ctx_user");
    const ctx = await requireAuthContext();
    expect(ctx.clerkUserId).toBe("clerk_test_ctx_user");
    expect(typeof ctx.userId).toBe("string");
    expect(ctx.userId.length).toBeGreaterThan(0);
  });

  it("internal userId corresponds to an actual DB record with matching clerkUserId", async () => {
    mockAuth("clerk_test_db_record");
    const ctx = await requireAuthContext();

    const user = await prisma.user.findUnique({ where: { id: ctx.userId } });
    expect(user).not.toBeNull();
    expect(user!.clerkUserId).toBe(ctx.clerkUserId);
  });

  it("two distinct Clerk IDs produce two distinct users in the DB", async () => {
    mockAuth("clerk_test_user_a");
    const ctx1 = await requireAuthContext();

    mockAuth("clerk_test_user_b");
    const ctx2 = await requireAuthContext();

    expect(ctx1.userId).not.toBe(ctx2.userId);
    expect(ctx1.clerkUserId).not.toBe(ctx2.clerkUserId);

    const count = await prisma.user.count();
    expect(count).toBe(2);
  });

  it("stores email from Clerk on first auth call", async () => {
    mockAuth("clerk_test_email_user");
    mockCurrentUser("alice@example.com");

    const ctx = await requireAuthContext();
    const user = await prisma.user.findUnique({ where: { id: ctx.userId } });

    expect(user!.email).toBe("alice@example.com");
  });

  it("updates email on subsequent calls when changed in Clerk", async () => {
    mockAuth("clerk_test_email_update");
    mockCurrentUser("old@example.com");
    await requireAuthContext();

    mockCurrentUser("new@example.com");
    const ctx = await requireAuthContext();
    const user = await prisma.user.findUnique({ where: { id: ctx.userId } });

    expect(user!.email).toBe("new@example.com");
  });

  it("stores null email when Clerk user has no email addresses", async () => {
    mockAuth("clerk_test_no_email");
    vi.mocked(currentUser).mockResolvedValue({ emailAddresses: [] } as any);

    const ctx = await requireAuthContext();
    const user = await prisma.user.findUnique({ where: { id: ctx.userId } });

    expect(user!.email).toBeNull();
  });
});
