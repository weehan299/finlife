"use client";

import type { GoalWithProgress } from "@/types/goal.types";

interface GoalCardProps {
  goal: GoalWithProgress;
  onClick: () => void;
}

const typeLabels: Record<string, string> = {
  SAVINGS: "Savings",
  RETIREMENT: "Retirement",
  FINANCIAL_INDEPENDENCE: "FI",
  CUSTOM: "Custom",
};

const typeBadgeColors: Record<string, string> = {
  SAVINGS: "bg-blue-100 text-blue-700",
  RETIREMENT: "bg-purple-100 text-purple-700",
  FINANCIAL_INDEPENDENCE: "bg-emerald-100 text-emerald-700",
  CUSTOM: "bg-gray-100 text-gray-700",
};

function progressColor(pct: number): string {
  if (pct >= 75) return "bg-green-500";
  if (pct >= 25) return "bg-yellow-500";
  return "bg-red-500";
}

export default function GoalCard({ goal, onClick }: GoalCardProps) {
  const { progress } = goal;
  const pct = Math.min(100, progress.percentComplete);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-lg border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between">
        <h3 className="font-semibold text-gray-900">{goal.name}</h3>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeBadgeColors[goal.type] ?? typeBadgeColors.CUSTOM}`}>
          {typeLabels[goal.type] ?? goal.type}
        </span>
      </div>

      <p className="mb-3 text-sm text-gray-500">
        Target: ${goal.targetAmount.toLocaleString()}
      </p>

      <div className="mb-2 h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all ${progressColor(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{pct.toFixed(1)}% complete</span>
        <span>
          {progress.estimatedMonthsToTarget != null
            ? `~${progress.estimatedMonthsToTarget} mo remaining`
            : progress.amountRemaining === 0
              ? "Goal met!"
              : "No contribution set"}
        </span>
      </div>
    </button>
  );
}
