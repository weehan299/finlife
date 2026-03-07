import type { VerdictExplanation } from "@/types/decision.types";

interface DiagnosisSectionProps {
  explanation: VerdictExplanation;
}

export default function DiagnosisSection({ explanation }: DiagnosisSectionProps) {
  const hasIssues = explanation.primaryReason || explanation.secondaryReasons.length > 0;
  if (!hasIssues && explanation.positives.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">Why this happened</h3>

      {explanation.primaryReason && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">Primary concern</p>
          <p className="mt-1 text-sm text-red-700">{explanation.primaryReason}</p>
        </div>
      )}

      {explanation.secondaryReasons.length > 0 && (
        <div className="space-y-2">
          {explanation.secondaryReasons.map((reason, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3"
            >
              <span className="mt-0.5 text-xs font-bold text-amber-600">!</span>
              <p className="text-sm text-amber-800">{reason}</p>
            </div>
          ))}
        </div>
      )}

      {explanation.positives.length > 0 && (
        <div className="space-y-2">
          {explanation.positives.map((pos, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-3"
            >
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <p className="text-sm text-green-800">{pos}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
