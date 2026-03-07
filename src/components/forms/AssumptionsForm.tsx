"use client";

import { useEffect, useState } from "react";
import { DEFAULT_ASSUMPTIONS } from "@/lib/defaults";

interface AssumptionsFormProps {
  onSuccess: () => void;
}

interface SettingsData {
  inflationRate: number;
  investmentGrowthRate: number;
  savingsInterestRate: number;
  debtInterestFallback: number;
  safeWithdrawalRate: number;
  retirementAge: number;
  minEmergencyMonths: number;
  minPostDecisionCash: number;
  minMonthlySurplus: number;
  maxDebtToIncome: number;
  maxHousingRatio: number;
}

const rateFields = [
  { key: "inflationRate", label: "Inflation rate" },
  { key: "investmentGrowthRate", label: "Investment growth rate" },
  { key: "savingsInterestRate", label: "Savings interest rate" },
  { key: "debtInterestFallback", label: "Debt interest (fallback)" },
  { key: "safeWithdrawalRate", label: "Safe withdrawal rate" },
] as const;

const guardrailFields = [
  { key: "retirementAge", label: "Retirement age", type: "int" as const },
  { key: "minEmergencyMonths", label: "Min emergency months", type: "int" as const },
  { key: "minPostDecisionCash", label: "Min post-decision cash ($)", type: "dollar" as const },
  { key: "minMonthlySurplus", label: "Min monthly surplus ($)", type: "dollar" as const },
  { key: "maxDebtToIncome", label: "Max debt-to-income", type: "pct" as const },
  { key: "maxHousingRatio", label: "Max housing ratio", type: "pct" as const },
] as const;

export default function AssumptionsForm({ onSuccess }: AssumptionsFormProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings");
        const json = await res.json();
        const data: SettingsData = json.ok ? json.data : DEFAULT_ASSUMPTIONS;
        const v: Record<string, string> = {};
        for (const f of rateFields) {
          v[f.key] = String(data[f.key] * 100);
        }
        for (const f of guardrailFields) {
          if (f.type === "pct") {
            v[f.key] = String((data[f.key as keyof SettingsData] as number) * 100);
          } else {
            v[f.key] = String(data[f.key as keyof SettingsData]);
          }
        }
        setValues(v);
      } catch {
        // use defaults
        const data = DEFAULT_ASSUMPTIONS;
        const v: Record<string, string> = {};
        for (const f of rateFields) {
          v[f.key] = String(data[f.key] * 100);
        }
        for (const f of guardrailFields) {
          if (f.type === "pct") {
            v[f.key] = String((data[f.key as keyof typeof data] as number) * 100);
          } else {
            v[f.key] = String(data[f.key as keyof typeof data]);
          }
        }
        setValues(v);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const payload: Record<string, number> = {};
      for (const f of rateFields) {
        payload[f.key] = parseFloat(values[f.key]) / 100;
      }
      for (const f of guardrailFields) {
        const raw = parseFloat(values[f.key]);
        if (f.type === "pct") {
          payload[f.key] = raw / 100;
        } else if (f.type === "int") {
          payload[f.key] = Math.round(raw);
        } else {
          payload[f.key] = raw;
        }
      }

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? "Failed to save");
        return;
      }
      onSuccess();
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="animate-pulse space-y-4 py-4">
      {[1, 2, 3].map((i) => <div key={i} className="h-10 rounded bg-gray-100" />)}
    </div>;
  }

  function updateField(key: string, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Growth Rates
        </h3>
        <div className="space-y-3">
          {rateFields.map((f) => (
            <label key={f.key} className="block">
              <span className="text-sm text-gray-600">{f.label} (%)</span>
              <input
                type="number"
                step="0.1"
                value={values[f.key] ?? ""}
                onChange={(e) => updateField(f.key, e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Guardrails
        </h3>
        <div className="space-y-3">
          {guardrailFields.map((f) => (
            <label key={f.key} className="block">
              <span className="text-sm text-gray-600">
                {f.label}{f.type === "pct" ? " (%)" : ""}
              </span>
              <input
                type="number"
                step={f.type === "int" ? "1" : f.type === "pct" ? "0.1" : "1"}
                value={values[f.key] ?? ""}
                onChange={(e) => updateField(f.key, e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </label>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
