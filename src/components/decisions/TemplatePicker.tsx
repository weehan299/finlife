"use client";

import type { DecisionTemplate } from "@/types/decision.types";

const templates: {
  id: DecisionTemplate;
  title: string;
  description: string;
}[] = [
  {
    id: "HOME_PURCHASE",
    title: "Buy a home",
    description: "See if you can afford a home purchase with mortgage",
  },
  {
    id: "NEW_LOAN",
    title: "Take a loan",
    description: "Evaluate a new personal, auto, or student loan",
  },
  {
    id: "LARGE_PURCHASE",
    title: "Large purchase",
    description: "Check the impact of a major one-time buy",
  },
  {
    id: "INCOME_LOSS",
    title: "Stress test income loss",
    description: "What happens if your income drops?",
  },
  {
    id: "RECURRING_EXPENSE",
    title: "Custom recurring expense",
    description: "Add a new monthly cost to your plan",
  },
  {
    id: "ONE_TIME_EXPENSE",
    title: "Custom one-time expense",
    description: "See how a single expense affects your safety net",
  },
];

interface TemplatePickerProps {
  onSelect: (template: DecisionTemplate) => void;
}

export default function TemplatePicker({ onSelect }: TemplatePickerProps) {
  return (
    <div className="mx-auto max-w-2xl py-12">
      <h1 className="mb-2 text-center text-3xl font-bold text-gray-900">
        What decision are you considering?
      </h1>
      <p className="mb-8 text-center text-gray-500">
        Pick a scenario and we&apos;ll check how it affects your finances.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className="rounded-lg border border-gray-200 bg-white p-6 text-left transition hover:border-blue-400 hover:shadow-md"
          >
            <p className="text-lg font-semibold text-gray-900">{t.title}</p>
            <p className="mt-1 text-sm text-gray-500">{t.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
