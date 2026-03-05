"use client";

import { useState } from "react";
import type { DecisionTemplate, EvaluateDecisionOutput } from "@/types/decision.types";
import TemplatePicker from "@/components/decisions/TemplatePicker";
import DecisionInputForm from "@/components/decisions/DecisionInputForm";
import DecisionResults from "@/components/decisions/DecisionResults";

type Step = "pick-template" | "input-form" | "results";

export default function DecisionWorkspace() {
  const [step, setStep] = useState<Step>("pick-template");
  const [template, setTemplate] = useState<DecisionTemplate | null>(null);
  const [result, setResult] = useState<EvaluateDecisionOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastInputs, setLastInputs] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  function handleTemplatePick(t: DecisionTemplate) {
    setTemplate(t);
    setResult(null);
    setSavedId(null);
    setStep("input-form");
  }

  async function handleEvaluate(inputs: Record<string, unknown>) {
    if (!template) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/decisions/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template, inputs }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error?.message ?? "Evaluation failed.");
        return;
      }
      setResult(json.data as EvaluateDecisionOutput);
      setLastInputs(inputs);
      setSavedId(null);
      setStep("results");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!template || !result) return;
    setSaving(true);
    setError(null);

    const name = prompt("Name this decision:");
    if (!name) {
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template,
          name,
          inputs: lastInputs,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error?.message ?? "Failed to save.");
        return;
      }
      setSavedId(json.data.id);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (step === "pick-template") {
    return <TemplatePicker onSelect={handleTemplatePick} />;
  }

  return (
    <div className="mx-auto max-w-4xl py-8">
      <button
        onClick={() => {
          setStep("pick-template");
          setTemplate(null);
          setResult(null);
          setSavedId(null);
        }}
        className="mb-6 text-sm text-blue-600 hover:text-blue-800"
      >
        &larr; Choose a different scenario
      </button>

      <div className={result ? "grid gap-8 lg:grid-cols-5" : ""}>
        <div className={result ? "lg:col-span-2" : "mx-auto max-w-lg"}>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Scenario details
          </h2>
          <DecisionInputForm
            template={template!}
            onEvaluate={handleEvaluate}
            loading={loading}
            hasResults={!!result}
          />
        </div>

        {result && (
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Results</h2>
              {!savedId ? (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save decision"}
                </button>
              ) : (
                <span className="text-sm text-green-700">Saved</span>
              )}
            </div>
            <DecisionResults result={result} />
          </div>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
