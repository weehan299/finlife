import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));

import { auth } from "@clerk/nextjs/server";
import { cleanDatabase } from "../helpers/cleanup";

beforeEach(cleanDatabase);

function mockAuth(userId: string | null) {
  vi.mocked(auth).mockResolvedValue({ userId } as any);
}

type RouteModule = Record<string, (req: Request) => Promise<Response>>;

const routes: { path: string; method: string; module: string }[] = [
  { path: "/api/settings", method: "GET", module: "@/app/api/settings/route" },
  { path: "/api/settings", method: "PUT", module: "@/app/api/settings/route" },
  { path: "/api/goals", method: "GET", module: "@/app/api/goals/route" },
  { path: "/api/goals", method: "POST", module: "@/app/api/goals/route" },
  { path: "/api/decisions", method: "GET", module: "@/app/api/decisions/route" },
  { path: "/api/decisions", method: "POST", module: "@/app/api/decisions/route" },
  { path: "/api/snapshot", method: "GET", module: "@/app/api/snapshot/route" },
  { path: "/api/baseline", method: "GET", module: "@/app/api/baseline/route" },
  { path: "/api/baseline", method: "PUT", module: "@/app/api/baseline/route" },
];

describe("API route auth guards", () => {
  describe.each(routes)("$method $path", ({ path, method, module }) => {
    it("returns 401 UNAUTHORIZED when not authenticated", async () => {
      mockAuth(null);

      const mod: RouteModule = await import(module);
      const handler = mod[method];
      const req = new Request(`http://localhost:3000${path}`, {
        method,
      });

      const res = await handler(req);
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
