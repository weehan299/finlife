import MetricCard from "@/components/ui/MetricCard";
import { formatCurrency } from "@/lib/format";
import type { SnapshotWithExtras } from "@/lib/snapshot";
import { summarizeSnapshot } from "@/lib/snapshot";

interface SnapshotDisplayProps {
  snapshot: SnapshotWithExtras;
}

export default function SnapshotDisplay({ snapshot }: SnapshotDisplayProps) {
  const summary = summarizeSnapshot(snapshot);
  const isDeficit = snapshot.monthlySurplus < 0;

  return (
    <div>
      <div
        className={`mb-6 rounded-lg p-4 ${isDeficit ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}
      >
        <p className="text-sm font-medium">{summary}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Monthly Surplus"
          value={formatCurrency(Math.abs(snapshot.monthlySurplus))}
          subtitle={isDeficit ? "Deficit" : "Surplus"}
          status={isDeficit ? "negative" : "positive"}
        />
        <MetricCard
          label="Net Worth"
          value={formatCurrency(snapshot.netWorth)}
          status={snapshot.netWorth >= 0 ? "positive" : "negative"}
        />
        <MetricCard
          label="Emergency Runway"
          value={`${Math.round(snapshot.emergencyRunwayMonths * 10) / 10} mo`}
          subtitle="Liquid savings ÷ expenses"
          status={snapshot.emergencyRunwayMonths >= 6 ? "positive" : "negative"}
        />
        <MetricCard
          label="Debt Load"
          value={formatCurrency(snapshot.totalLiabilities)}
          subtitle={
            snapshot.debtToIncomeRatio > 0
              ? `${Math.round(snapshot.debtToIncomeRatio * 100)}% of annual income`
              : undefined
          }
          status={snapshot.totalLiabilities === 0 ? "positive" : "neutral"}
        />
      </div>
    </div>
  );
}
