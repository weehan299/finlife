import Link from "next/link";
import BreakdownBar from "@/components/ui/BreakdownBar";
import CategoryBreakdown from "@/components/ui/CategoryBreakdown";
import { formatCurrency } from "@/lib/format";
import type { SnapshotWithExtras } from "@/lib/snapshot";
import type { BaselineResponse } from "@/types/baseline.types";

interface NetWorthDetailProps {
  snapshot: SnapshotWithExtras;
  baseline: BaselineResponse;
  onAddItem?: (entityType: string, category?: string) => void;
  onEditItem?: (entityType: string, id: string) => void;
}

export default function NetWorthDetail({ snapshot, baseline, onAddItem, onEditItem }: NetWorthDetailProps) {
  const assetItems = baseline.assets.map((a) => ({
    id: a.id,
    label: a.label,
    category: a.category,
    amount: a.value,
  }));

  const liabilityItems = baseline.liabilities.map((l) => ({
    id: l.id,
    label: l.label,
    category: l.category,
    amount: l.balance,
    extra: l.annualInterestRate != null
      ? `${Math.round(l.annualInterestRate * 10000) / 100}% APR`
      : undefined,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">What this means</h3>
        <p className="mt-1 text-sm text-gray-600">
          Net worth is your total assets minus total liabilities. At{" "}
          {formatCurrency(snapshot.netWorth)}, this represents what you own after
          subtracting what you owe.
        </p>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Breakdown</h3>
        <BreakdownBar
          segments={[
            { label: `Assets (${formatCurrency(snapshot.totalAssets)})`, value: snapshot.totalAssets, color: "bg-green-500" },
            { label: `Liabilities (${formatCurrency(snapshot.totalLiabilities)})`, value: snapshot.totalLiabilities, color: "bg-red-400" },
          ]}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">Assets</h4>
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
          {assetItems.length > 0 ? (
            <CategoryBreakdown
              items={assetItems}
              total={snapshot.totalAssets}
              onEditItem={onEditItem ? (id) => onEditItem("asset", id) : undefined}
              onAddItem={onAddItem ? (cat) => onAddItem("asset", cat) : undefined}
              entityLabel="asset"
            />
          ) : (
            <p className="text-sm text-gray-500">No assets added yet.</p>
          )}
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">Liabilities</h4>
            {onAddItem && (
              <button
                type="button"
                onClick={() => onAddItem("liability")}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add liability
              </button>
            )}
          </div>
          {liabilityItems.length > 0 ? (
            <CategoryBreakdown
              items={liabilityItems}
              total={snapshot.totalLiabilities}
              onEditItem={onEditItem ? (id) => onEditItem("liability", id) : undefined}
              onAddItem={onAddItem ? (cat) => onAddItem("liability", cat) : undefined}
              entityLabel="liability"
            />
          ) : (
            <p className="text-sm text-gray-500">No liabilities added yet.</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-gray-200 pt-4">
        <Link
          href="/settings?section=investments"
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Manage all &rarr;
        </Link>
        <span className="text-gray-300">|</span>
        <Link
          href="/decisions/new"
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Evaluate a financial decision &rarr;
        </Link>
      </div>
    </div>
  );
}
