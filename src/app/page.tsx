import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 py-16">
      <h1 className="text-4xl font-bold tracking-tight">FinLife</h1>
      <p className="mt-4 text-center text-base text-gray-600">
        Personal finance decision engine for goals, baseline planning, and what-if
        scenarios.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/overview"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Open Dashboard
        </Link>
        <Link
          href="/sign-in"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
