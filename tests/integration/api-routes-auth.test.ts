import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  currentUser: vi.fn().mockResolvedValue({ emailAddresses: [] }),
}));

import { auth } from "@clerk/nextjs/server";
import { cleanDatabase } from "../helpers/cleanup";

beforeEach(cleanDatabase);

function mockAuth(userId: string | null) {
  vi.mocked(auth).mockResolvedValue({ userId } as any);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteModule = Record<string, (...args: any[]) => Promise<Response>>;

type RouteEntry = {
  path: string;
  method: string;
  module: string;
  params?: Promise<{ id: string }>;
};

const routes: RouteEntry[] = [
  { path: "/api/settings", method: "GET", module: "@/app/api/settings/route" },
  { path: "/api/settings", method: "PUT", module: "@/app/api/settings/route" },
  { path: "/api/goals", method: "GET", module: "@/app/api/goals/route" },
  { path: "/api/goals", method: "POST", module: "@/app/api/goals/route" },
  { path: "/api/decisions", method: "GET", module: "@/app/api/decisions/route" },
  { path: "/api/decisions", method: "POST", module: "@/app/api/decisions/route" },
  { path: "/api/snapshot", method: "GET", module: "@/app/api/snapshot/route" },
  { path: "/api/baseline", method: "GET", module: "@/app/api/baseline/route" },
  { path: "/api/baseline", method: "PUT", module: "@/app/api/baseline/route" },
  {
    path: "/api/baseline/assets/fake-id",
    method: "PATCH",
    module: "@/app/api/baseline/assets/[id]/route",
    params: Promise.resolve({ id: "fake-id" }),
  },
  {
    path: "/api/baseline/liabilities/fake-id",
    method: "PATCH",
    module: "@/app/api/baseline/liabilities/[id]/route",
    params: Promise.resolve({ id: "fake-id" }),
  },
  {
    path: "/api/baseline/income/fake-id",
    method: "PATCH",
    module: "@/app/api/baseline/income/[id]/route",
    params: Promise.resolve({ id: "fake-id" }),
  },
  {
    path: "/api/baseline/expenses/fake-id",
    method: "PATCH",
    module: "@/app/api/baseline/expenses/[id]/route",
    params: Promise.resolve({ id: "fake-id" }),
  },
];

describe("API route auth guards", () => {
  describe.each(routes)("$method $path", ({ path, method, module: mod, params }) => {
    it("returns 401 UNAUTHORIZED when not authenticated", async () => {
      mockAuth(null);

      const routeModule: RouteModule = await import(mod);
      const handler = routeModule[method];
      const req = new Request(`http://localhost:3000${path}`, {
        method,
      });

      const res = params
        ? await handler(req, { params })
        : await handler(req);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body).toEqual({
        ok: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    });
  });

  it("returns 501 (not 401) when authenticated — proving auth gate passed", async () => {
    mockAuth("clerk_test_authed_user");

    const mod: RouteModule = await import("@/app/api/settings/route");
    const req = new Request("http://localhost:3000/api/settings", {
      method: "GET",
    });

    const res = await mod.GET(req);
    const body = await res.json();

    expect(res.status).toBe(501);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("NOT_IMPLEMENTED");
  });
});
