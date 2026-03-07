import type { SnapshotWithExtras } from "@/lib/snapshot";
import type { BaselineResponse } from "@/types/baseline.types";
import type {
  AnyTemplateInputs,
  DecisionTemplate,
  EvaluateDecisionOutput,
  GuardrailResult,
  HomePurchaseInputs,
  IncomeLossInputs,
  LargePurchaseInputs,
  NewLoanInputs,
  OneTimeExpenseInputs,
  RecurringExpenseInputs,
  ResolvedGuardrails,
  TemplateImpact,
  GuardrailStatus,
} from "@/types/decision.types";
import { buildSnapshot, resolveGuardrails } from "@/services/snapshot.service";

// ---------- Amortization ----------

export function computeAmortizationPayment(
  principal: number,
  annualRate: number,
  termMonths: number,
): number {
  if (principal <= 0 || termMonths <= 0) return 0;
  if (annualRate <= 0) return principal / termMonths;
  const r = annualRate / 12;
  const factor = Math.pow(1 + r, termMonths);
  return (principal * r * factor) / (factor - 1);
}

// ---------- Template impact ----------

export function computeTemplateImpact(
  template: DecisionTemplate,
  inputs: AnyTemplateInputs,
  settings: ResolvedGuardrails,
): TemplateImpact {
  switch (template) {
    case "HOME_PURCHASE": {
      const i = inputs as HomePurchaseInputs;
      const loanAmount = i.purchasePrice - i.downPaymentAmount;
      const mortgage = computeAmortizationPayment(loanAmount, i.annualInterestRate, i.mortgageTermMonths);
      const taxRate = i.annualPropertyTaxRate ?? settings.housingTaxRateDefault;
      const insurance = i.monthlyInsurance ?? settings.housingInsuranceMonthlyDefault;
      const maintenanceRate = i.annualMaintenanceRate ?? settings.housingMaintenanceRateDefault;
      const monthlyTax = (i.purchasePrice * taxRate) / 12;
      const monthlyMaintenance = (i.purchasePrice * maintenanceRate) / 12;
      const totalHousingCost = mortgage + monthlyTax + insurance + monthlyMaintenance;
      const rentSavings = i.currentRentMonthly ?? 0;
      return {
        upfrontAmount: i.downPaymentAmount,
        monthlyImpact: totalHousingCost - rentSavings,
        newLiabilityBalance: loanAmount,
        monthlyIncomeChange: 0,
        isHousing: true,
        monthlyHousingCost: totalHousingCost,
      };
    }
    case "NEW_LOAN": {
      const i = inputs as NewLoanInputs;
      const payment = computeAmortizationPayment(i.loanAmount, i.annualInterestRate, i.termMonths);
      return {
        upfrontAmount: 0,
        monthlyImpact: payment,
        newLiabilityBalance: i.loanAmount,
        monthlyIncomeChange: 0,
        isHousing: false,
        monthlyHousingCost: 0,
      };
    }
    case "LARGE_PURCHASE": {
      const i = inputs as LargePurchaseInputs;
      const financed = i.financedAmount ?? (i.purchasePrice - i.upfrontPayment);
      let monthlyPayment = 0;
      if (financed > 0 && i.financedTermMonths && i.financedInterestRate !== undefined) {
        monthlyPayment = computeAmortizationPayment(financed, i.financedInterestRate, i.financedTermMonths);
      }
      return {
        upfrontAmount: i.upfrontPayment,
        monthlyImpact: monthlyPayment,
        newLiabilityBalance: financed > 0 ? financed : 0,
        monthlyIncomeChange: 0,
        isHousing: false,
        monthlyHousingCost: 0,
      };
    }
    case "INCOME_LOSS": {
      const i = inputs as IncomeLossInputs;
      return {
        upfrontAmount: 0,
        monthlyImpact: 0,
        newLiabilityBalance: 0,
        monthlyIncomeChange: -i.incomeReductionMonthly,
        isHousing: false,
        monthlyHousingCost: 0,
      };
    }
    case "RECURRING_EXPENSE": {
      const i = inputs as RecurringExpenseInputs;
      return {
        upfrontAmount: 0,
        monthlyImpact: i.monthlyAmount,
        newLiabilityBalance: 0,
        monthlyIncomeChange: 0,
        isHousing: false,
        monthlyHousingCost: 0,
      };
    }
    case "ONE_TIME_EXPENSE": {
      const i = inputs as OneTimeExpenseInputs;
      return {
        upfrontAmount: i.amount,
        monthlyImpact: 0,
        newLiabilityBalance: 0,
        monthlyIncomeChange: 0,
        isHousing: false,
        monthlyHousingCost: 0,
      };
    }
  }
}

// ---------- Apply decision to snapshot ----------

export function applyDecisionToSnapshot(
  baseline: SnapshotWithExtras,
  impact: TemplateImpact,
): SnapshotWithExtras {
  const liquidAssets = baseline.liquidAssets - impact.upfrontAmount;
  const totalAssets = baseline.totalAssets - impact.upfrontAmount;
  const totalLiabilities = baseline.totalLiabilities + impact.newLiabilityBalance;
  const monthlyIncome = baseline.monthlyIncome + impact.monthlyIncomeChange;
  const monthlyExpenses = baseline.monthlyExpenses + impact.monthlyImpact;
  const netWorth = totalAssets - totalLiabilities;
  const monthlySurplus = monthlyIncome - monthlyExpenses;
  const emergencyRunwayMonths = monthlyExpenses > 0 ? liquidAssets / monthlyExpenses : 0;
  const debtToIncomeRatio = monthlyIncome > 0 ? totalLiabilities / (monthlyIncome * 12) : 0;

  return {
    totalAssets,
    totalLiabilities,
    netWorth,
    monthlyIncome,
    monthlyExpenses,
    monthlySurplus,
    emergencyRunwayMonths,
    liquidAssets,
    debtToIncomeRatio,
  };
}

// ---------- Stress snapshot ----------

export function computeStressSnapshot(
  postDecision: SnapshotWithExtras,
  baselineData: BaselineResponse,
  settings: ResolvedGuardrails,
): SnapshotWithExtras {
  const guaranteedIncome = baselineData.incomes
    .filter((i) => i.isGuaranteed)
    .reduce((sum, i) => sum + i.monthlyAmount, 0);

  let stressExpenses = 0;
  for (const e of baselineData.expenses) {
    if (e.category === "ESSENTIAL") {
      stressExpenses += e.stressMonthlyAmount ?? e.monthlyAmount;
    } else {
      const reduced = e.monthlyAmount * (1 - settings.stressExpenseReductionRate);
      stressExpenses += e.stressMonthlyAmount ?? reduced;
    }
  }

  // Add the monthly impact from the decision (already in postDecision.monthlyExpenses - baseline expenses)
  const decisionExpenseAdded = postDecision.monthlyExpenses - baselineData.expenses.reduce((s, e) => s + e.monthlyAmount, 0);
  stressExpenses += decisionExpenseAdded;

  const monthlySurplus = guaranteedIncome - stressExpenses;
  const emergencyRunwayMonths = stressExpenses > 0 ? postDecision.liquidAssets / stressExpenses : 0;
  const debtToIncomeRatio = guaranteedIncome > 0 ? postDecision.totalLiabilities / (guaranteedIncome * 12) : 0;

  return {
    totalAssets: postDecision.totalAssets,
    totalLiabilities: postDecision.totalLiabilities,
    netWorth: postDecision.netWorth,
    monthlyIncome: guaranteedIncome,
    monthlyExpenses: stressExpenses,
    monthlySurplus,
    emergencyRunwayMonths,
    liquidAssets: postDecision.liquidAssets,
    debtToIncomeRatio,
  };
}

// ---------- Guardrails ----------

export function runGuardrails(
  postDecision: SnapshotWithExtras,
  settings: ResolvedGuardrails,
  template: DecisionTemplate,
  impact: TemplateImpact,
): GuardrailResult[] {
  const results: GuardrailResult[] = [];

  // 1. Emergency runway
  const runway = postDecision.emergencyRunwayMonths;
  const minRunway = settings.minEmergencyMonths;
  const runwayRounded = Math.round(runway * 10) / 10;
  if (runway >= minRunway) {
    results.push({ key: "emergencyRunway", label: "Emergency runway", status: "PASS", message: `${runwayRounded} months of runway (target: ${minRunway})` });
  } else if (runway >= minRunway * 0.75) {
    results.push({ key: "emergencyRunway", label: "Emergency runway", status: "CAUTION", message: `${runwayRounded} months — below ${minRunway}-month target` });
  } else {
    results.push({ key: "emergencyRunway", label: "Emergency runway", status: "FAIL", message: `Only ${runwayRounded} months — well below ${minRunway}-month target` });
  }

  // 2. Post-decision cash
  const cash = postDecision.liquidAssets;
  const emergencyBuffer = postDecision.monthlyExpenses * minRunway;
  const minCash = settings.minPostDecisionCash;
  if (cash >= minCash + emergencyBuffer) {
    results.push({ key: "postDecisionCash", label: "Post-decision cash", status: "PASS", message: `$${Math.round(cash).toLocaleString()} remaining after decision` });
  } else if (cash >= minCash) {
    results.push({ key: "postDecisionCash", label: "Post-decision cash", status: "CAUTION", message: `$${Math.round(cash).toLocaleString()} — covers minimum but emergency buffer is tight` });
  } else {
    results.push({ key: "postDecisionCash", label: "Post-decision cash", status: "FAIL", message: `$${Math.round(cash).toLocaleString()} — below minimum cash threshold` });
  }

  // 3. Monthly surplus
  const surplus = postDecision.monthlySurplus;
  const minSurplus = settings.minMonthlySurplus;
  if (surplus >= minSurplus * 1.2) {
    results.push({ key: "monthlySurplus", label: "Monthly surplus", status: "PASS", message: `$${Math.round(surplus).toLocaleString()}/mo surplus after decision` });
  } else if (surplus >= minSurplus) {
    results.push({ key: "monthlySurplus", label: "Monthly surplus", status: "CAUTION", message: `$${Math.round(surplus).toLocaleString()}/mo — thin margin above minimum` });
  } else {
    results.push({ key: "monthlySurplus", label: "Monthly surplus", status: "FAIL", message: `$${Math.round(surplus).toLocaleString()}/mo — below minimum surplus` });
  }

  // 4. Debt-to-income (only for debt-adding templates)
  const debtTemplates: DecisionTemplate[] = ["HOME_PURCHASE", "NEW_LOAN", "LARGE_PURCHASE"];
  if (debtTemplates.includes(template) && impact.newLiabilityBalance > 0) {
    const dti = postDecision.debtToIncomeRatio;
    const maxDti = settings.maxDebtToIncome;
    const dtiPct = Math.round(dti * 100);
    const maxPct = Math.round(maxDti * 100);
    if (dti <= maxDti) {
      results.push({ key: "debtToIncome", label: "Debt-to-income ratio", status: "PASS", message: `${dtiPct}% DTI (max: ${maxPct}%)` });
    } else if (dti <= maxDti * 1.1) {
      results.push({ key: "debtToIncome", label: "Debt-to-income ratio", status: "CAUTION", message: `${dtiPct}% DTI — approaching ${maxPct}% limit` });
    } else {
      results.push({ key: "debtToIncome", label: "Debt-to-income ratio", status: "FAIL", message: `${dtiPct}% DTI — exceeds ${maxPct}% limit` });
    }
  }

  // 5. Housing ratio (HOME_PURCHASE only)
  if (template === "HOME_PURCHASE" && impact.monthlyHousingCost > 0) {
    const housingRatio = postDecision.monthlyIncome > 0
      ? impact.monthlyHousingCost / postDecision.monthlyIncome
      : 1;
    const maxHousing = settings.maxHousingRatio;
    const hrPct = Math.round(housingRatio * 100);
    const maxPct = Math.round(maxHousing * 100);
    if (housingRatio <= maxHousing) {
      results.push({ key: "housingRatio", label: "Housing cost ratio", status: "PASS", message: `${hrPct}% of income on housing (max: ${maxPct}%)` });
    } else if (housingRatio <= maxHousing * 1.1) {
      results.push({ key: "housingRatio", label: "Housing cost ratio", status: "CAUTION", message: `${hrPct}% of income — approaching ${maxPct}% limit` });
    } else {
      results.push({ key: "housingRatio", label: "Housing cost ratio", status: "FAIL", message: `${hrPct}% of income — exceeds ${maxPct}% limit` });
    }
  }

  return results;
}

// ---------- Derive verdict ----------

export function deriveVerdict(
  guardrails: GuardrailResult[],
  stressSnapshot: SnapshotWithExtras,
  settings: ResolvedGuardrails,
): GuardrailStatus {
  if (guardrails.some((g) => g.status === "FAIL")) return "FAIL";
  if (guardrails.some((g) => g.status === "CAUTION")) return "CAUTION";
  if (stressSnapshot.emergencyRunwayMonths < settings.minEmergencyMonths) return "CAUTION";
  return "PASS";
}

// ---------- Confidence level ----------

function computeConfidence(baseline: BaselineResponse): "HIGH" | "MEDIUM" | "LOW" {
  const hasAssets = baseline.assets.length > 0;
  const hasIncome = baseline.incomes.length > 0;
  const hasExpenses = baseline.expenses.length > 0;
  const detailedMode = baseline.mode === "DETAILED";

  if (detailedMode && hasAssets && hasIncome && hasExpenses) return "HIGH";
  if (hasIncome && hasExpenses) return "MEDIUM";
  return "LOW";
}

// ---------- Main evaluate function ----------

export async function evaluateDecision(input: {
  template: DecisionTemplate;
  inputs: AnyTemplateInputs;
  userId: string;
}): Promise<EvaluateDecisionOutput> {
  const { template, inputs, userId } = input;

  const [{ snapshot: baselineSnapshot, baseline }, settings] = await Promise.all([
    buildSnapshot(userId),
    resolveGuardrails(userId),
  ]);

  const impact = computeTemplateImpact(template, inputs, settings);
  const postDecisionSnapshot = applyDecisionToSnapshot(baselineSnapshot, impact);
  const stressSnapshot = computeStressSnapshot(postDecisionSnapshot, baseline, settings);
  const guardrails = runGuardrails(postDecisionSnapshot, settings, template, impact);
  const verdict = deriveVerdict(guardrails, stressSnapshot, settings);
  const confidenceLevel = computeConfidence(baseline);

  return {
    verdict,
    guardrails,
    goalImpacts: [],
    baselineSnapshot,
    postDecisionSnapshot,
    stressSnapshot,
    computedUpfrontAmount: impact.upfrontAmount,
    computedMonthlyImpact: impact.monthlyImpact,
    confidenceLevel,
  };
}
