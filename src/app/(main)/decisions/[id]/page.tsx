"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type {
  EvaluateDecisionOutput,
  DecisionTemplate,
  GuardrailStatus,
} from "@/types/decision.types";
import { formatCurrency } from "@/lib/format";
import DecisionResults from "@/components/decisions/DecisionResults";

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

interface DecisionDetail {
  id: string;
  template: DecisionTemplate;
  name: string;
  status: string;
  verdict: GuardrailStatus | null;
  confidenceLevel: string | null;
  upfrontAmount: number | null;
  monthlyImpact: number | null;
  resultSnapshot: EvaluateDecisionOutput | null;
  createdAt: string;
  updatedAt: string;
  evaluatedAt: string | null;
}

export default function DecisionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [decision, setDecision] = useState<DecisionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/decisions/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          setDecision(json.data);
        } else {
          setError(json.error?.message ?? "Failed to load decision");
        }
      })
      .catch(() => setError("Failed to load decision"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <p className="text-gray-500">Loading...</p>;
  }

  if (error || !decision) {
    return (
      <div>
        <Link
          href="/decisions"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          &larr; Back to decisions
        </Link>
        <p className="mt-4 text-red-600">{error ?? "Decision not found"}</p>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/decisions"
        className="text-sm text-blue-600 hover:text-blue-800"
      >
        &larr; Back to decisions
      </Link>

      <div className="mt-4 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">
            {decision.name}
          </h1>
          {decision.verdict && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${verdictColors[decision.verdict]}`}
            >
              {decision.verdict}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {templateLabels[decision.template] ?? decision.template}
          {decision.monthlyImpact != null &&
            ` · ${formatCurrency(decision.monthlyImpact)}/mo impact`}
          {decision.evaluatedAt &&
            ` · Evaluated ${new Date(decision.evaluatedAt).toLocaleDateString()}`}
        </p>
      </div>

      {decision.resultSnapshot ? (
        <DecisionResults result={decision.resultSnapshot} />
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-500">
            This decision has not been evaluated yet.
          </p>
        </div>
      )}
    </div>
  );
}
