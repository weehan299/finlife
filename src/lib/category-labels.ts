export const assetCategoryLabels: Record<string, string> = {
  CASH_CHECKING: "Cash & Checking",
  SAVINGS: "Savings",
  INVESTMENTS: "Investments",
  RETIREMENT: "Retirement",
  PROPERTY: "Property",
  OTHER: "Other",
};

export const liabilityCategoryLabels: Record<string, string> = {
  CREDIT_CARD: "Credit Card",
  STUDENT_LOAN: "Student Loan",
  PERSONAL_LOAN: "Personal Loan",
  MORTGAGE: "Mortgage",
  OTHER: "Other",
};

export const incomeCategoryLabels: Record<string, string> = {
  TAKE_HOME: "Take-Home Pay",
  GROSS: "Gross Pay",
  OTHER_RECURRING: "Other Recurring",
  VARIABLE: "Variable",
  FALLBACK: "Fallback",
};

export const expenseCategoryLabels: Record<string, string> = {
  ESSENTIAL_FIXED: "Essential (Fixed)",
  ESSENTIAL_VARIABLE: "Essential (Variable)",
  DISCRETIONARY: "Discretionary",
};

const allLabels: Record<string, string> = {
  ...assetCategoryLabels,
  ...liabilityCategoryLabels,
  ...incomeCategoryLabels,
  ...expenseCategoryLabels,
};

export function getCategoryLabel(category: string): string {
  return allLabels[category] ?? category;
}
