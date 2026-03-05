import type { GuardrailStatus } from "@/types/decision.types";
import { formatCurrency } from "@/lib/format";

const verdictConfig: Record<
  GuardrailStatus,
  { bg: string; border: string; text: string; heading: string }
> = {
  PASS: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-800",
    heading: "Looks good",
  },
  CAUTION: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-800",
    heading: "Proceed with caution",
  },
  FAIL: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    heading: "Not recommended",
  },
};

interface VerdictBannerProps {
  verdict: GuardrailStatus;
  monthlySurplus: number;
  confidenceLevel: string;
}

export default function VerdictBanner({
  verdict,
  monthlySurplus,
  confidenceLevel,
}: VerdictBannerProps) {
  const config = verdictConfig[verdict];
  return (
    <div
      className={`rounded-lg border ${config.border} ${config.bg} p-5`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-lg font-bold ${config.text}`}>
            {config.heading}
          </p>
          <p className={`mt-1 text-sm ${config.text}`}>
            Monthly surplus after: {formatCurrency(monthlySurplus)}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${config.bg} ${config.text} border ${config.border}`}
        >
          {confidenceLevel} confidence
        </span>
      </div>
    </div>
  );
}
