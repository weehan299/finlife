import { ApiError } from "@/lib/api/error";

export type ApiMeta = {
  defaultsUsed?: string[];
  confidence?: "estimated" | "complete";
};

type ApiSuccess<T> = {
  ok: true;
  data: T;
  meta?: ApiMeta;
};

type ApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
};

export function ok<T>(data: T, init?: ResponseInit, meta?: ApiMeta): Response {
  const body: ApiSuccess<T> = meta ? { ok: true, data, meta } : { ok: true, data };
  return Response.json(body, init);
}

export function fail(error: ApiError, init?: ResponseInit): Response {
  const body: ApiFailure = {
    ok: false,
    error: {
      code: error.code,
      message: error.message,
      ...(error.fields ? { fields: error.fields } : {}),
    },
  };

  return Response.json(body, {
    status: error.status,
    ...init,
  });
}

export function notImplemented(path: string): Response {
  return fail(ApiError.notImplemented(path));
}
