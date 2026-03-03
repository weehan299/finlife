export type GuardrailStatus = "PASS" | "CAUTION" | "FAIL";

export interface GuardrailResult {
  key: string;
  label: string;
  status: GuardrailStatus;
  message: string;
}

export interface GoalImpactSummary {
  goalId: string;
  projectedDelayMonths: number | null;
  deltaToTarget: number | null;
}

export interface DecisionResult {
  verdict: GuardrailStatus;
  guardrails: GuardrailResult[];
  goalImpacts: GoalImpactSummary[];
}
