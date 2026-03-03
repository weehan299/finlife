import { requireAuth } from "@/lib/auth";

export async function GET() {
  await requireAuth();
  return Response.json({
    ok: false,
    error: { code: "NOT_IMPLEMENTED", message: "GET /api/settings" },
  }, { status: 501 });
}

export async function PUT() {
  await requireAuth();
  return Response.json({
    ok: false,
    error: { code: "NOT_IMPLEMENTED", message: "PUT /api/settings" },
  }, { status: 501 });
}
