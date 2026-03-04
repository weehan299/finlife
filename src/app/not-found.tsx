import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-sm text-gray-600">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/overview"
        className="rounded bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700"
      >
        Go to Overview
      </Link>
    </div>
  );
}
