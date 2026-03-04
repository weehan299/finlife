import { ZodError } from "zod";
import { ApiError } from "@/lib/api/error";
import { fail } from "@/lib/api/response";
import { fromZod } from "@/lib/api/validation";

type RouteHandler<TArgs extends unknown[] = [Request]> = (
  ...args: TArgs
) => Promise<Response> | Response;

export function withApi<TArgs extends unknown[]>(handler: RouteHandler<TArgs>) {
  return async (...args: TArgs): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof ApiError) {
        return fail(error);
      }

      if (error instanceof ZodError) {
        return fail(fromZod(error));
      }

      console.error("Unhandled API error", error);
      return fail(ApiError.internal());
    }
  };
}
