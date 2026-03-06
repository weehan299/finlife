"use client";

import { formatCurrency } from "@/lib/format";
import type { ProjectionResponse } from "@/types/snapshot.types";

interface ProjectionDisplayProps {
  projections: ProjectionResponse;
}

const CHART_W = 600;
const CHART_H = 160;
const PAD = { top: 24, right: 32, bottom: 32, left: 16 };
const PLOT_W = CHART_W - PAD.left - PAD.right;
const PLOT_H = CHART_H - PAD.top - PAD.bottom;

export default function ProjectionDisplay({ projections }: ProjectionDisplayProps) {
  const { currentNetWorth, milestones } = projections;

  const points = [
    { label: "Today", months: 0, netWorth: currentNetWorth },
    ...milestones,
  ];

  const values = points.map((p) => p.netWorth);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const valRange = maxVal - minVal || 1;
  const valPad = valRange * 0.1;
  const yMin = minVal - valPad;
  const yMax = maxVal + valPad;

  // Space points evenly so "Today" and "1y" don't overlap
  function x(index: number) {
    const segments = points.length - 1;
    return PAD.left + (segments > 0 ? (index / segments) * PLOT_W : 0);
  }

  function y(val: number) {
    return PAD.top + PLOT_H - ((val - yMin) / (yMax - yMin)) * PLOT_H;
  }

  const lineCoords = points.map((p, i) => ({ cx: x(i), cy: y(p.netWorth) }));
  const linePath = lineCoords.map((c, i) => `${i === 0 ? "M" : "L"}${c.cx},${c.cy}`).join(" ");
  const areaPath = `${linePath} L${lineCoords[lineCoords.length - 1].cx},${PAD.top + PLOT_H} L${lineCoords[0].cx},${PAD.top + PLOT_H} Z`;

  return (
    <div className="mt-8 lg:max-w-[50%]">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        Net Worth Projection
      </h2>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        {/* SVG Chart */}
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          className="w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <path d={areaPath} fill="url(#projGrad)" />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#16a34a"
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Dots + x-axis labels */}
          {points.map((p, i) => {
            const cx = lineCoords[i].cx;
            const cy = lineCoords[i].cy;
            const shortLabel =
              p.months === 0
                ? "Today"
                : p.label.startsWith("Retirement")
                  ? `Age ${projections.retirementAge}`
                  : `${Math.round(p.months / 12)}y`;

            return (
              <g key={p.label}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill="#fff"
                  stroke="#16a34a"
                  strokeWidth={2}
                />
                <text
                  x={cx}
                  y={PAD.top + PLOT_H + 18}
                  textAnchor="middle"
                  className="fill-gray-500"
                  fontSize={11}
                  fontWeight={500}
                >
                  {shortLabel}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Milestone strip */}
        <div className="mt-4 flex flex-wrap justify-between gap-y-4 border-t border-gray-100 pt-4">
          {/* Today marker */}
          <div className="min-w-[80px] text-center">
            <p className="text-xs font-medium text-gray-400">Today</p>
            <p className="mt-0.5 text-sm font-bold text-gray-900">
              {formatCurrency(currentNetWorth)}
            </p>
          </div>

          {milestones.map((m) => {
            const change = m.netWorth - currentNetWorth;
            const isGrowth = change >= 0;

            return (
              <div key={m.label} className="min-w-[80px] text-center">
                <p className="text-xs font-medium text-gray-400">{m.label}</p>
                <p className="mt-0.5 text-sm font-bold text-gray-900">
                  {formatCurrency(m.netWorth)}
                </p>
                <p
                  className={`text-xs font-medium ${
                    isGrowth ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isGrowth ? "+" : ""}
                  {formatCurrency(change)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
