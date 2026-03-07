"use client";

import type { DrawerState } from "@/types/drawer.types";
import type { BaselineResponse } from "@/types/baseline.types";
import AssetForm from "@/components/forms/AssetForm";
import LiabilityForm from "@/components/forms/LiabilityForm";
import IncomeForm from "@/components/forms/IncomeForm";
import ExpenseForm from "@/components/forms/ExpenseForm";
import AssumptionsForm from "@/components/forms/AssumptionsForm";

export const drawerTitles: Record<string, Record<string, string>> = {
  add: { asset: "Add asset", liability: "Add liability", income: "Add income", expense: "Add expense" },
  edit: {
    asset: "Edit asset",
    liability: "Edit liability",
    income: "Edit income",
    expense: "Edit expense",
    assumptions: "Edit assumptions & guardrails",
  },
};

interface DrawerFormProps {
  drawer: DrawerState & { open: true };
  baseline: BaselineResponse | null;
  onSuccess: () => void;
}

export default function DrawerForm({ drawer, baseline, onSuccess }: DrawerFormProps) {
  const { entityType, mode } = drawer;

  if (entityType === "assumptions") {
    return <AssumptionsForm onSuccess={onSuccess} />;
  }

  if (entityType === "asset") {
    const initialData =
      mode === "edit" && baseline
        ? baseline.assets.find((a) => a.id === drawer.itemId)
        : undefined;
    return (
      <AssetForm
        initialData={initialData}
        defaultCategory={mode === "add" ? drawer.defaultCategory : undefined}
        onSuccess={onSuccess}
      />
    );
  }

  if (entityType === "liability") {
    const initialData =
      mode === "edit" && baseline
        ? baseline.liabilities.find((l) => l.id === drawer.itemId)
        : undefined;
    return (
      <LiabilityForm
        initialData={initialData}
        defaultCategory={mode === "add" ? drawer.defaultCategory : undefined}
        onSuccess={onSuccess}
      />
    );
  }

  if (entityType === "income") {
    const initialData =
      mode === "edit" && baseline
        ? baseline.incomes.find((i) => i.id === drawer.itemId)
        : undefined;
    return (
      <IncomeForm
        initialData={initialData}
        defaultCategory={mode === "add" ? drawer.defaultCategory : undefined}
        onSuccess={onSuccess}
      />
    );
  }

  const initialData =
    mode === "edit" && baseline
      ? baseline.expenses.find((e) => e.id === drawer.itemId)
      : undefined;
  return (
    <ExpenseForm
      initialData={initialData}
      defaultCategory={mode === "add" ? drawer.defaultCategory : undefined}
      onSuccess={onSuccess}
    />
  );
}
