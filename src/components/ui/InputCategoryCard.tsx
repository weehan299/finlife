"use client";

import { useEffect, useRef } from "react";

interface InputCategoryCardProps {
  id: string;
  title: string;
  description: string;
  itemCount: number;
  totalValue?: string;
  totalLabel?: string;
  helperText: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export default function InputCategoryCard({
  id,
  title,
  description,
  itemCount,
  totalValue,
  totalLabel,
  helperText,
  expanded,
  onToggle,
  children,
}: InputCategoryCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (expanded && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [expanded]);

  return (
    <div ref={ref} id={id} className="rounded-lg border border-gray-200 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-4 p-5 text-left"
      >
        <svg
          className={`mt-0.5 h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
            {totalValue && (
              <span className="ml-auto text-sm font-medium text-gray-900">
                {totalLabel ? `${totalLabel}: ` : ""}{totalValue}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
          <p className="mt-0.5 text-xs italic text-gray-400">{helperText}</p>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-5 pb-5 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}
