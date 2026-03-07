"use client";

import { formatCurrency } from "@/lib/format";
import { getCategoryLabel } from "@/lib/category-labels";
import type { CategoryItem } from "@/components/ui/CategoryBreakdown";

interface ItemListProps {
  items: CategoryItem[];
  total: number;
  entityLabel: string;
  onEditItem?: (id: string) => void;
  onAddItem?: () => void;
}

export default function ItemList({
  items,
  total,
  entityLabel,
  onEditItem,
  onAddItem,
}: ItemListProps) {
  const sorted = [...items].sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-1">
      {sorted.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-gray-50"
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="text-sm text-gray-900">{item.label}</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
              {getCategoryLabel(item.category)}
            </span>
            {item.extra && (
              <span className="text-xs text-gray-400">{item.extra}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">
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

      <div className="flex items-center justify-between border-t border-gray-200 px-2 pt-2">
        <span className="text-sm font-semibold text-gray-900">Total</span>
        <span className="text-sm font-semibold text-gray-900">
          {formatCurrency(total)}
        </span>
      </div>

      {onAddItem && (
        <button
          type="button"
          onClick={onAddItem}
          className="mt-2 flex items-center gap-1.5 rounded-md border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add {entityLabel}
        </button>
      )}
    </div>
  );
}
