import Link from "next/link";
import CategorySummary from "@/components/ui/CategorySummary";
import { formatCurrency } from "@/lib/format";
import { DEFAULT_ASSUMPTIONS } from "@/lib/defaults";
import type { SnapshotWithExtras } from "@/lib/snapshot";
import type { BaselineResponse } from "@/types/baseline.types";

interface DebtLoadDetailProps {
  snapshot: SnapshotWithExtras;
  baseline: BaselineResponse;
  onAddItem?: (entityType: string, category?: string) => void;
  onEditItem?: (entityType: string, id: string) => void;
}

export default function DebtLoadDetail({ snapshot, baseline, onAddItem, onEditItem }: DebtLoadDetailProps) {
  const dtiThreshold = DEFAULT_ASSUMPTIONS.maxDebtToIncome;
  const dtiPct = Math.round(snapshot.debtToIncomeRatio * 100);
  const isHighDTI = snapshot.debtToIncomeRatio > dtiThreshold;
  const isDebtFree = snapshot.totalLiabilities === 0;

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
          {isDebtFree
            ? "You have no liabilities. You're debt-free!"
            : `Your total debt is ${formatCurrency(snapshot.totalLiabilities)} with a debt-to-income ratio of ${dtiPct}%. The recommended threshold is ${Math.round(dtiThreshold * 100)}%.`}
        </p>
      </div>

      {!isDebtFree && (
        <>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              Debt-to-Income Ratio
            </h3>
            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
              <div className="flex items-center gap-2 font-mono">
                <span>{formatCurrency(snapshot.totalLiabilities)}</span>
                <span className="text-gray-400">&divide;</span>
                <span>{formatCurrency(snapshot.monthlyIncome * 12)}/yr</span>
                <span className="text-gray-400">=</span>
                <span className={`font-semibold ${isHighDTI ? "text-red-700" : "text-green-700"}`}>
                  {dtiPct}%
                </span>
              </div>
            </div>
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
            <CategorySummary
              items={liabilityItems}
              total={snapshot.totalLiabilities}
              onEditItem={onEditItem ? (id) => onEditItem("liability", id) : undefined}
              entityLabel="liability"
            />
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center gap-4 border-t border-gray-200 pt-4">
        <Link
          href="/settings?section=debt"
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Manage all &rarr;
        </Link>
        <span className="text-gray-300">|</span>
        {isDebtFree ? (
          <span className="text-sm text-green-700">
            You&apos;re debt-free!
          </span>
        ) : isHighDTI ? (
          <span className="text-sm text-gray-600">
            Consider focusing on high-interest debt to lower your DTI ratio.
          </span>
        ) : (
          <span className="text-sm text-green-700">
            Your debt-to-income ratio is within the recommended {Math.round(dtiThreshold * 100)}% threshold.
          </span>
        )}
      </div>
    </div>
  );
}
