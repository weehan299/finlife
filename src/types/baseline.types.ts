export interface FinancialSnapshot {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySurplus: number;
}

export interface SerializedAsset {
  id: string;
  category: string;
  label: string;
  value: number;
  isLiquid: boolean;
  monthlyContribution: number | null;
  annualGrowthRateOverride: number | null;
  provenance: string;
  createdAt: string;
  updatedAt: string;
}

export interface SerializedLiability {
  id: string;
  category: string;
  label: string;
  balance: number;
  annualInterestRate: number | null;
  minimumPayment: number | null;
  remainingTermMonths: number | null;
  provenance: string;
  createdAt: string;
  updatedAt: string;
}

export interface SerializedIncome {
  id: string;
  category: string;
  label: string;
  monthlyAmount: number;
  isGuaranteed: boolean;
  provenance: string;
  createdAt: string;
  updatedAt: string;
}

export interface SerializedExpense {
  id: string;
  category: string;
  label: string;
  monthlyAmount: number;
  stressMonthlyAmount: number | null;
  isVariable: boolean;
  provenance: string;
  createdAt: string;
  updatedAt: string;
}

export interface BaselineResponse {
  mode: "QUICK" | "DETAILED";
  assets: SerializedAsset[];
  liabilities: SerializedLiability[];
  incomes: SerializedIncome[];
  expenses: SerializedExpense[];
}
