"use client";

import { useState, useRef, useEffect } from "react";
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
  onAddItem?: (entityType: string, category?: string) => void;
  onEditItem?: (entityType: string, id: string) => void;
}

const addOptions = [
  { type: "income", label: "Add income" },
  { type: "expense", label: "Add expense" },
  { type: "asset", label: "Add asset" },
  { type: "liability", label: "Add liability" },
] as const;

export default function SnapshotDisplay({ snapshot, baseline, onAddItem, onEditItem }: SnapshotDisplayProps) {
  const [selectedCard, setSelectedCard] = useState<MetricCardId | null>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const summary = summarizeSnapshot(snapshot);
  const isDeficit = snapshot.monthlySurplus < 0;

  useEffect(() => {
    if (!addMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setAddMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [addMenuOpen]);

  function toggle(id: MetricCardId) {
    setSelectedCard((prev) => (prev === id ? null : id));
  }

  return (
    <div>
      <div
        className={`mb-6 flex items-center justify-between rounded-lg p-4 ${isDeficit ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}
      >
        <p className="text-sm font-medium">{summary}</p>
        {onAddItem && (
          <div className="relative" ref={addMenuRef}>
            <button
              type="button"
              onClick={() => setAddMenuOpen((v) => !v)}
              className="flex items-center gap-1 rounded-md bg-white/80 px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add
            </button>
            {addMenuOpen && (
              <div className="absolute right-0 z-10 mt-1 w-40 rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5">
                {addOptions.map((opt) => (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => {
                      setAddMenuOpen(false);
                      onAddItem(opt.type);
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
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
          subtitle="Liquid savings / expenses"
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
        onAddItem={onAddItem}
        onEditItem={onEditItem}
      />
    </div>
  );
}
