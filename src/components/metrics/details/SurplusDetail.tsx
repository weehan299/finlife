import Link from "next/link";
import BreakdownBar from "@/components/ui/BreakdownBar";
import BreakdownTable from "@/components/ui/BreakdownTable";
import { formatCurrency } from "@/lib/format";
import type { SnapshotWithExtras } from "@/lib/snapshot";
import type { BaselineResponse } from "@/types/baseline.types";

interface SurplusDetailProps {
  snapshot: SnapshotWithExtras;
  baseline: BaselineResponse;
}

export default function SurplusDetail({ snapshot, baseline }: SurplusDetailProps) {
  const isDeficit = snapshot.monthlySurplus < 0;

  const incomeItems = baseline.incomes.map((i) => ({
    label: i.label,
    category: i.category,
    amount: i.monthlyAmount,
  }));

  const expenseItems = baseline.expenses.map((e) => ({
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
        <BreakdownTable
          title="Income"
          items={incomeItems}
          total={snapshot.monthlyIncome}
        />
        <BreakdownTable
          title="Expense"
          items={expenseItems}
          total={snapshot.monthlyExpenses}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-gray-200 pt-4">
        <Link
          href="/settings"
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Edit income &amp; expenses
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
