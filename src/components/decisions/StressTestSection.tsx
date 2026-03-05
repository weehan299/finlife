import type { SnapshotWithExtras } from "@/lib/snapshot";
import type { GuardrailResult } from "@/types/decision.types";
import { formatCurrency } from "@/lib/format";
import MetricCard from "@/components/ui/MetricCard";

const statusIcon: Record<string, string> = {
  PASS: "Pass",
  CAUTION: "Caution",
  FAIL: "Fail",
};

interface StressTestSectionProps {
  stressSnapshot: SnapshotWithExtras;
  guardrails: GuardrailResult[];
}

export default function StressTestSection({
  stressSnapshot,
  guardrails,
}: StressTestSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Stress test</h3>
      <p className="text-sm text-gray-500">
        What happens if income drops to guaranteed-only and non-essential spending is reduced?
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Stressed surplus"
          value={formatCurrency(stressSnapshot.monthlySurplus)}
          status={stressSnapshot.monthlySurplus >= 0 ? "positive" : "negative"}
        />
        <MetricCard
          label="Stressed runway"
          value={`${Math.round(stressSnapshot.emergencyRunwayMonths * 10) / 10} months`}
          status={stressSnapshot.emergencyRunwayMonths >= 6 ? "positive" : "negative"}
        />
        <MetricCard
          label="Stressed income"
          value={formatCurrency(stressSnapshot.monthlyIncome)}
          subtitle="Guaranteed only"
          status="neutral"
        />
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Guardrail checks</h4>
        {guardrails.map((g) => (
          <div
            key={g.key}
            className="flex items-start gap-3 rounded-md border border-gray-100 bg-white p-3"
          >
            <span
              className={`mt-0.5 text-xs font-bold ${
                g.status === "PASS"
                  ? "text-green-700"
                  : g.status === "CAUTION"
                    ? "text-amber-700"
                    : "text-red-700"
              }`}
            >
              {statusIcon[g.status]}
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900">{g.label}</p>
              <p className="text-sm text-gray-500">{g.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
