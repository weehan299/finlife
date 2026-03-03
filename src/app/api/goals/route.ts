import { requireAuth } from "@/lib/auth";

export async function GET() {
  await requireAuth();
  return Response.json({
    ok: false,
    error: { code: "NOT_IMPLEMENTED", message: "GET /api/goals" },
  }, { status: 501 });
}

export async function POST() {
  await requireAuth();
  return Response.json({
    ok: false,
    error: { code: "NOT_IMPLEMENTED", message: "POST /api/goals" },
  }, { status: 501 });
}
