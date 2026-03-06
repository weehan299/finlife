import Link from "next/link";
import BreakdownBar from "@/components/ui/BreakdownBar";
import BreakdownTable from "@/components/ui/BreakdownTable";
import { formatCurrency } from "@/lib/format";
import type { SnapshotWithExtras } from "@/lib/snapshot";
import type { BaselineResponse } from "@/types/baseline.types";

interface NetWorthDetailProps {
  snapshot: SnapshotWithExtras;
  baseline: BaselineResponse;
}

export default function NetWorthDetail({ snapshot, baseline }: NetWorthDetailProps) {
  const assetItems = baseline.assets.map((a) => ({
    label: a.label,
    category: a.category,
    amount: a.value,
  }));

  const liabilityItems = baseline.liabilities.map((l) => ({
    label: l.label,
    category: l.category,
    amount: l.balance,
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
        {assetItems.length > 0 && (
          <BreakdownTable
            title="Asset"
            items={assetItems}
            total={snapshot.totalAssets}
          />
        )}
        {liabilityItems.length > 0 && (
          <BreakdownTable
            title="Liability"
            items={liabilityItems}
            total={snapshot.totalLiabilities}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-gray-200 pt-4">
        <Link
          href="/settings"
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Edit assets &amp; liabilities
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
