"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { DecisionSummary, GuardrailStatus } from "@/types/decision.types";
import { formatCurrency } from "@/lib/format";

const verdictColors: Record<GuardrailStatus, string> = {
  PASS: "bg-green-100 text-green-800",
  CAUTION: "bg-amber-100 text-amber-800",
  FAIL: "bg-red-100 text-red-800",
};

const templateLabels: Record<string, string> = {
  HOME_PURCHASE: "Buy a home",
  NEW_LOAN: "Take a loan",
  LARGE_PURCHASE: "Large purchase",
  INCOME_LOSS: "Income loss",
  RECURRING_EXPENSE: "Recurring expense",
  ONE_TIME_EXPENSE: "One-time expense",
};

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<DecisionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/decisions")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setDecisions(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Decisions</h1>
        <Link
          href="/decisions/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          New decision
        </Link>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}

      {!loading && decisions.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-500">No decisions yet.</p>
          <Link
            href="/decisions/new"
            className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-800"
          >
            Check your first decision
          </Link>
        </div>
      )}

      {!loading && decisions.length > 0 && (
        <div className="space-y-3">
          {decisions.map((d) => (
            <Link
              key={d.id}
              href={`/decisions/${d.id}`}
              className="block rounded-lg border border-gray-200 bg-white p-4 transition hover:border-blue-400 hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{d.name}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    {templateLabels[d.template] ?? d.template}
                    {d.computedMonthlyImpact != null &&
                      ` · ${formatCurrency(d.computedMonthlyImpact)}/mo impact`}
                  </p>
                </div>
                {d.verdict && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${verdictColors[d.verdict]}`}
                  >
                    {d.verdict}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
