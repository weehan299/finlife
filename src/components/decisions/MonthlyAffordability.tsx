import type { NarrativeData } from "@/types/decision.types";
import StackedBarChart from "./StackedBarChart";

interface MonthlyAffordabilityProps {
  breakdown: NarrativeData["monthlyBreakdown"];
}

export default function MonthlyAffordability({ breakdown }: MonthlyAffordabilityProps) {
  if (breakdown.newExpense === 0 && breakdown.remainingBuffer >= 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">
        Every month: Can you carry this?
      </h3>
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <StackedBarChart breakdown={breakdown} />
      </div>
    </div>
  );
}
