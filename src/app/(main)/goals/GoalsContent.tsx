"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { GoalWithProgress } from "@/types/goal.types";
import GoalCard from "@/components/goals/GoalCard";
import GoalForm from "@/components/forms/GoalForm";
import Drawer from "@/components/ui/Drawer";

type DrawerState =
  | { open: false }
  | { open: true; mode: "add" }
  | { open: true; mode: "edit"; goal: GoalWithProgress };

export default function GoalsContent() {
  const router = useRouter();
  const [goals, setGoals] = useState<GoalWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState<DrawerState>({ open: false });

  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch("/api/goals");
      const json = await res.json();
      if (json.ok) {
        setGoals(json.data);
      }
    } catch {
      // keep current state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  function handleDrawerSuccess() {
    setDrawer({ open: false });
    fetchGoals();
  }

  if (loading) {
    return (
      <div className="space-y-4 py-12">
        <div className="mx-auto h-6 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 pt-4 sm:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  const drawerTitle = drawer.open
    ? drawer.mode === "add"
      ? "Add goal"
      : "Edit goal"
    : "";

  return (
    <div className="py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Goals</h1>
        <button
          type="button"
          onClick={() => setDrawer({ open: true, mode: "add" })}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          + Add Goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">No goals yet. Create your first goal to start tracking progress.</p>
          <button
            type="button"
            onClick={() => setDrawer({ open: true, mode: "add" })}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Create a Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onClick={() => router.push(`/goals/${goal.id}`)}
            />
          ))}
        </div>
      )}

      <Drawer
        open={drawer.open}
        onClose={() => setDrawer({ open: false })}
        title={drawerTitle}
      >
        {drawer.open && (
          <GoalForm
            initialData={drawer.mode === "edit" ? drawer.goal : undefined}
            onSuccess={handleDrawerSuccess}
          />
        )}
      </Drawer>
    </div>
  );
}
