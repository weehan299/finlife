import type { GuardrailStatus, VerdictExplanation } from "@/types/decision.types";

const verdictConfig: Record<
  GuardrailStatus,
  { bg: string; border: string; text: string; badge: string }
> = {
  PASS: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-800",
    badge: "Recommended",
  },
  CAUTION: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-800",
    badge: "Proceed with caution",
  },
  FAIL: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    badge: "Not recommended",
  },
};

interface NarrativeVerdictProps {
  verdict: GuardrailStatus;
  explanation: VerdictExplanation;
  confidenceLevel: string;
}

export default function NarrativeVerdict({
  verdict,
  explanation,
  confidenceLevel,
}: NarrativeVerdictProps) {
  const config = verdictConfig[verdict];
  return (
    <div className={`rounded-lg border ${config.border} ${config.bg} p-5`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={`text-sm font-semibold uppercase tracking-wide ${config.text}`}>
            {config.badge}
          </p>
          <p className={`mt-2 text-base leading-relaxed ${config.text}`}>
            {explanation.headline}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${config.bg} ${config.text} ${config.border}`}
        >
          {confidenceLevel} confidence
        </span>
      </div>
    </div>
  );
}
