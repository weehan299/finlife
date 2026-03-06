"use client";

import { useEffect, useRef } from "react";
import type { MetricCardId } from "@/components/metrics/SnapshotDisplay";
import type { SnapshotWithExtras } from "@/lib/snapshot";
import type { BaselineResponse } from "@/types/baseline.types";
import SurplusDetail from "./details/SurplusDetail";
import NetWorthDetail from "./details/NetWorthDetail";
import RunwayDetail from "./details/RunwayDetail";
import DebtLoadDetail from "./details/DebtLoadDetail";

interface MetricDetailPanelProps {
  selectedCard: MetricCardId | null;
  snapshot: SnapshotWithExtras;
  baseline: BaselineResponse;
}

function DetailContent({
  selectedCard,
  snapshot,
  baseline,
}: {
  selectedCard: MetricCardId;
  snapshot: SnapshotWithExtras;
  baseline: BaselineResponse;
}) {
  switch (selectedCard) {
    case "surplus":
      return <SurplusDetail snapshot={snapshot} baseline={baseline} />;
    case "netWorth":
      return <NetWorthDetail snapshot={snapshot} baseline={baseline} />;
    case "runway":
      return <RunwayDetail snapshot={snapshot} baseline={baseline} />;
    case "debtLoad":
      return <DebtLoadDetail snapshot={snapshot} baseline={baseline} />;
  }
}

export default function MetricDetailPanel({
  selectedCard,
  snapshot,
  baseline,
}: MetricDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const isOpen = selectedCard !== null;

  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isOpen, selectedCard]);

  return (
    <div
      className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
        isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      }`}
    >
      <div className="overflow-hidden">
        <div ref={panelRef} className="rounded-lg border border-gray-200 bg-white p-6 mt-4">
          {selectedCard && (
            <DetailContent
              selectedCard={selectedCard}
              snapshot={snapshot}
              baseline={baseline}
            />
          )}
        </div>
      </div>
    </div>
  );
}
