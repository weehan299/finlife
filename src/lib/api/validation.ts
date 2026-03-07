import { ZodError } from "zod";
import { ApiError } from "@/lib/api/error";

function zodToFieldErrors(error: ZodError): Record<string, string> {
  return error.issues.reduce<Record<string, string>>((acc, issue) => {
    const path = issue.path.join(".") || "root";
    if (!acc[path]) {
      acc[path] = issue.message;
    }
    return acc;
  }, {});
}

export function fromZod(error: ZodError): ApiError {
  return ApiError.validation("Request validation failed", zodToFieldErrors(error));
}
