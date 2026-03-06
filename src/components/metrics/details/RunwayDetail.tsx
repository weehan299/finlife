import Link from "next/link";
import BreakdownTable from "@/components/ui/BreakdownTable";
import { formatCurrency } from "@/lib/format";
import { DEFAULT_ASSUMPTIONS } from "@/lib/defaults";
import type { SnapshotWithExtras } from "@/lib/snapshot";
import type { BaselineResponse } from "@/types/baseline.types";

interface RunwayDetailProps {
  snapshot: SnapshotWithExtras;
  baseline: BaselineResponse;
}

export default function RunwayDetail({ snapshot, baseline }: RunwayDetailProps) {
  const target = DEFAULT_ASSUMPTIONS.minEmergencyMonths;
  const meetsTarget = snapshot.emergencyRunwayMonths >= target;
  const runway = Math.round(snapshot.emergencyRunwayMonths * 10) / 10;

  const liquidAssets = baseline.assets.filter((a) => a.isLiquid);
  const liquidItems = liquidAssets.map((a) => ({
    label: a.label,
    category: a.category,
    amount: a.value,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">What this means</h3>
        <p className="mt-1 text-sm text-gray-600">
          Emergency runway is how many months your liquid savings can cover your
          expenses. The recommended target is at least {target} months.
        </p>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Calculation</h3>
        <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
          <div className="flex items-center gap-2 font-mono">
            <span>{formatCurrency(snapshot.liquidAssets)}</span>
            <span className="text-gray-400">&divide;</span>
            <span>{formatCurrency(snapshot.monthlyExpenses)}/mo</span>
            <span className="text-gray-400">=</span>
            <span className="font-semibold">{runway} months</span>
          </div>
        </div>
      </div>

      {liquidItems.length > 0 && (
        <BreakdownTable
          title="Liquid Asset"
          items={liquidItems}
          total={snapshot.liquidAssets}
        />
      )}

      <div className="flex flex-wrap items-center gap-4 border-t border-gray-200 pt-4">
        <Link
          href="/settings"
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Edit assets &amp; expenses
        </Link>
        <span className="text-gray-300">|</span>
        {meetsTarget ? (
          <span className="text-sm text-green-700">
            You meet the {target}-month recommendation.
          </span>
        ) : (
          <span className="text-sm text-gray-600">
            Consider increasing liquid savings to reach {target} months of coverage.
          </span>
        )}
      </div>
    </div>
  );
}
