"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { BaselineResponse } from "@/types/baseline.types";
import type { DrawerState, EntityType } from "@/types/drawer.types";
import { formatCurrency } from "@/lib/format";
import InputCategoryCard from "@/components/ui/InputCategoryCard";
import type { CategoryItem } from "@/components/ui/CategoryBreakdown";
import ItemList from "@/components/ui/ItemList";
import Drawer from "@/components/ui/Drawer";
import DrawerForm, { drawerTitles } from "@/components/forms/DrawerForm";

type SectionKey = "income" | "spending" | "cash" | "investments" | "debt" | "assumptions";

interface SettingsData {
  inflationRate: number;
  investmentGrowthRate: number;
  savingsInterestRate: number;
  debtInterestFallback: number;
  safeWithdrawalRate: number;
  retirementAge: number;
  minEmergencyMonths: number;
  minPostDecisionCash: number;
  minMonthlySurplus: number;
  maxDebtToIncome: number;
  maxHousingRatio: number;
}

const CASH_CATEGORIES = new Set(["CASH_SAVINGS"]);
const INVESTMENT_CATEGORIES = new Set(["INVESTMENTS", "RETIREMENT", "PROPERTY", "OTHER"]);

const assumptionLabels: Record<string, string> = {
  inflationRate: "Inflation rate",
  investmentGrowthRate: "Investment growth rate",
  savingsInterestRate: "Savings interest rate",
  debtInterestFallback: "Debt interest (fallback)",
  safeWithdrawalRate: "Safe withdrawal rate",
  retirementAge: "Retirement age",
  minEmergencyMonths: "Min emergency months",
  minPostDecisionCash: "Min post-decision cash",
  minMonthlySurplus: "Min monthly surplus",
  maxDebtToIncome: "Max debt-to-income",
  maxHousingRatio: "Max housing ratio",
};

const pctKeys = new Set([
  "inflationRate", "investmentGrowthRate", "savingsInterestRate",
  "debtInterestFallback", "safeWithdrawalRate", "maxDebtToIncome", "maxHousingRatio",
]);
const dollarKeys = new Set(["minPostDecisionCash", "minMonthlySurplus"]);

function formatSettingValue(key: string, value: number): string {
  if (pctKeys.has(key)) return `${(value * 100).toFixed(1)}%`;
  if (dollarKeys.has(key)) return formatCurrency(value);
  return String(value);
}

export default function FinancialInputsContent() {
  const searchParams = useSearchParams();
  const initialSection = searchParams.get("section") as SectionKey | null;
  const [baseline, setBaseline] = useState<BaselineResponse | null>(null);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [expandedSection, setExpandedSection] = useState<SectionKey | null>(initialSection);
  const [drawer, setDrawer] = useState<DrawerState>({ open: false });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [baselineRes, settingsRes] = await Promise.all([
        fetch("/api/baseline"),
        fetch("/api/settings"),
      ]);
      const baselineJson = await baselineRes.json();
      if (baselineJson.ok) setBaseline(baselineJson.data as BaselineResponse);
      const settingsJson = await settingsRes.json();
      if (settingsJson.ok) setSettings(settingsJson.data as SettingsData);
    } catch {
      // keep current state
    }
  }, []);

  useEffect(() => {
    async function load() {
      await refresh();
      setLoading(false);
    }
    load();
  }, [refresh]);

  function toggleSection(key: SectionKey) {
    setExpandedSection((prev) => (prev === key ? null : key));
  }

  function openAdd(entityType: EntityType, category?: string) {
    setDrawer({ open: true, mode: "add", entityType, defaultCategory: category });
  }

  function openEdit(entityType: EntityType, id: string) {
    setDrawer({ open: true, mode: "edit", entityType, itemId: id });
  }

  function handleDrawerSuccess() {
    setDrawer({ open: false });
    refresh();
  }

  if (loading) {
    return (
      <div className="space-y-4 py-6">
        <div className="h-8 w-56 animate-pulse rounded bg-gray-200" />
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    );
  }

  // Data derivations
  const incomes = baseline?.incomes ?? [];
  const expenses = baseline?.expenses ?? [];
  const allAssets = baseline?.assets ?? [];
  const liabilities = baseline?.liabilities ?? [];
  const cashAssets = allAssets.filter((a) => CASH_CATEGORIES.has(a.category));
  const investmentAssets = allAssets.filter((a) => INVESTMENT_CATEGORIES.has(a.category));

  const incomeTotal = incomes.reduce((s, i) => s + i.monthlyAmount, 0);
  const expenseTotal = expenses.reduce((s, e) => s + e.monthlyAmount, 0);
  const cashTotal = cashAssets.reduce((s, a) => s + a.value, 0);
  const investmentTotal = investmentAssets.reduce((s, a) => s + a.value, 0);
  const debtTotal = liabilities.reduce((s, l) => s + l.balance, 0);

  const incomeItems: CategoryItem[] = incomes.map((i) => ({
    id: i.id, label: i.label, category: i.category, amount: i.monthlyAmount,
  }));
  const expenseItems: CategoryItem[] = expenses.map((e) => ({
    id: e.id, label: e.label, category: e.category, amount: e.monthlyAmount,
  }));
  const cashItems: CategoryItem[] = cashAssets.map((a) => ({
    id: a.id, label: a.label, category: a.category, amount: a.value,
  }));
  const investmentItems: CategoryItem[] = investmentAssets.map((a) => ({
    id: a.id, label: a.label, category: a.category, amount: a.value,
  }));
  const debtItems: CategoryItem[] = liabilities.map((l) => ({
    id: l.id, label: l.label, category: l.category, amount: l.balance,
    extra: l.annualInterestRate != null ? `${(l.annualInterestRate * 100).toFixed(1)}% APR` : undefined,
  }));

  const settingsEntries = settings
    ? Object.entries(assumptionLabels).map(([key, label]) => ({
        key,
        label,
        value: formatSettingValue(key, settings[key as keyof SettingsData]),
      }))
    : [];

  const drawerTitle = drawer.open ? drawerTitles[drawer.mode]?.[drawer.entityType] ?? "" : "";

  return (
    <div className="py-6">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Financial Inputs</h1>
      <p className="mb-6 text-sm text-gray-500">
        All the data that powers your overview, projections, and decisions.
      </p>

      <div className="space-y-4">
        <InputCategoryCard
          id="income"
          title="Income"
          description="Monthly income sources"
          itemCount={incomes.length}
          totalValue={formatCurrency(incomeTotal)}
          totalLabel="Monthly"
          helperText="Used in monthly surplus"
          expanded={expandedSection === "income"}
          onToggle={() => toggleSection("income")}
        >
          <ItemList
            items={incomeItems}
            total={incomeTotal}
            entityLabel="income"
            onEditItem={(id) => openEdit("income", id)}
            onAddItem={() => openAdd("income")}
          />
        </InputCategoryCard>

        <InputCategoryCard
          id="spending"
          title="Spending"
          description="Monthly expenses by category"
          itemCount={expenses.length}
          totalValue={formatCurrency(expenseTotal)}
          totalLabel="Monthly"
          helperText="Used in monthly surplus, emergency runway"
          expanded={expandedSection === "spending"}
          onToggle={() => toggleSection("spending")}
        >
          <ItemList
            items={expenseItems}
            total={expenseTotal}
            entityLabel="expense"
            onEditItem={(id) => openEdit("expense", id)}
            onAddItem={() => openAdd("expense")}
          />
        </InputCategoryCard>

        <InputCategoryCard
          id="cash"
          title="Cash & Savings"
          description="Liquid assets available for emergencies"
          itemCount={cashAssets.length}
          totalValue={formatCurrency(cashTotal)}
          totalLabel="Total"
          helperText="Used in emergency runway"
          expanded={expandedSection === "cash"}
          onToggle={() => toggleSection("cash")}
        >
          <ItemList
            items={cashItems}
            total={cashTotal}
            entityLabel="cash / savings"
            onEditItem={(id) => openEdit("asset", id)}
            onAddItem={() => openAdd("asset")}
          />
        </InputCategoryCard>

        <InputCategoryCard
          id="investments"
          title="Investments"
          description="Long-term assets including retirement and property"
          itemCount={investmentAssets.length}
          totalValue={formatCurrency(investmentTotal)}
          totalLabel="Total"
          helperText="Used in net worth projection"
          expanded={expandedSection === "investments"}
          onToggle={() => toggleSection("investments")}
        >
          <ItemList
            items={investmentItems}
            total={investmentTotal}
            entityLabel="investment"
            onEditItem={(id) => openEdit("asset", id)}
            onAddItem={() => openAdd("asset")}
          />
        </InputCategoryCard>

        <InputCategoryCard
          id="debt"
          title="Debt"
          description="Outstanding balances and interest rates"
          itemCount={liabilities.length}
          totalValue={formatCurrency(debtTotal)}
          totalLabel="Total"
          helperText="Used in debt-to-income ratio"
          expanded={expandedSection === "debt"}
          onToggle={() => toggleSection("debt")}
        >
          <ItemList
            items={debtItems}
            total={debtTotal}
            entityLabel="debt"
            onEditItem={(id) => openEdit("liability", id)}
            onAddItem={() => openAdd("liability")}
          />
        </InputCategoryCard>

        <InputCategoryCard
          id="assumptions"
          title="Assumptions & Guardrails"
          description="Growth rates, limits, and thresholds used in projections"
          itemCount={settingsEntries.length}
          helperText="Used in projections and decision evaluation"
          expanded={expandedSection === "assumptions"}
          onToggle={() => toggleSection("assumptions")}
        >
          <div className="space-y-2">
            {settingsEntries.map((entry) => (
              <div key={entry.key} className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-600">{entry.label}</span>
                <span className="text-sm font-medium text-gray-900">{entry.value}</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => openEdit("assumptions", "settings")}
            className="mt-3 flex items-center gap-1.5 rounded-md border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
            </svg>
            Edit assumptions
          </button>
        </InputCategoryCard>
      </div>

      <Drawer open={drawer.open} onClose={() => setDrawer({ open: false })} title={drawerTitle}>
        {drawer.open && (
          <DrawerForm
            drawer={drawer}
            baseline={baseline}
            onSuccess={handleDrawerSuccess}
          />
        )}
      </Drawer>
    </div>
  );
}
