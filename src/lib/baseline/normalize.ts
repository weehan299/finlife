import type {
  QuickBaselineInput,
  BaselineInput,
  AssetInput,
  LiabilityInput,
  IncomeInput,
  ExpenseInput,
} from "@/schemas/baseline.schema";

export function isQuickPayload(body: unknown): boolean {
  return typeof body === "object" && body !== null && !("assets" in body);
}

export function normalizeQuickBaseline(
  input: QuickBaselineInput,
): BaselineInput {
  const assets: AssetInput[] = [];
  const liabilities: LiabilityInput[] = [];
  const incomes: IncomeInput[] = [];
  const expenses: ExpenseInput[] = [];

  if (input.totalSavings != null && input.totalSavings > 0) {
    assets.push({
      category: "SAVINGS",
      label: "Savings",
      value: input.totalSavings,
      isLiquid: true,
      provenance: "USER_ESTIMATED",
    });
  }

  if (input.totalInvestments != null && input.totalInvestments > 0) {
    assets.push({
      category: "INVESTMENTS",
      label: "Investments",
      value: input.totalInvestments,
      isLiquid: false,
      provenance: "USER_ESTIMATED",
    });
  }

  if (input.totalDebt != null && input.totalDebt > 0) {
    liabilities.push({
      category: "OTHER",
      label: "Total debt",
      balance: input.totalDebt,
      provenance: "USER_ESTIMATED",
    });
  }

  if (input.monthlyTakeHome != null && input.monthlyTakeHome > 0) {
    incomes.push({
      category: "TAKE_HOME",
      label: "Take-home pay",
      monthlyAmount: input.monthlyTakeHome,
      isGuaranteed: true,
      provenance: "USER_ESTIMATED",
    });
  }

  if (
    input.monthlyEssentialExpenses != null &&
    input.monthlyEssentialExpenses > 0
  ) {
    expenses.push({
      category: "ESSENTIAL_FIXED",
      label: "Essential expenses",
      monthlyAmount: input.monthlyEssentialExpenses,
      isEssential: true,
      provenance: "USER_ESTIMATED",
    });
  }

  if (
    input.monthlyDiscretionaryExpenses != null &&
    input.monthlyDiscretionaryExpenses > 0
  ) {
    expenses.push({
      category: "DISCRETIONARY",
      label: "Discretionary expenses",
      monthlyAmount: input.monthlyDiscretionaryExpenses,
      isEssential: false,
      provenance: "USER_ESTIMATED",
    });
  }

  return { assets, liabilities, incomes, expenses };
}
