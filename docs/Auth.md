# Authentication Flow

FinLife uses [Clerk](https://clerk.com) for identity and session management. Internally, Clerk user IDs are mapped to Prisma-managed `User` rows so all domain data references a stable internal ID.

## Environment setup

`src/lib/env.ts` validates required Clerk variables at startup and throws immediately if any are missing:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Client-side Clerk SDK init |
| `CLERK_SECRET_KEY` | Server-side Clerk SDK + middleware |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Redirect target for sign-in (default `/sign-in`) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Redirect target for sign-up (default `/sign-up`) |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Post-login redirect (default `/overview`) |

## Request lifecycle

```
Browser request
    │
    ▼
src/proxy.ts  (Clerk middleware — runs on every request)
    │  ├─ Public routes: /, /sign-in(.*), /sign-up(.*)  → pass through
    │  └─ All other routes → auth.protect()
    │       └─ No valid session → redirect to /sign-in
    │
    ▼
Route handler  (src/app/api/*/route.ts)
    │  └─ withApi(handler)  — catches ApiError / ZodError uniformly
    │
    ▼
requireAuth() or requireAuthContext()  (src/lib/auth.ts)
    │  ├─ auth() from @clerk/nextjs/server → resolves Clerk session
    │  ├─ No session → throws ApiError.unauthorized() → 401 response
    │  └─ Valid session → upsert User row in Postgres
    │       └─ returns internal userId (cuid) [+ clerkUserId if needed]
    │
    ▼
Domain / data-access layer
    └─ All queries scoped to internal userId
```

## Middleware (`src/proxy.ts`)

The file is named `proxy.ts` (not `middleware.ts`) to satisfy the Next.js 16 App Router convention. It uses `clerkMiddleware` with a route matcher:

```ts
const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect(); // redirects unauthenticated users to /sign-in
  }
});
```

The `config.matcher` covers all pages and API routes while excluding static assets (`_next`, files with extensions).

## User identity mapping (`src/lib/auth.ts`)

Clerk issues its own user ID (`clerkUserId`). On the first authenticated request, `requireAuthContext()` upserts a `User` row and returns the internal cuid:

```ts
const user = await prisma.user.upsert({
  where: { clerkUserId },
  update: {},
  create: { clerkUserId },
  select: { id: true },
});
```

- `requireAuth()` — returns the internal `userId` (most route handlers use this)
- `requireAuthContext()` — returns `{ clerkUserId, userId }` when both IDs are needed

All domain models (`Asset`, `Goal`, `Decision`, etc.) reference `userId` (the internal cuid), never the Clerk ID directly.

## Error handling

`withApi()` wraps every route handler. If `requireAuth()` throws `ApiError.unauthorized()`, `withApi` catches it and returns:

```json
{ "ok": false, "error": { "code": "UNAUTHORIZED", "message": "..." } }
```

with HTTP 401.

## Protected app shell

The main app layout (`src/app/(main)/layout.tsx`) provides a sidebar + header shell for all authenticated pages. Key components:

- **`NavLink`** (`src/app/(main)/NavLink.tsx`) — client component using `usePathname()` to highlight the active nav item (`bg-gray-200 font-medium`). The layout itself stays a server component.
- **`loading.tsx`** (`src/app/(main)/loading.tsx`) — pulse-animated skeleton shown during page transitions.
- **`error.tsx`** (`src/app/(main)/error.tsx`) — client error boundary with "Try again" button calling `reset()`.
- **`not-found.tsx`** (`src/app/not-found.tsx`) — 404 page with link back to `/overview`.

## Test coverage

Auth is tested at two levels:

| File | Scope | Tests |
|---|---|---|
| `tests/integration/auth.test.ts` | `requireAuth()` / `requireAuthContext()` directly — upsert, idempotency, dual-ID mapping | 8 |
| `tests/integration/api-routes-auth.test.ts` | All 9 API route handlers reject with `401 UNAUTHORIZED` when unauthenticated; 1 positive test confirms authenticated requests pass through to `501 NOT_IMPLEMENTED` | 10 |
| `tests/unit/api-handler.test.ts` | `withApi()` error handling — `ApiError`, `ZodError`, unexpected errors | 7 |

All tests mock `@clerk/nextjs/server` (`auth` function) and run against a real local Postgres database with `TRUNCATE "User" CASCADE` cleanup between tests.
