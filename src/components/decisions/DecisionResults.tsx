import type { EvaluateDecisionOutput } from "@/types/decision.types";
import NarrativeVerdict from "./NarrativeVerdict";
import ImpactCardRow from "./ImpactCardRow";
import UpfrontImpactSection from "./UpfrontImpactSection";
import MonthlyAffordability from "./MonthlyAffordability";
import ResilienceSection from "./ResilienceSection";
import DiagnosisSection from "./DiagnosisSection";
import ViabilitySection from "./ViabilitySection";
import DetailsCollapsible from "./DetailsCollapsible";
import VerdictBanner from "./VerdictBanner";
import ComparisonTable from "./ComparisonTable";
import StressTestSection from "./StressTestSection";

interface DecisionResultsProps {
  result: EvaluateDecisionOutput;
}

export default function DecisionResults({ result }: DecisionResultsProps) {
  const { narrative } = result;

  // Legacy fallback for saved decisions without narrative data
  if (!narrative) {
    return (
      <div className="space-y-6">
        <VerdictBanner
          verdict={result.verdict}
          monthlySurplus={result.postDecisionSnapshot.monthlySurplus}
          confidenceLevel={result.confidenceLevel}
        />
        <div>
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Before vs. after</h3>
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

  const reserveTarget =
    result.postDecisionSnapshot.monthlyExpenses * 6;

  return (
    <div className="space-y-6">
      <NarrativeVerdict
        verdict={result.verdict}
        explanation={narrative.verdictExplanation}
        confidenceLevel={result.confidenceLevel}
      />

      <ImpactCardRow result={result} />

      <UpfrontImpactSection
        steps={narrative.upfrontWaterfall}
        reserveTarget={reserveTarget}
      />

      <MonthlyAffordability breakdown={narrative.monthlyBreakdown} />

      <ResilienceSection resilience={narrative.resilienceData} />

      <DiagnosisSection explanation={narrative.verdictExplanation} />

      <ViabilitySection breakpoints={narrative.viabilityBreakpoints} />

      <DetailsCollapsible
        baseline={result.baselineSnapshot}
        postDecision={result.postDecisionSnapshot}
      />
    </div>
  );
}
