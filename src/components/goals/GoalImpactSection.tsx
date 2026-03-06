"use client";

import type { GoalImpactSummary } from "@/types/goal.types";

interface GoalImpactSectionProps {
  impacts: GoalImpactSummary[];
}

export default function GoalImpactSection({ impacts }: GoalImpactSectionProps) {
  if (impacts.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
        No evaluated decisions impact this goal yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {impacts.map((impact) => (
        <div
          key={impact.id}
          className="rounded-lg border border-gray-200 bg-white p-4"
        >
          <p className="font-medium text-gray-900">{impact.decisionName}</p>
          <div className="mt-2 flex gap-6 text-sm text-gray-600">
            {impact.projectedDelayMonths != null && (
              <span>
                Delay:{" "}
                <span className="font-medium text-orange-600">
                  +{impact.projectedDelayMonths} months
                </span>
              </span>
            )}
            {impact.deltaToTarget != null && (
              <span>
                Shortfall:{" "}
                <span className="font-medium text-red-600">
                  ${Math.abs(impact.deltaToTarget).toLocaleString()}
                </span>
              </span>
            )}
            {impact.projectedDelayMonths == null && impact.deltaToTarget == null && (
              <span className="text-gray-400">Impact could not be computed</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
