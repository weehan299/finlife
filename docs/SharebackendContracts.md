## Recent Foundation Additions

- `src/proxy.ts`
  - Replaces deprecated `src/middleware.ts` for Next.js 16.
  - Protects all non-public routes with Clerk (`/`, `/sign-in`, `/sign-up` remain public).
- `src/lib/env.ts`
  - Validates required env vars at startup using Zod.
  - Required: `DATABASE_URL`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.
  - Defaulted: `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`.
- `src/lib/api/error.ts`
  - Defines shared `ApiError` type with consistent status/code/message/fields.
  - Codes: `UNAUTHORIZED`, `VALIDATION_ERROR`, `NOT_FOUND`, `NOT_IMPLEMENTED`, `INTERNAL_ERROR`.
- `src/lib/api/response.ts`
  - Standardizes response envelope:
    - Success: `{ ok: true, data, meta? }`
    - Error: `{ ok: false, error: { code, message, fields? } }`
- `src/lib/api/validation.ts`
  - Maps Zod issues to field-level error objects for API responses.
- `src/lib/api/handler.ts`
  - Wraps route handlers to centralize ApiError/Zod/unexpected error handling.
- `src/lib/auth.ts` (updated)
  - `requireAuth()` always returns internal Prisma `User.id` (not Clerk user id).
  - Auto-upserts user by `clerkUserId`.
  - `requireAuthContext()` returns both `clerkUserId` and internal `userId`.
- `src/lib/db.ts` (updated)
  - Uses validated env from `src/lib/env.ts`.
- `src/app/api/*/route.ts` (updated stubs)
  - Uses shared API handler/response helpers so all endpoints follow one envelope/error contract.


## Notes

- Prisma connection uses the Prisma 7 adapter pattern via `@prisma/adapter-pg` in `src/lib/db.ts`.
- Monetary fields use `Decimal(14,2)` and rates use decimal fractions (example: `0.03` for 3%).
- All domain data is user-scoped and relational deletes cascade from `User`.
- API responses are standardized through shared helpers in `src/lib/api/*`.
- Zod validation failures map to field-level API errors via `src/lib/api/validation.ts`.
- `src/middleware.ts` has been replaced by `src/proxy.ts` for Next.js 16.
- Current route handlers and services are still scaffold stubs and intended to be implemented next.
