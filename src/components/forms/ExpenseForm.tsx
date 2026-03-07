"use client";

import { useState } from "react";
import { expenseInputSchema, expenseCategorySchema } from "@/schemas/baseline.schema";
import type { SerializedExpense } from "@/types/baseline.types";

interface ExpenseFormProps {
  initialData?: SerializedExpense;
  defaultCategory?: string;
  onSuccess: () => void;
}

export default function ExpenseForm({ initialData, defaultCategory, onSuccess }: ExpenseFormProps) {
  const isEdit = !!initialData;
  const [category, setCategory] = useState(initialData?.category ?? defaultCategory ?? "ESSENTIAL");
  const [label, setLabel] = useState(initialData?.label ?? "");
  const [monthlyAmount, setMonthlyAmount] = useState(
    initialData ? String(initialData.monthlyAmount) : "",
  );
  const [isVariable, setIsVariable] = useState(initialData?.isVariable ?? false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      category,
      label,
      monthlyAmount: monthlyAmount === "" ? 0 : Number(monthlyAmount),
      isVariable,
    };

    const result = expenseInputSchema.safeParse(payload);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    try {
      const url = isEdit
        ? `/api/baseline/expenses/${initialData.id}`
        : "/api/baseline/expenses";
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
      const res = await fetch(`/api/baseline/expenses/${initialData.id}`, {
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
        <label htmlFor="expense-category" className="block text-sm font-medium text-gray-700">
          Category
        </label>
        <select
          id="expense-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          {expenseCategorySchema.options.map((opt) => (
            <option key={opt} value={opt}>{opt.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="expense-label" className="block text-sm font-medium text-gray-700">
          Label
        </label>
        <input
          id="expense-label"
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Monthly Rent"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="expense-amount" className="block text-sm font-medium text-gray-700">
          Monthly amount
        </label>
        <div className="relative mt-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
          <input
            id="expense-amount"
            type="text"
            inputMode="decimal"
            value={monthlyAmount}
            onChange={(e) => setMonthlyAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0"
            className="w-full rounded-md border border-gray-300 py-2 pl-7 pr-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="expense-variable"
          type="checkbox"
          checked={isVariable}
          onChange={(e) => setIsVariable(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="expense-variable" className="text-sm text-gray-700">
          Changes month to month
        </label>
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
          {submitting ? "Saving..." : isEdit ? "Update expense" : "Add expense"}
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
