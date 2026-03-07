import type { EvaluateDecisionOutput, GuardrailStatus } from "@/types/decision.types";
import { formatCurrency } from "@/lib/format";
import ImpactCard from "./ImpactCard";

function findGuardrailStatus(
  guardrails: EvaluateDecisionOutput["guardrails"],
  key: string,
): GuardrailStatus {
  return guardrails.find((g) => g.key === key)?.status ?? "PASS";
}

interface ImpactCardRowProps {
  result: EvaluateDecisionOutput;
}

export default function ImpactCardRow({ result }: ImpactCardRowProps) {
  const { postDecisionSnapshot: post, guardrails } = result;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <ImpactCard
        label="Cash after decision"
        value={formatCurrency(post.liquidAssets)}
        target={`Emergency buffer: ${formatCurrency(post.monthlyExpenses * 6)}`}
        status={findGuardrailStatus(guardrails, "postDecisionCash")}
      />
      <ImpactCard
        label="Monthly buffer"
        value={formatCurrency(post.monthlySurplus)}
        target="Target: positive surplus"
        status={findGuardrailStatus(guardrails, "monthlySurplus")}
      />
      <ImpactCard
        label="Emergency runway"
        value={`${Math.round(post.emergencyRunwayMonths * 10) / 10} months`}
        target="Target: 6+ months"
        status={findGuardrailStatus(guardrails, "emergencyRunway")}
      />
    </div>
  );
}
