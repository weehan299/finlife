"use client";

import { useState } from "react";
import type { DecisionTemplate } from "@/types/decision.types";

interface FieldDef {
  name: string;
  label: string;
  helper: string;
  type: "currency" | "number" | "percent" | "text";
  required?: boolean;
}

const templateFields: Record<DecisionTemplate, FieldDef[]> = {
  HOME_PURCHASE: [
    { name: "purchasePrice", label: "Purchase price", helper: "Total home price", type: "currency", required: true },
    { name: "downPaymentAmount", label: "Down payment", helper: "Amount you'll pay upfront", type: "currency", required: true },
    { name: "mortgageTermMonths", label: "Mortgage term (months)", helper: "e.g. 360 for 30 years", type: "number", required: true },
    { name: "annualInterestRate", label: "Annual interest rate", helper: "e.g. 6.5 for 6.5%", type: "percent", required: true },
    { name: "annualPropertyTaxRate", label: "Property tax rate", helper: "e.g. 1.2 for 1.2% (defaults to 1.2%)", type: "percent" },
    { name: "monthlyInsurance", label: "Monthly insurance", helper: "Homeowner's insurance (defaults to $150)", type: "currency" },
    { name: "annualMaintenanceRate", label: "Annual maintenance rate", helper: "e.g. 1 for 1% of home value (defaults to 1%)", type: "percent" },
    { name: "currentRentMonthly", label: "Current monthly rent", helper: "Rent you'll stop paying", type: "currency" },
  ],
  NEW_LOAN: [
    { name: "loanAmount", label: "Loan amount", helper: "Total amount to borrow", type: "currency", required: true },
    { name: "annualInterestRate", label: "Annual interest rate", helper: "e.g. 7.5 for 7.5%", type: "percent", required: true },
    { name: "termMonths", label: "Term (months)", helper: "Loan repayment period", type: "number", required: true },
    { name: "purpose", label: "Purpose", helper: "What is this loan for?", type: "text" },
  ],
  LARGE_PURCHASE: [
    { name: "purchasePrice", label: "Total price", helper: "Full purchase amount", type: "currency", required: true },
    { name: "upfrontPayment", label: "Upfront payment", helper: "Amount paid now", type: "currency", required: true },
    { name: "financedAmount", label: "Financed amount", helper: "Amount financed (defaults to price minus upfront)", type: "currency" },
    { name: "financedTermMonths", label: "Financing term (months)", helper: "Repayment period", type: "number" },
    { name: "financedInterestRate", label: "Financing interest rate", helper: "e.g. 5.0 for 5%", type: "percent" },
  ],
  INCOME_LOSS: [
    { name: "incomeReductionMonthly", label: "Monthly income reduction", helper: "How much less per month?", type: "currency", required: true },
    { name: "durationMonths", label: "Expected duration (months)", helper: "How long will income be reduced?", type: "number" },
    { name: "expenseReductionRate", label: "Expense reduction", helper: "e.g. 20 for 20% cut in discretionary spending", type: "percent" },
  ],
  RECURRING_EXPENSE: [
    { name: "monthlyAmount", label: "Monthly amount", helper: "New monthly cost", type: "currency", required: true },
    { name: "durationMonths", label: "Duration (months)", helper: "How long? (leave blank for ongoing)", type: "number" },
    { name: "description", label: "Description", helper: "What is this expense?", type: "text" },
  ],
  ONE_TIME_EXPENSE: [
    { name: "amount", label: "Amount", helper: "Total one-time cost", type: "currency", required: true },
    { name: "description", label: "Description", helper: "What is this for?", type: "text" },
  ],
};

interface DecisionInputFormProps {
  template: DecisionTemplate;
  onEvaluate: (inputs: Record<string, unknown>) => void;
  loading: boolean;
  hasResults: boolean;
}

export default function DecisionInputForm({
  template,
  onEvaluate,
  loading,
  hasResults,
}: DecisionInputFormProps) {
  const fields = templateFields[template];
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.name, ""])),
  );
  const [error, setError] = useState<string | null>(null);

  function handleChange(name: string, raw: string, type: string) {
    const cleaned = type === "text" ? raw : raw.replace(/[^0-9.]/g, "");
    setValues((prev) => ({ ...prev, [name]: cleaned }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed: Record<string, unknown> = {};
    for (const f of fields) {
      const raw = values[f.name];
      if (f.type === "text") {
        if (raw) parsed[f.name] = raw;
        continue;
      }
      if (!raw && f.required) {
        setError(`${f.label} is required.`);
        return;
      }
      if (!raw) continue;
      let num = Number(raw);
      if (isNaN(num) || num < 0) {
        setError(`${f.label} must be a non-negative number.`);
        return;
      }
      if (f.type === "percent") {
        num = num / 100;
      }
      parsed[f.name] = num;
    }

    onEvaluate(parsed);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map((f) => (
        <div key={f.name}>
          <label
            htmlFor={f.name}
            className="block text-sm font-medium text-gray-700"
          >
            {f.label}
            {f.required && <span className="text-red-400"> *</span>}
          </label>
          <div className="relative mt-1">
            {f.type === "currency" && (
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                $
              </span>
            )}
            {f.type === "percent" && (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                %
              </span>
            )}
            <input
              id={f.name}
              type="text"
              inputMode={f.type === "text" ? "text" : "decimal"}
              placeholder={f.type === "text" ? "" : "0"}
              value={values[f.name]}
              onChange={(e) => handleChange(f.name, e.target.value, f.type)}
              className={`w-full rounded-md border border-gray-300 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                f.type === "currency" ? "pl-7 pr-3" : f.type === "percent" ? "pl-3 pr-8" : "px-3"
              }`}
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
        disabled={loading}
        className="w-full rounded-md bg-blue-600 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Evaluating..." : hasResults ? "Re-evaluate" : "Evaluate decision"}
      </button>
    </form>
  );
}
