"use client";

import { useEffect, useState } from "react";
import type { BaselineResponse } from "@/types/baseline.types";
import { computeSnapshot } from "@/lib/snapshot";
import type { SnapshotWithExtras } from "@/lib/snapshot";
import IntentSelector from "@/components/IntentSelector";
import QuickSetupForm from "@/components/forms/QuickSetupForm";
import SnapshotDisplay from "@/components/metrics/SnapshotDisplay";
import NextActions from "@/components/NextActions";

type Step = "loading" | "intent" | "setup" | "snapshot";

export default function OverviewContent() {
  const [step, setStep] = useState<Step>("loading");
  const [snapshot, setSnapshot] = useState<SnapshotWithExtras | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/baseline");
        const json = await res.json();
        if (!json.ok) {
          setStep("intent");
          return;
        }
        const data = json.data as BaselineResponse;
        const hasData =
          data.assets.length > 0 ||
          data.liabilities.length > 0 ||
          data.incomes.length > 0 ||
          data.expenses.length > 0;

        if (hasData) {
          setSnapshot(computeSnapshot(data));
          setStep("snapshot");
        } else {
          setStep("intent");
        }
      } catch {
        setStep("intent");
      }
    }
    load();
  }, []);

  function handleSetupComplete(data: BaselineResponse) {
    setSnapshot(computeSnapshot(data));
    setStep("snapshot");
  }

  if (step === "loading") {
    return (
      <div className="space-y-4 py-12">
        <div className="mx-auto h-6 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mx-auto h-4 w-64 animate-pulse rounded bg-gray-100" />
        <div className="mx-auto grid max-w-2xl grid-cols-2 gap-4 pt-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg bg-gray-100"
            />
          ))}
        </div>
      </div>
    );
  }

  if (step === "intent") {
    return <IntentSelector onSelect={() => setStep("setup")} />;
  }

  if (step === "setup") {
    return <QuickSetupForm onComplete={handleSetupComplete} />;
  }

  return (
    <div className="py-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        Your Financial Overview
      </h1>
      {snapshot && <SnapshotDisplay snapshot={snapshot} />}
      <NextActions />
    </div>
  );
}
