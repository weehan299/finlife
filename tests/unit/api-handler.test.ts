import { describe, it, expect } from "vitest";
import { z } from "zod";
import { withApi } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/error";
import { ok } from "@/lib/api/response";

describe("withApi", () => {
  it("returns { ok: true, data } with status 200 on success", async () => {
    const handler = withApi(async (_req: Request) => ok({ value: 42 }));
    const res = await handler(new Request("http://localhost/"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, data: { value: 42 } });
  });

  it("catches ApiError.unauthorized() → 401 + UNAUTHORIZED", async () => {
    const handler = withApi(async (_req: Request) => {
      throw ApiError.unauthorized();
    });
    const res = await handler(new Request("http://localhost/"));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
    expect(body.error.message).toBeDefined();
  });

  it("catches ApiError.notFound() → 404 + NOT_FOUND", async () => {
    const handler = withApi(async (_req: Request) => {
      throw ApiError.notFound();
    });
    const res = await handler(new Request("http://localhost/"));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("catches ApiError.notImplemented() → 501 + NOT_IMPLEMENTED", async () => {
    const handler = withApi(async (_req: Request) => {
      throw ApiError.notImplemented();
    });
    const res = await handler(new Request("http://localhost/"));
    expect(res.status).toBe(501);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("NOT_IMPLEMENTED");
  });

  it("catches ZodError → 400 + VALIDATION_ERROR + fields map", async () => {
    const handler = withApi(async (_req: Request) => {
      z.object({ n: z.number() }).parse({ n: "x" });
      return ok(null);
    });
    const res = await handler(new Request("http://localhost/"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.fields).toBeDefined();
    expect(typeof body.error.fields).toBe("object");
  });

  it("catches unexpected Error → 500 + INTERNAL_ERROR", async () => {
    const handler = withApi(async (_req: Request) => {
      throw new Error("something exploded");
    });
    const res = await handler(new Request("http://localhost/"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("INTERNAL_ERROR");
  });

  it("error responses always have ok: false with error.code and error.message", async () => {
    const errors = [
      ApiError.unauthorized(),
      ApiError.notFound(),
      ApiError.notImplemented(),
      ApiError.internal(),
    ];

    for (const apiError of errors) {
      const handler = withApi(async (_req: Request) => {
        throw apiError;
      });
      const res = await handler(new Request("http://localhost/"));
      const body = await res.json();
      expect(body.ok).toBe(false);
      expect(typeof body.error.code).toBe("string");
      expect(typeof body.error.message).toBe("string");
    }
  });
});
