import { withApi } from "@/lib/api/handler";
import { notImplemented } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth";

export const GET = withApi(async () => {
  await requireAuth();
  return notImplemented("GET /api/decisions");
});

export const POST = withApi(async () => {
  await requireAuth();
  return notImplemented("POST /api/decisions");
});
