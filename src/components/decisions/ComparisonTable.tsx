import type { SnapshotWithExtras } from "@/lib/snapshot";
import { formatCurrency } from "@/lib/format";
import type { GuardrailStatus } from "@/types/decision.types";

interface ComparisonRow {
  label: string;
  before: number;
  after: number;
  format: "currency" | "months" | "percent";
}

function formatValue(value: number, format: ComparisonRow["format"]): string {
  switch (format) {
    case "currency":
      return formatCurrency(value);
    case "months":
      return `${Math.round(value * 10) / 10} mo`;
    case "percent":
      return `${Math.round(value * 100)}%`;
  }
}

function deltaStatus(delta: number, inverted: boolean): GuardrailStatus {
  const adjusted = inverted ? -delta : delta;
  if (adjusted > 0) return "PASS";
  if (adjusted === 0) return "CAUTION";
  return "FAIL";
}

const statusColors: Record<GuardrailStatus, string> = {
  PASS: "text-green-700",
  CAUTION: "text-gray-500",
  FAIL: "text-red-700",
};

interface ComparisonTableProps {
  baseline: SnapshotWithExtras;
  postDecision: SnapshotWithExtras;
}

export default function ComparisonTable({
  baseline,
  postDecision,
}: ComparisonTableProps) {
  const rows: (ComparisonRow & { inverted?: boolean })[] = [
    { label: "Monthly surplus", before: baseline.monthlySurplus, after: postDecision.monthlySurplus, format: "currency" },
    { label: "Liquid assets", before: baseline.liquidAssets, after: postDecision.liquidAssets, format: "currency" },
    { label: "Net worth", before: baseline.netWorth, after: postDecision.netWorth, format: "currency" },
    { label: "Emergency runway", before: baseline.emergencyRunwayMonths, after: postDecision.emergencyRunwayMonths, format: "months" },
    { label: "Debt-to-income", before: baseline.debtToIncomeRatio, after: postDecision.debtToIncomeRatio, format: "percent", inverted: true },
    { label: "Monthly expenses", before: baseline.monthlyExpenses, after: postDecision.monthlyExpenses, format: "currency", inverted: true },
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left text-gray-500">
            <th className="px-4 py-3 font-medium">Metric</th>
            <th className="px-4 py-3 font-medium">Before</th>
            <th className="px-4 py-3 font-medium">After</th>
            <th className="px-4 py-3 font-medium">Change</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const delta = row.after - row.before;
            const status = deltaStatus(delta, !!row.inverted);
            return (
              <tr key={row.label} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {row.label}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {formatValue(row.before, row.format)}
                </td>
                <td className="px-4 py-3 text-gray-900">
                  {formatValue(row.after, row.format)}
                </td>
                <td className={`px-4 py-3 font-medium ${statusColors[status]}`}>
                  {delta >= 0 ? "+" : ""}
                  {formatValue(delta, row.format)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
