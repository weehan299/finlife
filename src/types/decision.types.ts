import type { SnapshotWithExtras } from "@/lib/snapshot";

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

// ---------- Template-specific inputs ----------

export interface HomePurchaseInputs {
  purchasePrice: number;
  downPaymentAmount: number;
  mortgageTermMonths: number;
  annualInterestRate: number;
  annualPropertyTaxRate?: number;
  monthlyInsurance?: number;
  annualMaintenanceRate?: number;
  currentRentMonthly?: number;
}

export interface NewLoanInputs {
  loanAmount: number;
  annualInterestRate: number;
  termMonths: number;
  purpose?: string;
}

export interface LargePurchaseInputs {
  purchasePrice: number;
  upfrontPayment: number;
  financedAmount?: number;
  financedTermMonths?: number;
  financedInterestRate?: number;
}

export interface IncomeLossInputs {
  incomeReductionMonthly: number;
  durationMonths?: number;
  expenseReductionRate?: number;
}

export interface RecurringExpenseInputs {
  monthlyAmount: number;
  durationMonths?: number;
  description?: string;
}

export interface OneTimeExpenseInputs {
  amount: number;
  description?: string;
}

export type DecisionTemplate =
  | "HOME_PURCHASE"
  | "NEW_LOAN"
  | "LARGE_PURCHASE"
  | "INCOME_LOSS"
  | "RECURRING_EXPENSE"
  | "ONE_TIME_EXPENSE";

export type TemplateInputsMap = {
  HOME_PURCHASE: HomePurchaseInputs;
  NEW_LOAN: NewLoanInputs;
  LARGE_PURCHASE: LargePurchaseInputs;
  INCOME_LOSS: IncomeLossInputs;
  RECURRING_EXPENSE: RecurringExpenseInputs;
  ONE_TIME_EXPENSE: OneTimeExpenseInputs;
};

export type AnyTemplateInputs = TemplateInputsMap[DecisionTemplate];

// ---------- Resolved guardrails (merged settings + defaults) ----------

export interface ResolvedGuardrails {
  minEmergencyMonths: number;
  minPostDecisionCash: number;
  minMonthlySurplus: number;
  maxDebtToIncome: number;
  maxHousingRatio: number;
  stressExpenseReductionRate: number;
  housingTaxRateDefault: number;
  housingInsuranceMonthlyDefault: number;
  housingMaintenanceRateDefault: number;
}

// ---------- Template impact ----------

export interface TemplateImpact {
  upfrontAmount: number;
  monthlyImpact: number;
  newLiabilityBalance: number;
  monthlyIncomeChange: number;
  isHousing: boolean;
  monthlyHousingCost: number;
}

// ---------- Full evaluation output ----------

export interface EvaluateDecisionOutput extends DecisionResult {
  baselineSnapshot: SnapshotWithExtras;
  postDecisionSnapshot: SnapshotWithExtras;
  stressSnapshot: SnapshotWithExtras;
  computedUpfrontAmount: number;
  computedMonthlyImpact: number;
  confidenceLevel: "HIGH" | "MEDIUM" | "LOW";
}

// ---------- Comparison row for UI ----------

export interface ComparisonRow {
  label: string;
  before: number;
  after: number;
  delta: number;
  status: GuardrailStatus;
  format: "currency" | "months" | "percent" | "ratio";
}

// ---------- Decision summary for list API ----------

export interface DecisionSummary {
  id: string;
  template: DecisionTemplate;
  name: string;
  status: string;
  verdict: GuardrailStatus | null;
  confidenceLevel: string | null;
  computedUpfrontAmount: number | null;
  computedMonthlyImpact: number | null;
  createdAt: string;
  updatedAt: string;
  evaluatedAt: string | null;
}
