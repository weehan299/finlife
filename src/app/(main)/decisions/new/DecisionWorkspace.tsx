"use client";

import { useEffect, useRef, useState } from "react";
import { buildDecisionName } from "@/lib/decision-name";
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
  const [decisionName, setDecisionName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  function showToast(message: string) {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 2800);
  }

  function handleTemplatePick(t: DecisionTemplate) {
    setTemplate(t);
    setResult(null);
    setLastInputs(null);
    setSavedId(null);
    setError(null);
    setDecisionName("");
    setNameTouched(false);
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
      const suggestedName = buildDecisionName(template, inputs);
      if (!nameTouched || decisionName.trim() === "") {
        setDecisionName(suggestedName);
      }
      setStep("results");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!template || !result || !lastInputs) return;
    setSaving(true);
    setError(null);
    const fallbackName = buildDecisionName(template, lastInputs);
    const finalName = decisionName.trim() || fallbackName;

    try {
      const res = await fetch("/api/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template,
          name: finalName,
          inputs: lastInputs,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error?.message ?? "Failed to save.");
        return;
      }
      setSavedId(json.data.id);
      setDecisionName(finalName);
      showToast("Decision saved");
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
          setLastInputs(null);
          setSavedId(null);
          setError(null);
          setDecisionName("");
          setNameTouched(false);
        }}
        className="mb-4 text-sm text-blue-600 hover:text-blue-800"
      >
        &larr; Choose a different scenario
      </button>

      <h1 className="mb-6 text-2xl font-semibold text-gray-900">New decision</h1>

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
              {savedId && (
                <span className="text-sm text-green-700">Saved</span>
              )}
            </div>
            <DecisionResults result={result} />

            {!savedId && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <label
                  htmlFor="decision-name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Decision name <span className="text-gray-500">(optional)</span>
                </label>
                <input
                  id="decision-name"
                  type="text"
                  value={decisionName}
                  onChange={(e) => {
                    setDecisionName(e.target.value);
                    setNameTouched(true);
                  }}
                  placeholder="Auto-filled after evaluation"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={handleSave}
                  disabled={saving || !lastInputs}
                  className="mt-3 w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save decision"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800 shadow-sm">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
