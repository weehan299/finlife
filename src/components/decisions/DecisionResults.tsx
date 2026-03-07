import type { EvaluateDecisionOutput } from "@/types/decision.types";
import VerdictBanner from "./VerdictBanner";
import DecisionProjectionChart from "./DecisionProjectionChart";
import ComparisonTable from "./ComparisonTable";
import StressTestSection from "./StressTestSection";

interface DecisionResultsProps {
  result: EvaluateDecisionOutput;
}

export default function DecisionResults({ result }: DecisionResultsProps) {
  return (
    <div className="space-y-6">
      <VerdictBanner
        verdict={result.verdict}
        monthlySurplus={result.postDecisionSnapshot.monthlySurplus}
        confidenceLevel={result.confidenceLevel}
      />

      <DecisionProjectionChart result={result} />

      <div>
        <h3 className="mb-3 text-lg font-semibold text-gray-900">
          Before vs. after
        </h3>
        <ComparisonTable
          baseline={result.baselineSnapshot}
          postDecision={result.postDecisionSnapshot}
        />
      </div>

      <StressTestSection
        stressSnapshot={result.stressSnapshot}
        guardrails={result.guardrails}
      />
    </div>
  );
}
