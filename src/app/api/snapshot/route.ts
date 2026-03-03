import { requireAuth } from "@/lib/auth";

export async function GET() {
  await requireAuth();
  return Response.json({
    ok: false,
    error: { code: "NOT_IMPLEMENTED", message: "GET /api/snapshot" },
  }, { status: 501 });
}
