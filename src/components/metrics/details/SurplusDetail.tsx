import Link from "next/link";
import BreakdownBar from "@/components/ui/BreakdownBar";
import CategorySummary from "@/components/ui/CategorySummary";
import { formatCurrency } from "@/lib/format";
import type { SnapshotWithExtras } from "@/lib/snapshot";
import type { BaselineResponse } from "@/types/baseline.types";

interface SurplusDetailProps {
  snapshot: SnapshotWithExtras;
  baseline: BaselineResponse;
  onAddItem?: (entityType: string, category?: string) => void;
  onEditItem?: (entityType: string, id: string) => void;
}

export default function SurplusDetail({ snapshot, baseline, onAddItem, onEditItem }: SurplusDetailProps) {
  const isDeficit = snapshot.monthlySurplus < 0;

  const incomeItems = baseline.incomes.map((i) => ({
    id: i.id,
    label: i.label,
    category: i.category,
    amount: i.monthlyAmount,
  }));

  const expenseItems = baseline.expenses.map((e) => ({
    id: e.id,
    label: e.label,
    category: e.category,
    amount: e.monthlyAmount,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">What this means</h3>
        <p className="mt-1 text-sm text-gray-600">
          Monthly surplus is your total income minus total expenses.{" "}
          {isDeficit
            ? `You're spending ${formatCurrency(Math.abs(snapshot.monthlySurplus))} more than you earn each month.`
            : `You have ${formatCurrency(snapshot.monthlySurplus)} left over each month after expenses.`}
        </p>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Breakdown</h3>
        <BreakdownBar
          segments={[
            { label: `Income (${formatCurrency(snapshot.monthlyIncome)})`, value: snapshot.monthlyIncome, color: "bg-green-500" },
            { label: `Expenses (${formatCurrency(snapshot.monthlyExpenses)})`, value: snapshot.monthlyExpenses, color: "bg-red-400" },
          ]}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">Income</h4>
            {onAddItem && (
              <button
                type="button"
                onClick={() => onAddItem("income")}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add income
              </button>
            )}
          </div>
          <CategorySummary
            items={incomeItems}
            total={snapshot.monthlyIncome}
            onEditItem={onEditItem ? (id) => onEditItem("income", id) : undefined}
          />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">Expenses</h4>
            {onAddItem && (
              <button
                type="button"
                onClick={() => onAddItem("expense")}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add expense
              </button>
            )}
          </div>
          <CategorySummary
            items={expenseItems}
            total={snapshot.monthlyExpenses}
            onEditItem={onEditItem ? (id) => onEditItem("expense", id) : undefined}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-gray-200 pt-4">
        <Link
          href="/settings?section=income"
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Manage all &rarr;
        </Link>
        <span className="text-gray-300">|</span>
        {isDeficit ? (
          <span className="text-sm text-gray-600">
            Consider reviewing discretionary expenses to reduce your deficit.
          </span>
        ) : (
          <Link
            href="/goals"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Set a savings goal &rarr;
          </Link>
        )}
      </div>
    </div>
  );
}
