"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/format";
import { getCategoryLabel } from "@/lib/category-labels";

export interface CategoryItem {
  id: string;
  label: string;
  category: string;
  amount: number;
  extra?: string;
}

interface CategoryBreakdownProps {
  items: CategoryItem[];
  total: number;
  onEditItem?: (id: string) => void;
  onAddItem?: (category: string) => void;
  entityLabel: string;
}

interface CategoryGroup {
  category: string;
  label: string;
  items: CategoryItem[];
  sum: number;
  pct: number;
}

export default function CategoryBreakdown({
  items,
  total,
  onEditItem,
  onAddItem,
  entityLabel,
}: CategoryBreakdownProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const groups: CategoryGroup[] = Object.values(
    items.reduce<Record<string, CategoryGroup>>((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = {
          category: item.category,
          label: getCategoryLabel(item.category),
          items: [],
          sum: 0,
          pct: 0,
        };
      }
      acc[item.category].items.push(item);
      acc[item.category].sum += item.amount;
      return acc;
    }, {}),
  ).map((g) => ({ ...g, pct: total > 0 ? (g.sum / total) * 100 : 0 }));

  groups.sort((a, b) => b.sum - a.sum);

  function toggleCategory(category: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  return (
    <div className="space-y-1">
      {groups.map((group) => {
        const isExpanded = expanded.has(group.category);
        return (
          <div key={group.category}>
            <button
              type="button"
              onClick={() => toggleCategory(group.category)}
              className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-gray-50"
            >
              <svg
                className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              <span className="min-w-0 flex-1 text-sm font-medium text-gray-900">
                {group.label}
              </span>
              <div className="flex items-center gap-3">
                <div className="hidden w-24 sm:block">
                  <div className="h-2 rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${Math.min(group.pct, 100)}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-gray-500">{Math.round(group.pct)}%</span>
                <span className="w-20 text-right text-sm font-medium text-gray-900">
                  {formatCurrency(group.sum)}
                </span>
              </div>
            </button>

            {isExpanded && (
              <div className="ml-6 border-l border-gray-100 pl-3">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-1.5 pl-2"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-sm text-gray-700">{item.label}</span>
                      {item.extra && (
                        <span className="ml-2 text-xs text-gray-400">
                          {item.extra}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        {formatCurrency(item.amount)}
                      </span>
                      {onEditItem && (
                        <button
                          type="button"
                          onClick={() => onEditItem(item.id)}
                          className="rounded p-1 text-gray-400 hover:text-blue-600"
                          title={`Edit ${item.label}`}
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {onAddItem && (
                  <button
                    type="button"
                    onClick={() => onAddItem(group.category)}
                    className="mt-1 mb-1 flex items-center gap-1 rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add {entityLabel}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      <div className="flex items-center justify-between border-t border-gray-200 px-2 pt-2">
        <span className="text-sm font-semibold text-gray-900">Total</span>
        <span className="text-sm font-semibold text-gray-900">
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
}
