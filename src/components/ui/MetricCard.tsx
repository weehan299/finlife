interface MetricCardProps {
  label: string;
  value: string;
  subtitle?: string;
  status?: "positive" | "negative" | "neutral";
  onClick?: () => void;
  selected?: boolean;
}

const statusColors: Record<string, string> = {
  positive: "text-green-700",
  negative: "text-red-700",
  neutral: "text-gray-700",
};

export default function MetricCard({
  label,
  value,
  subtitle,
  status = "neutral",
  onClick,
  selected = false,
}: MetricCardProps) {
  const interactive = !!onClick;

  const baseClasses = "rounded-lg border bg-white p-5 text-left w-full relative";
  const interactiveClasses = interactive
    ? "cursor-pointer transition-all duration-150 hover:border-blue-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
    : "";
  const selectedClasses = selected
    ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500"
    : "border-gray-200";

  const content = (
    <>
      {interactive && (
        <svg
          className={`absolute top-3 right-3 h-4 w-4 text-gray-400 transition-transform duration-200 ${selected ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      )}
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${statusColors[status]}`}>
        {value}
      </p>
      {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      {interactive && (
        <p className="mt-2 text-xs text-gray-400">--</p>
      )}
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-expanded={selected}
        className={`${baseClasses} ${interactiveClasses} ${selectedClasses}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={`${baseClasses} ${selectedClasses}`}>
      {content}
    </div>
  );
}
