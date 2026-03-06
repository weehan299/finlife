"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SerializedGoal, GoalImpactSummary, SerializedGoalAllocation } from "@/types/goal.types";
import type { GoalProgress } from "@/types/goal.types";
import GoalForm from "@/components/forms/GoalForm";
import GoalImpactSection from "@/components/goals/GoalImpactSection";
import Drawer from "@/components/ui/Drawer";

type GoalDetailData = SerializedGoal & {
  progress: GoalProgress;
  impacts: GoalImpactSummary[];
};

interface GoalDetailProps {
  id: string;
}

function progressColor(pct: number): string {
  if (pct >= 75) return "bg-green-500";
  if (pct >= 25) return "bg-yellow-500";
  return "bg-red-500";
}

const typeLabels: Record<string, string> = {
  SAVINGS: "Savings",
  RETIREMENT: "Retirement",
  FINANCIAL_INDEPENDENCE: "Financial Independence",
  CUSTOM: "Custom",
};

export default function GoalDetail({ id }: GoalDetailProps) {
  const router = useRouter();
  const [data, setData] = useState<GoalDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const fetchGoal = useCallback(async () => {
    try {
      const res = await fetch(`/api/goals/${id}`);
      const json = await res.json();
      if (json.ok) {
        setData(json.data);
      }
    } catch {
      // keep current state
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchGoal();
  }, [fetchGoal]);

  async function handleRemoveAllocation(allocId: string) {
    const res = await fetch(`/api/goals/${id}/allocations/${allocId}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (json.ok) fetchGoal();
  }

  function handleEditSuccess() {
    setEditOpen(false);
    fetchGoal();
  }

  if (loading) {
    return (
      <div className="space-y-4 py-12">
        <div className="mx-auto h-6 w-64 animate-pulse rounded bg-gray-200" />
        <div className="mx-auto h-4 w-48 animate-pulse rounded bg-gray-100" />
        <div className="mx-auto h-32 w-full max-w-2xl animate-pulse rounded-lg bg-gray-100" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">Goal not found.</p>
        <button
          type="button"
          onClick={() => router.push("/goals")}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          Back to goals
        </button>
      </div>
    );
  }

  const { progress } = data;
  const pct = Math.min(100, progress.percentComplete);

  return (
    <div className="py-6">
      <button
        type="button"
        onClick={() => router.push("/goals")}
        className="mb-4 text-sm text-gray-500 hover:text-gray-700"
      >
        &larr; Back to goals
      </button>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{data.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {typeLabels[data.type] ?? data.type}
            {data.targetDate && ` \u00b7 Target: ${new Date(data.targetDate).toLocaleDateString()}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Edit
        </button>
      </div>

      {/* Progress */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Progress</h2>
        <div className="mb-2 h-3 overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all ${progressColor(pct)}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-gray-500">Current</p>
            <p className="font-semibold text-gray-900">
              ${progress.currentAmount.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Target</p>
            <p className="font-semibold text-gray-900">
              ${data.targetAmount.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Remaining</p>
            <p className="font-semibold text-gray-900">
              ${progress.amountRemaining.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Est. months</p>
            <p className="font-semibold text-gray-900">
              {progress.estimatedMonthsToTarget != null
                ? progress.estimatedMonthsToTarget
                : "\u2014"}
            </p>
          </div>
        </div>
      </div>

      {/* Asset Allocations */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Asset Allocations
        </h2>
        {data.allocations.length === 0 ? (
          <p className="text-sm text-gray-500">
            No assets allocated to this goal yet.
          </p>
        ) : (
          <div className="space-y-3">
            {data.allocations.map((a: SerializedGoalAllocation) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-gray-900">{a.assetLabel}</p>
                  <p className="text-xs text-gray-500">
                    {a.mode.replace(/_/g, " ")} &middot; Effective: $
                    {a.effectiveValue.toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAllocation(a.id)}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Decision Impacts */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Decision Impacts
        </h2>
        <GoalImpactSection impacts={data.impacts} />
      </div>

      <Drawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit goal"
      >
        {editOpen && (
          <GoalForm initialData={data} onSuccess={handleEditSuccess} />
        )}
      </Drawer>
    </div>
  );
}
