export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded bg-gray-200" />
      <div className="h-4 w-full max-w-md rounded bg-gray-200" />
      <div className="h-4 w-full max-w-sm rounded bg-gray-200" />
      <div className="mt-6 h-32 w-full max-w-lg rounded bg-gray-200" />
    </div>
  );
}
