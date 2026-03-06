"use client";

import { useState } from "react";
import { assetInputSchema, assetCategorySchema } from "@/schemas/baseline.schema";
import type { SerializedAsset } from "@/types/baseline.types";

interface AssetFormProps {
  initialData?: SerializedAsset;
  defaultCategory?: string;
  onSuccess: () => void;
}

export default function AssetForm({ initialData, defaultCategory, onSuccess }: AssetFormProps) {
  const isEdit = !!initialData;
  const [category, setCategory] = useState(initialData?.category ?? defaultCategory ?? "SAVINGS");
  const [label, setLabel] = useState(initialData?.label ?? "");
  const [value, setValue] = useState(initialData ? String(initialData.value) : "");
  const [isLiquid, setIsLiquid] = useState(initialData?.isLiquid ?? false);
  const [monthlyContribution, setMonthlyContribution] = useState(
    initialData?.monthlyContribution != null ? String(initialData.monthlyContribution) : "",
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
      value: value === "" ? 0 : Number(value),
      isLiquid,
      ...(monthlyContribution !== "" ? { monthlyContribution: Number(monthlyContribution) } : {}),
    };

    const result = assetInputSchema.safeParse(payload);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    try {
      const url = isEdit
        ? `/api/baseline/assets/${initialData.id}`
        : "/api/baseline/assets";
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
      const res = await fetch(`/api/baseline/assets/${initialData.id}`, {
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
        <label htmlFor="asset-category" className="block text-sm font-medium text-gray-700">
          Category
        </label>
        <select
          id="asset-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          {assetCategorySchema.options.map((opt) => (
            <option key={opt} value={opt}>{opt.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="asset-label" className="block text-sm font-medium text-gray-700">
          Label
        </label>
        <input
          id="asset-label"
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Emergency Fund"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="asset-value" className="block text-sm font-medium text-gray-700">
          Value
        </label>
        <div className="relative mt-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
          <input
            id="asset-value"
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0"
            className="w-full rounded-md border border-gray-300 py-2 pl-7 pr-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="asset-contribution" className="block text-sm font-medium text-gray-700">
          Monthly contribution (optional)
        </label>
        <div className="relative mt-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
          <input
            id="asset-contribution"
            type="text"
            inputMode="decimal"
            value={monthlyContribution}
            onChange={(e) => setMonthlyContribution(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0"
            className="w-full rounded-md border border-gray-300 py-2 pl-7 pr-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="asset-liquid"
          type="checkbox"
          checked={isLiquid}
          onChange={(e) => setIsLiquid(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="asset-liquid" className="text-sm text-gray-700">
          Liquid (can be used for emergencies)
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
          {submitting ? "Saving..." : isEdit ? "Update asset" : "Add asset"}
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
