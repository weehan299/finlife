"use client";

import { useState } from "react";
import type { SnapshotWithExtras } from "@/lib/snapshot";
import ComparisonTable from "./ComparisonTable";

interface DetailsCollapsibleProps {
  baseline: SnapshotWithExtras;
  postDecision: SnapshotWithExtras;
}

export default function DetailsCollapsible({
  baseline,
  postDecision,
}: DetailsCollapsibleProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-sm font-semibold text-gray-900">
          Full comparison details
        </span>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-gray-100 px-5 pb-5">
          <ComparisonTable baseline={baseline} postDecision={postDecision} />
        </div>
      )}
    </div>
  );
}
