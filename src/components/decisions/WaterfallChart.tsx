import type { UpfrontWaterfallStep } from "@/types/decision.types";
import { formatCurrency } from "@/lib/format";

interface WaterfallChartProps {
  steps: UpfrontWaterfallStep[];
  reserveTarget: number;
}

export default function WaterfallChart({ steps, reserveTarget }: WaterfallChartProps) {
  if (steps.length === 0) return null;

  const maxAmount = Math.max(...steps.map((s) => Math.abs(s.runningTotal)), ...steps.map((s) => Math.abs(s.amount)));
  const scale = maxAmount > 0 ? 100 / maxAmount : 1;

  const barHeight = 36;
  const gap = 12;
  const labelWidth = 160;
  const valueWidth = 100;
  const chartWidth = 300;
  const svgWidth = labelWidth + chartWidth + valueWidth;
  const svgHeight = steps.length * (barHeight + gap) - gap;

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="w-full"
      role="img"
      aria-label="Cash waterfall breakdown"
    >
      {steps.map((step, i) => {
        const y = i * (barHeight + gap);
        const isFirst = i === 0;
        const isLast = i === steps.length - 1;
        const barValue = isFirst ? step.amount : Math.abs(step.amount);
        const barW = Math.max(barValue * scale, 2);

        let barX: number;
        if (isFirst) {
          barX = labelWidth;
        } else {
          barX = labelWidth + Math.max(step.runningTotal * scale, 0);
        }

        let fill: string;
        if (isFirst) {
          fill = "#22c55e"; // green-500
        } else if (isLast) {
          fill = step.runningTotal >= reserveTarget ? "#22c55e" : "#ef4444";
        } else {
          fill = "#ef4444"; // red-500
        }

        return (
          <g key={i}>
            <text
              x={labelWidth - 8}
              y={y + barHeight / 2}
              textAnchor="end"
              dominantBaseline="central"
              className="fill-gray-600 text-[11px]"
            >
              {step.label}
            </text>
            <rect
              x={barX}
              y={y + 4}
              width={barW}
              height={barHeight - 8}
              rx={4}
              fill={fill}
              opacity={0.85}
            />
            <text
              x={labelWidth + chartWidth + 8}
              y={y + barHeight / 2}
              dominantBaseline="central"
              className="fill-gray-700 text-[12px] font-semibold"
            >
              {step.amount >= 0 ? "" : "-"}{formatCurrency(Math.abs(step.amount))}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
