export const assetCategoryLabels: Record<string, string> = {
  CASH_SAVINGS: "Cash & Savings",
  INVESTMENTS: "Investments",
  RETIREMENT: "Retirement",
  PROPERTY: "Property",
  OTHER: "Other",
};

export const liabilityCategoryLabels: Record<string, string> = {
  CREDIT_CARD: "Credit Card",
  STUDENT_LOAN: "Student Loan",
  LOAN: "Loan",
  MORTGAGE: "Mortgage",
  OTHER_DEBT: "Other Debt",
};

export const incomeCategoryLabels: Record<string, string> = {
  SALARY: "Salary",
  SIDE_INCOME: "Side Income",
  BENEFITS: "Benefits",
  OTHER_INCOME: "Other Income",
};

export const expenseCategoryLabels: Record<string, string> = {
  ESSENTIAL: "Essential",
  FLEXIBLE: "Flexible",
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
