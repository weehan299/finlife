import type { Asset, Liability, Income, Expense } from "@prisma/client";

function toISO(d: Date): string {
  return d.toISOString();
}

function toNum(v: unknown): number | null {
  return v == null ? null : Number(v);
}

export function serializeAsset(a: Asset) {
  return {
    id: a.id,
    category: a.category,
    label: a.label,
    value: Number(a.value),
    isLiquid: a.isLiquid,
    monthlyContribution: toNum(a.monthlyContribution),
    annualGrowthRateOverride: toNum(a.annualGrowthRateOverride),
    provenance: a.provenance,
    createdAt: toISO(a.createdAt),
    updatedAt: toISO(a.updatedAt),
  };
}

export function serializeLiability(l: Liability) {
  return {
    id: l.id,
    category: l.category,
    label: l.label,
    balance: Number(l.balance),
    annualInterestRate: toNum(l.annualInterestRate),
    minimumPayment: toNum(l.minimumPayment),
    remainingTermMonths: l.remainingTermMonths,
    provenance: l.provenance,
    createdAt: toISO(l.createdAt),
    updatedAt: toISO(l.updatedAt),
  };
}

export function serializeIncome(i: Income) {
  return {
    id: i.id,
    category: i.category,
    label: i.label,
    monthlyAmount: Number(i.monthlyAmount),
    isGuaranteed: i.isGuaranteed,
    provenance: i.provenance,
    createdAt: toISO(i.createdAt),
    updatedAt: toISO(i.updatedAt),
  };
}

export function serializeExpense(e: Expense) {
  return {
    id: e.id,
    category: e.category,
    label: e.label,
    monthlyAmount: Number(e.monthlyAmount),
    stressMonthlyAmount: toNum(e.stressMonthlyAmount),
    isVariable: e.isVariable,
    provenance: e.provenance,
    createdAt: toISO(e.createdAt),
    updatedAt: toISO(e.updatedAt),
  };
}
