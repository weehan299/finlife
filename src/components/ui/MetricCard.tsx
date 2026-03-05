interface MetricCardProps {
  label: string;
  value: string;
  subtitle?: string;
  status?: "positive" | "negative" | "neutral";
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
}: MetricCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${statusColors[status]}`}>
        {value}
      </p>
      {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
}
