"use client";

import { useState } from "react";
import type { BaselineResponse } from "@/types/baseline.types";

interface QuickSetupFormProps {
  onComplete: (data: BaselineResponse) => void;
}

const fields = [
  {
    name: "monthlyTakeHome",
    label: "Monthly take-home pay",
    helper: "After taxes and deductions",
  },
  {
    name: "monthlyEssentialExpenses",
    label: "Essential monthly expenses",
    helper: "Rent, utilities, groceries, insurance",
  },
  {
    name: "totalDebt",
    label: "Total debt",
    helper: "Credit cards, loans, mortgage balance",
  },
  {
    name: "totalSavings",
    label: "Liquid savings",
    helper: "Checking + savings accounts",
  },
  {
    name: "totalInvestments",
    label: "Investments & retirement",
    helper: "401k, IRA, brokerage accounts",
  },
] as const;

type FieldName = (typeof fields)[number]["name"];

export default function QuickSetupForm({ onComplete }: QuickSetupFormProps) {
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [values, setValues] = useState<Record<FieldName, string>>({
    monthlyTakeHome: "",
    monthlyEssentialExpenses: "",
    totalDebt: "",
    totalSavings: "",
    totalInvestments: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(name: FieldName, raw: string) {
    const cleaned = raw.replace(/[^0-9.]/g, "");
    setValues((prev) => ({ ...prev, [name]: cleaned }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const nums: Record<string, number> = {};
    for (const f of fields) {
      const v = values[f.name];
      nums[f.name] = v === "" ? 0 : Number(v);
      if (isNaN(nums[f.name]) || nums[f.name] < 0) {
        setError(`${f.label} must be a non-negative number.`);
        return;
      }
    }

    if (!dateOfBirth) {
      setError("Date of birth is required.");
      return;
    }

    const hasValue = Object.values(nums).some((n) => n > 0);
    if (!hasValue) {
      setError("Please fill in at least one field.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/baseline", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...nums, dateOfBirth }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error?.message ?? "Something went wrong.");
        return;
      }
      onComplete(json.data as BaselineResponse);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg py-12">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">
        Quick financial setup
      </h1>
      <p className="mb-6 text-gray-500">
        Enter what you know — you can refine these numbers later.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="dateOfBirth"
            className="block text-sm font-medium text-gray-700"
          >
            Date of birth
          </label>
          <input
            id="dateOfBirth"
            type="date"
            required
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 py-2 px-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-400">
            Helps calculate things like years to retirement
          </p>
        </div>

        {fields.map((f) => (
          <div key={f.name}>
            <label
              htmlFor={f.name}
              className="block text-sm font-medium text-gray-700"
            >
              {f.label}
            </label>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                $
              </span>
              <input
                id={f.name}
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={values[f.name]}
                onChange={(e) => handleChange(f.name, e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 pl-7 pr-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">{f.helper}</p>
          </div>
        ))}

        {error && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-blue-600 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Saving…" : "See my financial picture"}
        </button>
      </form>
    </div>
  );
}
