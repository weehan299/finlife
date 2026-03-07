import type { SnapshotWithExtras } from "@/lib/snapshot";
import type {
  DecisionTemplate,
  GuardrailResult,
  HomePurchaseInputs,
  LargePurchaseInputs,
  NarrativeData,
  OneTimeExpenseInputs,
  ResolvedGuardrails,
  TemplateImpact,
  UpfrontWaterfallStep,
  VerdictExplanation,
  ViabilityBreakpoint,
  AnyTemplateInputs,
} from "@/types/decision.types";

const TEMPLATE_LABELS: Record<DecisionTemplate, string> = {
  HOME_PURCHASE: "home purchase",
  NEW_LOAN: "new loan",
  LARGE_PURCHASE: "large purchase",
  INCOME_LOSS: "income change",
  RECURRING_EXPENSE: "recurring expense",
  ONE_TIME_EXPENSE: "one-time expense",
};

// ---------- Verdict explanation ----------

export function buildVerdictExplanation(
  guardrails: GuardrailResult[],
  template: DecisionTemplate,
  _impact: TemplateImpact,
  _postDecision: SnapshotWithExtras,
  _settings: ResolvedGuardrails,
): VerdictExplanation {
  const fails = guardrails.filter((g) => g.status === "FAIL");
  const cautions = guardrails.filter((g) => g.status === "CAUTION");
  const passes = guardrails.filter((g) => g.status === "PASS");

  const primaryReason = fails[0]?.message ?? cautions[0]?.message ?? null;
  const secondaryReasons = [
    ...fails.slice(1).map((g) => g.message),
    ...(fails.length > 0 ? cautions : cautions.slice(1)).map((g) => g.message),
  ];
  const positives = passes.map((g) => g.message);

  const label = TEMPLATE_LABELS[template];
  let headline: string;

  if (fails.length === 0 && cautions.length === 0) {
    headline = `This ${label} fits comfortably within your finances.`;
  } else if (fails.length === 0) {
    headline = `This ${label} is feasible, but leaves thin margins in some areas.`;
  } else {
    const failKeys = fails.map((f) => f.key);
    const parts: string[] = [];
    if (failKeys.includes("postDecisionCash") || failKeys.includes("emergencyRunway")) {
      parts.push("the upfront cost depletes your safety reserves");
    }
    if (failKeys.includes("monthlySurplus")) {
      parts.push("the ongoing costs exceed your monthly budget");
    }
    if (failKeys.includes("housingRatio")) {
      parts.push("housing costs would consume too much of your income");
    }
    if (failKeys.includes("debtToIncome")) {
      parts.push("it pushes your debt load beyond safe limits");
    }
    if (parts.length === 0) {
      parts.push("it fails key financial safety checks");
    }
    headline = `This ${label} is not recommended because ${parts.join(" and ")}.`;
  }

  return { headline, primaryReason, secondaryReasons, positives };
}

// ---------- Upfront waterfall ----------

export function buildUpfrontWaterfall(
  template: DecisionTemplate,
  inputs: AnyTemplateInputs,
  baseline: SnapshotWithExtras,
): UpfrontWaterfallStep[] {
  const steps: UpfrontWaterfallStep[] = [];
  const cash = baseline.liquidAssets;

  switch (template) {
    case "HOME_PURCHASE": {
      const i = inputs as HomePurchaseInputs;
      steps.push({ label: "Current liquid cash", amount: cash, runningTotal: cash });
      steps.push({ label: "Down payment", amount: -i.downPaymentAmount, runningTotal: cash - i.downPaymentAmount });
      break;
    }
    case "LARGE_PURCHASE": {
      const i = inputs as LargePurchaseInputs;
      if (i.upfrontPayment > 0) {
        steps.push({ label: "Current liquid cash", amount: cash, runningTotal: cash });
        steps.push({ label: "Upfront payment", amount: -i.upfrontPayment, runningTotal: cash - i.upfrontPayment });
      }
      break;
    }
    case "ONE_TIME_EXPENSE": {
      const i = inputs as OneTimeExpenseInputs;
      steps.push({ label: "Current liquid cash", amount: cash, runningTotal: cash });
      steps.push({ label: i.description ?? "One-time expense", amount: -i.amount, runningTotal: cash - i.amount });
      break;
    }
    default:
      break;
  }

  return steps;
}

// ---------- Monthly breakdown ----------

export function buildMonthlyBreakdown(
  baseline: SnapshotWithExtras,
  postDecision: SnapshotWithExtras,
  impact: TemplateImpact,
  template: DecisionTemplate,
): NarrativeData["monthlyBreakdown"] {
  const newExpenseLabelMap: Record<DecisionTemplate, string> = {
    HOME_PURCHASE: "Mortgage + taxes + insurance",
    NEW_LOAN: "Loan payment",
    LARGE_PURCHASE: "Financing payment",
    INCOME_LOSS: "Income reduction",
    RECURRING_EXPENSE: "New recurring expense",
    ONE_TIME_EXPENSE: "No monthly impact",
  };

  const totalNewMonthly = impact.monthlyImpact + Math.abs(impact.monthlyIncomeChange);

  return {
    income: postDecision.monthlyIncome,
    existingExpenses: baseline.monthlyExpenses,
    newExpense: totalNewMonthly,
    newExpenseLabel: newExpenseLabelMap[template],
    remainingBuffer: postDecision.monthlySurplus,
  };
}

// ---------- Resilience data ----------

export function buildResilienceData(
  stressSnapshot: SnapshotWithExtras,
  settings: ResolvedGuardrails,
): NarrativeData["resilienceData"] {
  const runway = stressSnapshot.emergencyRunwayMonths;
  const minMonths = settings.minEmergencyMonths;
  let runwayStatus: "safe" | "borderline" | "unsafe";
  if (runway >= minMonths) {
    runwayStatus = "safe";
  } else if (runway >= minMonths * 0.5) {
    runwayStatus = "borderline";
  } else {
    runwayStatus = "unsafe";
  }

  return {
    runwayMonths: Math.round(runway * 10) / 10,
    runwayStatus,
    stressedSurplus: stressSnapshot.monthlySurplus,
    guaranteedIncome: stressSnapshot.monthlyIncome,
  };
}

// ---------- Viability breakpoints ----------

export function computeViabilityBreakpoints(
  template: DecisionTemplate,
  inputs: AnyTemplateInputs,
  impact: TemplateImpact,
  baseline: SnapshotWithExtras,
  settings: ResolvedGuardrails,
  guardrails: GuardrailResult[],
): ViabilityBreakpoint[] {
  const fails = guardrails.filter((g) => g.status === "FAIL");
  if (fails.length === 0) return [];

  const breakpoints: ViabilityBreakpoint[] = [];
  const postCash = baseline.liquidAssets - impact.upfrontAmount;
  const postExpenses = baseline.monthlyExpenses + impact.monthlyImpact;

  for (const g of fails) {
    switch (g.key) {
      case "postDecisionCash": {
        const emergencyBuffer = postExpenses * settings.minEmergencyMonths;
        const needed = settings.minPostDecisionCash + emergencyBuffer;
        const shortfall = needed - postCash;
        if (shortfall > 0) {
          breakpoints.push({
            label: "Additional liquid cash needed",
            currentValue: postCash,
            breakpointValue: needed,
            unit: "currency",
          });
        }
        break;
      }
      case "emergencyRunway": {
        if (postExpenses > 0) {
          const maxUpfront = baseline.liquidAssets - (postExpenses * settings.minEmergencyMonths);
          breakpoints.push({
            label: "Maximum upfront spend",
            currentValue: impact.upfrontAmount,
            breakpointValue: Math.max(0, maxUpfront),
            unit: "currency",
          });
        }
        break;
      }
      case "monthlySurplus": {
        const maxMonthly = baseline.monthlyIncome - baseline.monthlyExpenses - settings.minMonthlySurplus;
        breakpoints.push({
          label: "Maximum monthly cost",
          currentValue: impact.monthlyImpact,
          breakpointValue: Math.max(0, maxMonthly),
          unit: "currency",
        });
        break;
      }
      case "housingRatio": {
        if (baseline.monthlyIncome > 0) {
          const maxHousingCost = baseline.monthlyIncome * settings.maxHousingRatio;
          const i = inputs as HomePurchaseInputs;
          const currentHousingCost = impact.monthlyHousingCost;
          const maxPrice = maxHousingCost > 0 && currentHousingCost > 0
            ? (maxHousingCost / currentHousingCost) * i.purchasePrice
            : 0;
          breakpoints.push({
            label: "Maximum purchase price",
            currentValue: i.purchasePrice,
            breakpointValue: Math.max(0, Math.round(maxPrice)),
            unit: "currency",
          });
        }
        break;
      }
      case "debtToIncome": {
        if (baseline.monthlyIncome > 0) {
          const maxDebt = settings.maxDebtToIncome * baseline.monthlyIncome * 12;
          const currentDebt = baseline.totalLiabilities + impact.newLiabilityBalance;
          breakpoints.push({
            label: "Maximum total debt",
            currentValue: currentDebt,
            breakpointValue: Math.max(0, maxDebt),
            unit: "currency",
          });
        }
        break;
      }
    }
  }

  return breakpoints;
}

// ---------- Orchestrator ----------

export function buildNarrativeData(params: {
  template: DecisionTemplate;
  inputs: AnyTemplateInputs;
  impact: TemplateImpact;
  baseline: SnapshotWithExtras;
  postDecision: SnapshotWithExtras;
  stressSnapshot: SnapshotWithExtras;
  settings: ResolvedGuardrails;
  guardrails: GuardrailResult[];
}): NarrativeData {
  const { template, inputs, impact, baseline, postDecision, stressSnapshot, settings, guardrails } = params;

  return {
    templateLabel: TEMPLATE_LABELS[template],
    verdictExplanation: buildVerdictExplanation(guardrails, template, impact, postDecision, settings),
    upfrontWaterfall: buildUpfrontWaterfall(template, inputs, baseline),
    monthlyBreakdown: buildMonthlyBreakdown(baseline, postDecision, impact, template),
    resilienceData: buildResilienceData(stressSnapshot, settings),
    viabilityBreakpoints: computeViabilityBreakpoints(template, inputs, impact, baseline, settings, guardrails),
    isHousing: impact.isHousing,
    monthlyHousingCost: impact.monthlyHousingCost,
  };
}
