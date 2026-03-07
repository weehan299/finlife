import type { ViabilityBreakpoint } from "@/types/decision.types";
import { formatCurrency } from "@/lib/format";

function formatBreakpointValue(value: number, unit: ViabilityBreakpoint["unit"]): string {
  switch (unit) {
    case "currency":
      return formatCurrency(value);
    case "percent":
      return `${Math.round(value * 100)}%`;
    case "months":
      return `${Math.round(value * 10) / 10} months`;
  }
}

interface ViabilitySectionProps {
  breakpoints: ViabilityBreakpoint[];
}

export default function ViabilitySection({ breakpoints }: ViabilitySectionProps) {
  if (breakpoints.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">What would make this viable</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {breakpoints.map((bp, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm font-medium text-gray-900">{bp.label}</p>
            <div className="mt-2 flex items-baseline gap-3">
              <div>
                <p className="text-xs text-gray-400">Current</p>
                <p className="text-sm font-semibold text-red-700">
                  {formatBreakpointValue(bp.currentValue, bp.unit)}
                </p>
              </div>
              <svg className="h-4 w-4 shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
              <div>
                <p className="text-xs text-gray-400">Needed</p>
                <p className="text-sm font-semibold text-green-700">
                  {formatBreakpointValue(bp.breakpointValue, bp.unit)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
