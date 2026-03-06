"use client";

import { useState } from "react";
import { createGoalSchema } from "@/schemas/goal.schema";
import { goalTypeSchema } from "@/schemas/goal.schema";
import type { SerializedGoal } from "@/types/goal.types";

interface GoalFormProps {
  initialData?: SerializedGoal;
  onSuccess: () => void;
}

export default function GoalForm({ initialData, onSuccess }: GoalFormProps) {
  const isEdit = !!initialData;
  const [type, setType] = useState(initialData?.type ?? "SAVINGS");
  const [name, setName] = useState(initialData?.name ?? "");
  const [targetAmount, setTargetAmount] = useState(
    initialData ? String(initialData.targetAmount) : "",
  );
  const [targetDate, setTargetDate] = useState(
    initialData?.targetDate ? initialData.targetDate.slice(0, 10) : "",
  );
  const [startingAmount, setStartingAmount] = useState(
    initialData ? String(initialData.startingAmount) : "",
  );
  const [monthlyContribution, setMonthlyContribution] = useState(
    initialData ? String(initialData.monthlyContribution) : "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      type,
      name,
      targetAmount: targetAmount === "" ? 0 : Number(targetAmount),
      ...(targetDate ? { targetDate: new Date(targetDate).toISOString() } : {}),
      startingAmount: startingAmount === "" ? 0 : Number(startingAmount),
      monthlyContribution:
        monthlyContribution === "" ? 0 : Number(monthlyContribution),
    };

    if (!isEdit) {
      const result = createGoalSchema.safeParse(payload);
      if (!result.success) {
        setError(result.error.issues[0].message);
        return;
      }
    }

    setSubmitting(true);
    try {
      const url = isEdit ? `/api/goals/${initialData.id}` : "/api/goals";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? "Something went wrong.");
        return;
      }
      onSuccess();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!initialData) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/goals/${initialData.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? "Failed to delete.");
        return;
      }
      onSuccess();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="goal-type" className="block text-sm font-medium text-gray-700">
          Goal type
        </label>
        <select
          id="goal-type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          {goalTypeSchema.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="goal-name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          id="goal-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Emergency Fund"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="goal-target" className="block text-sm font-medium text-gray-700">
          Target amount
        </label>
        <div className="relative mt-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            $
          </span>
          <input
            id="goal-target"
            type="text"
            inputMode="decimal"
            value={targetAmount}
            onChange={(e) =>
              setTargetAmount(e.target.value.replace(/[^0-9.]/g, ""))
            }
            placeholder="0"
            className="w-full rounded-md border border-gray-300 py-2 pl-7 pr-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="goal-date" className="block text-sm font-medium text-gray-700">
          Target date (optional)
        </label>
        <input
          id="goal-date"
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="goal-starting" className="block text-sm font-medium text-gray-700">
          Starting amount
        </label>
        <div className="relative mt-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            $
          </span>
          <input
            id="goal-starting"
            type="text"
            inputMode="decimal"
            value={startingAmount}
            onChange={(e) =>
              setStartingAmount(e.target.value.replace(/[^0-9.]/g, ""))
            }
            placeholder="0"
            className="w-full rounded-md border border-gray-300 py-2 pl-7 pr-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="goal-contribution" className="block text-sm font-medium text-gray-700">
          Monthly contribution
        </label>
        <div className="relative mt-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            $
          </span>
          <input
            id="goal-contribution"
            type="text"
            inputMode="decimal"
            value={monthlyContribution}
            onChange={(e) =>
              setMonthlyContribution(e.target.value.replace(/[^0-9.]/g, ""))
            }
            placeholder="0"
            className="w-full rounded-md border border-gray-300 py-2 pl-7 pr-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-md bg-blue-600 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Saving..." : isEdit ? "Update goal" : "Add goal"}
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-md border border-red-300 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        )}
      </div>
    </form>
  );
}
