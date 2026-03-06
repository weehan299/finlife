"use client";

import { useState } from "react";
import { liabilityInputSchema, liabilityCategorySchema } from "@/schemas/baseline.schema";
import type { SerializedLiability } from "@/types/baseline.types";

interface LiabilityFormProps {
  initialData?: SerializedLiability;
  defaultCategory?: string;
  onSuccess: () => void;
}

export default function LiabilityForm({ initialData, defaultCategory, onSuccess }: LiabilityFormProps) {
  const isEdit = !!initialData;
  const [category, setCategory] = useState(initialData?.category ?? defaultCategory ?? "CREDIT_CARD");
  const [label, setLabel] = useState(initialData?.label ?? "");
  const [balance, setBalance] = useState(initialData ? String(initialData.balance) : "");
  const [annualInterestRate, setAnnualInterestRate] = useState(
    initialData?.annualInterestRate != null ? String(initialData.annualInterestRate * 100) : "",
  );
  const [minimumPayment, setMinimumPayment] = useState(
    initialData?.minimumPayment != null ? String(initialData.minimumPayment) : "",
  );
  const [remainingTermMonths, setRemainingTermMonths] = useState(
    initialData?.remainingTermMonths != null ? String(initialData.remainingTermMonths) : "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      category,
      label,
      balance: balance === "" ? 0 : Number(balance),
      ...(annualInterestRate !== "" ? { annualInterestRate: Number(annualInterestRate) / 100 } : {}),
      ...(minimumPayment !== "" ? { minimumPayment: Number(minimumPayment) } : {}),
      ...(remainingTermMonths !== "" ? { remainingTermMonths: Number(remainingTermMonths) } : {}),
    };

    const result = liabilityInputSchema.safeParse(payload);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    try {
      const url = isEdit
        ? `/api/baseline/liabilities/${initialData.id}`
        : "/api/baseline/liabilities";
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
      const res = await fetch(`/api/baseline/liabilities/${initialData.id}`, {
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
        <label htmlFor="liability-category" className="block text-sm font-medium text-gray-700">
          Category
        </label>
        <select
          id="liability-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          {liabilityCategorySchema.options.map((opt) => (
            <option key={opt} value={opt}>{opt.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="liability-label" className="block text-sm font-medium text-gray-700">
          Label
        </label>
        <input
          id="liability-label"
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Visa Card"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="liability-balance" className="block text-sm font-medium text-gray-700">
          Balance
        </label>
        <div className="relative mt-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
          <input
            id="liability-balance"
            type="text"
            inputMode="decimal"
            value={balance}
            onChange={(e) => setBalance(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0"
            className="w-full rounded-md border border-gray-300 py-2 pl-7 pr-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="liability-rate" className="block text-sm font-medium text-gray-700">
          Annual interest rate (optional)
        </label>
        <div className="relative mt-1">
          <input
            id="liability-rate"
            type="text"
            inputMode="decimal"
            value={annualInterestRate}
            onChange={(e) => setAnnualInterestRate(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0"
            className="w-full rounded-md border border-gray-300 py-2 pl-3 pr-7 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
        </div>
      </div>

      <div>
        <label htmlFor="liability-payment" className="block text-sm font-medium text-gray-700">
          Minimum payment (optional)
        </label>
        <div className="relative mt-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
          <input
            id="liability-payment"
            type="text"
            inputMode="decimal"
            value={minimumPayment}
            onChange={(e) => setMinimumPayment(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0"
            className="w-full rounded-md border border-gray-300 py-2 pl-7 pr-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="liability-term" className="block text-sm font-medium text-gray-700">
          Remaining term in months (optional)
        </label>
        <input
          id="liability-term"
          type="text"
          inputMode="numeric"
          value={remainingTermMonths}
          onChange={(e) => setRemainingTermMonths(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="e.g. 60"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
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
          {submitting ? "Saving..." : isEdit ? "Update liability" : "Add liability"}
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
