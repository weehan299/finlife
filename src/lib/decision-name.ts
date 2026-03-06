import type { DecisionTemplate } from "@/types/decision.types";

type DecisionInputs = Record<string, unknown> | null | undefined;

const templateLabels: Record<DecisionTemplate, string> = {
  HOME_PURCHASE: "Buy a home",
  NEW_LOAN: "Take a loan",
  LARGE_PURCHASE: "Large purchase",
  INCOME_LOSS: "Income loss",
  RECURRING_EXPENSE: "Recurring expense",
  ONE_TIME_EXPENSE: "One-time expense",
};

function asPositiveNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text ? text : null;
}

function formatCurrency(amount: number): string {
  return `$${Math.round(amount).toLocaleString()}`;
}

function formatDateSuffix(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildTemplateDetail(
  template: DecisionTemplate,
  inputs: DecisionInputs,
): string | null {
  const data = inputs ?? {};

  switch (template) {
    case "HOME_PURCHASE": {
      const purchasePrice = asPositiveNumber(data.purchasePrice);
      return purchasePrice ? formatCurrency(purchasePrice) : null;
    }
    case "NEW_LOAN": {
      const loanAmount = asPositiveNumber(data.loanAmount);
      const purpose = asNonEmptyString(data.purpose);
      if (loanAmount && purpose) return `${formatCurrency(loanAmount)} (${purpose})`;
      if (loanAmount) return formatCurrency(loanAmount);
      return purpose;
    }
    case "LARGE_PURCHASE": {
      const purchasePrice = asPositiveNumber(data.purchasePrice);
      return purchasePrice ? formatCurrency(purchasePrice) : null;
    }
    case "INCOME_LOSS": {
      const monthlyLoss = asPositiveNumber(data.incomeReductionMonthly);
      return monthlyLoss ? `${formatCurrency(monthlyLoss)}/mo` : null;
    }
    case "RECURRING_EXPENSE": {
      const monthlyAmount = asPositiveNumber(data.monthlyAmount);
      const description = asNonEmptyString(data.description);
      if (monthlyAmount && description) {
        return `${formatCurrency(monthlyAmount)}/mo (${description})`;
      }
      if (monthlyAmount) return `${formatCurrency(monthlyAmount)}/mo`;
      return description;
    }
    case "ONE_TIME_EXPENSE": {
      const amount = asPositiveNumber(data.amount);
      const description = asNonEmptyString(data.description);
      if (amount && description) return `${formatCurrency(amount)} (${description})`;
      if (amount) return formatCurrency(amount);
      return description;
    }
    default:
      return null;
  }
}

export function buildDecisionName(
  template: DecisionTemplate,
  inputs: DecisionInputs,
  now = new Date(),
): string {
  const base = templateLabels[template];
  const detail = buildTemplateDetail(template, inputs);
  if (detail) return `${base}: ${detail}`;
  return `${base} (${formatDateSuffix(now)})`;
}
