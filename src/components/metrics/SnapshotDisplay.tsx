"use client";

import { useState } from "react";
import MetricCard from "@/components/ui/MetricCard";
import MetricDetailPanel from "@/components/metrics/MetricDetailPanel";
import { formatCurrency } from "@/lib/format";
import type { SnapshotWithExtras } from "@/lib/snapshot";
import { summarizeSnapshot } from "@/lib/snapshot";
import type { BaselineResponse } from "@/types/baseline.types";

export type MetricCardId = "surplus" | "netWorth" | "runway" | "debtLoad";

interface SnapshotDisplayProps {
  snapshot: SnapshotWithExtras;
  baseline: BaselineResponse;
}

export default function SnapshotDisplay({ snapshot, baseline }: SnapshotDisplayProps) {
  const [selectedCard, setSelectedCard] = useState<MetricCardId | null>(null);
  const summary = summarizeSnapshot(snapshot);
  const isDeficit = snapshot.monthlySurplus < 0;

  function toggle(id: MetricCardId) {
    setSelectedCard((prev) => (prev === id ? null : id));
  }

  return (
    <div>
      <div
        className={`mb-6 rounded-lg p-4 ${isDeficit ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}
      >
        <p className="text-sm font-medium">{summary}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Monthly Surplus"
          value={formatCurrency(Math.abs(snapshot.monthlySurplus))}
          subtitle={isDeficit ? "Deficit" : "Surplus"}
          status={isDeficit ? "negative" : "positive"}
          onClick={() => toggle("surplus")}
          selected={selectedCard === "surplus"}
        />
        <MetricCard
          label="Net Worth"
          value={formatCurrency(snapshot.netWorth)}
          status={snapshot.netWorth >= 0 ? "positive" : "negative"}
          onClick={() => toggle("netWorth")}
          selected={selectedCard === "netWorth"}
        />
        <MetricCard
          label="Emergency Runway"
          value={`${Math.round(snapshot.emergencyRunwayMonths * 10) / 10} mo`}
          subtitle="Liquid savings ÷ expenses"
          status={snapshot.emergencyRunwayMonths >= 6 ? "positive" : "negative"}
          onClick={() => toggle("runway")}
          selected={selectedCard === "runway"}
        />
        <MetricCard
          label="Debt Load"
          value={formatCurrency(snapshot.totalLiabilities)}
          subtitle={
            snapshot.debtToIncomeRatio > 0
              ? `${Math.round(snapshot.debtToIncomeRatio * 100)}% of annual income`
              : undefined
          }
          status={snapshot.totalLiabilities === 0 ? "positive" : "neutral"}
          onClick={() => toggle("debtLoad")}
          selected={selectedCard === "debtLoad"}
        />
      </div>

      <MetricDetailPanel
        selectedCard={selectedCard}
        snapshot={snapshot}
        baseline={baseline}
      />
    </div>
  );
}
