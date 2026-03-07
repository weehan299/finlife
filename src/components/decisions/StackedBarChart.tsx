import { formatCurrency } from "@/lib/format";
import type { NarrativeData } from "@/types/decision.types";

interface StackedBarChartProps {
  breakdown: NarrativeData["monthlyBreakdown"];
}

export default function StackedBarChart({ breakdown }: StackedBarChartProps) {
  const { income, existingExpenses, newExpense, newExpenseLabel, remainingBuffer } = breakdown;
  if (income <= 0) return null;

  const total = existingExpenses + newExpense + Math.max(remainingBuffer, 0);
  const barTotal = Math.max(total, income);
  const scale = (v: number) => Math.max((v / barTotal) * 100, 0);

  const existingW = scale(existingExpenses);
  const newW = scale(newExpense);
  const bufferW = remainingBuffer > 0 ? scale(remainingBuffer) : 0;
  const overflowW = remainingBuffer < 0 ? scale(Math.abs(remainingBuffer)) : 0;

  const barHeight = 32;
  const svgHeight = barHeight + 60;

  return (
    <div className="space-y-2">
      <svg viewBox={`0 0 400 ${svgHeight}`} className="w-full" role="img" aria-label="Monthly income breakdown">
        {/* Income reference line */}
        <line
          x1={scale(income) * 4}
          y1={0}
          x2={scale(income) * 4}
          y2={barHeight}
          stroke="#9ca3af"
          strokeWidth={1.5}
          strokeDasharray="4,3"
        />
        <text
          x={scale(income) * 4}
          y={barHeight + 14}
          textAnchor="middle"
          className="fill-gray-400 text-[10px]"
        >
          Income: {formatCurrency(income)}
        </text>

        {/* Existing expenses */}
        <rect x={0} y={0} width={existingW * 4} height={barHeight} rx={4} fill="#9ca3af" opacity={0.7} />

        {/* New expense */}
        <rect
          x={existingW * 4}
          y={0}
          width={newW * 4}
          height={barHeight}
          rx={remainingBuffer >= 0 ? 0 : 0}
          fill={remainingBuffer >= 0 ? "#f59e0b" : "#ef4444"}
          opacity={0.85}
        />

        {/* Buffer (if positive) */}
        {bufferW > 0 && (
          <rect
            x={(existingW + newW) * 4}
            y={0}
            width={bufferW * 4}
            height={barHeight}
            rx={4}
            fill="#22c55e"
            opacity={0.7}
          />
        )}

        {/* Overflow (if negative buffer) */}
        {overflowW > 0 && (
          <rect
            x={scale(income) * 4}
            y={0}
            width={overflowW * 4}
            height={barHeight}
            rx={4}
            fill="#ef4444"
            opacity={0.4}
          />
        )}

        {/* Labels row */}
        <text x={2} y={barHeight + 30} className="fill-gray-500 text-[10px]">
          Existing: {formatCurrency(existingExpenses)}
        </text>
        <text x={existingW * 4 + 2} y={barHeight + 30} className="fill-amber-700 text-[10px]">
          {newExpenseLabel}: {formatCurrency(newExpense)}
        </text>
        {remainingBuffer >= 0 ? (
          <text x={(existingW + newW) * 4 + 2} y={barHeight + 30} className="fill-green-700 text-[10px]">
            Buffer: {formatCurrency(remainingBuffer)}
          </text>
        ) : (
          <text x={(existingW + newW) * 4 + 2} y={barHeight + 30} className="fill-red-700 text-[10px]">
            Shortfall: {formatCurrency(remainingBuffer)}
          </text>
        )}
      </svg>
    </div>
  );
}
