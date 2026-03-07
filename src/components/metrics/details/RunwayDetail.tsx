import Link from "next/link";
import CategoryBreakdown from "@/components/ui/CategoryBreakdown";
import { formatCurrency } from "@/lib/format";
import { DEFAULT_ASSUMPTIONS } from "@/lib/defaults";
import type { SnapshotWithExtras } from "@/lib/snapshot";
import type { BaselineResponse } from "@/types/baseline.types";

interface RunwayDetailProps {
  snapshot: SnapshotWithExtras;
  baseline: BaselineResponse;
  onAddItem?: (entityType: string, category?: string) => void;
  onEditItem?: (entityType: string, id: string) => void;
}

export default function RunwayDetail({ snapshot, baseline, onAddItem, onEditItem }: RunwayDetailProps) {
  const target = DEFAULT_ASSUMPTIONS.minEmergencyMonths;
  const meetsTarget = snapshot.emergencyRunwayMonths >= target;
  const runway = Math.round(snapshot.emergencyRunwayMonths * 10) / 10;

  const liquidAssets = baseline.assets.filter((a) => a.isLiquid);
  const liquidItems = liquidAssets.map((a) => ({
    id: a.id,
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
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">Liquid Assets</h4>
            {onAddItem && (
              <button
                type="button"
                onClick={() => onAddItem("asset")}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add asset
              </button>
            )}
          </div>
          <CategoryBreakdown
            items={liquidItems}
            total={snapshot.liquidAssets}
            onEditItem={onEditItem ? (id) => onEditItem("asset", id) : undefined}
            onAddItem={onAddItem ? (cat) => onAddItem("asset", cat) : undefined}
            entityLabel="asset"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 border-t border-gray-200 pt-4">
        <Link
          href="/settings?section=cash"
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Manage all &rarr;
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
