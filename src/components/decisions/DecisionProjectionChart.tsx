"use client";

import type { EvaluateDecisionOutput, GuardrailStatus } from "@/types/decision.types";
import type { SnapshotWithExtras } from "@/lib/snapshot";
import { DEFAULT_ASSUMPTIONS } from "@/lib/defaults";
import { formatCurrency } from "@/lib/format";

interface DecisionProjectionChartProps {
  result: EvaluateDecisionOutput;
}

interface ProjectionPoint {
  month: number;
  baseline: number;
  withDecision: number;
}

interface Annotation {
  month: number;
  type: "buffer-breach" | "negative" | "recovery";
  label: string;
  color: string;
}

// --------------- Pure projection logic ---------------

function buildCashProjection(
  baseline: SnapshotWithExtras,
  postDecision: SnapshotWithExtras,
): ProjectionPoint[] {
  const points: ProjectionPoint[] = [];
  for (let m = 0; m <= 12; m++) {
    points.push({
      month: m,
      baseline: baseline.liquidAssets + m * baseline.monthlySurplus,
      withDecision: postDecision.liquidAssets + m * postDecision.monthlySurplus,
    });
  }
  return points;
}

function detectAnnotations(
  points: ProjectionPoint[],
  safetyTarget: number,
): Annotation[] {
  const annotations: Annotation[] = [];
  let breached = false;
  let wentNegative = false;
  let troughFound = false;

  for (let i = 1; i < points.length; i++) {
    const val = points[i].withDecision;
    const prev = points[i - 1].withDecision;

    if (!breached && val < safetyTarget) {
      breached = true;
      annotations.push({
        month: points[i].month,
        type: "buffer-breach",
        label: "Below safety target",
        color: "#d97706",
      });
    }

    if (!wentNegative && val < 0) {
      wentNegative = true;
      annotations.push({
        month: points[i].month,
        type: "negative",
        label: "Cash negative",
        color: "#dc2626",
      });
    }

    if (breached && !troughFound && val > prev && prev <= val) {
      troughFound = true;
      annotations.push({
        month: points[i].month,
        type: "recovery",
        label: "Recovery begins",
        color: "#16a34a",
      });
    }
  }
  return annotations;
}

function buildInsightLabel(
  points: ProjectionPoint[],
  safetyTarget: number,
  minEmergencyMonths: number,
): string {
  const breachMonth = points.find(
    (p) => p.month > 0 && p.withDecision < safetyTarget,
  );
  const negativeMonth = points.find(
    (p) => p.month > 0 && p.withDecision < 0,
  );

  // Find recovery: month where cash starts rising after a trough
  let recoveryMonth: number | null = null;
  for (let i = 2; i < points.length; i++) {
    if (
      points[i].withDecision > points[i - 1].withDecision &&
      points[i - 1].withDecision < safetyTarget
    ) {
      recoveryMonth = points[i].month;
      break;
    }
  }

  if (negativeMonth) {
    return `Cash turns negative at month ${negativeMonth.month}. This decision is not sustainable.`;
  }

  if (breachMonth && !recoveryMonth) {
    return `You remain below your ${minEmergencyMonths}-month safety target for the full duration.`;
  }

  if (breachMonth && recoveryMonth) {
    return `Cash drops below your safety target at month ${breachMonth.month}, recovering by month ${recoveryMonth}.`;
  }

  return `You stay above your ${minEmergencyMonths}-month safety target throughout.`;
}

// --------------- Color mapping ---------------

const verdictColors: Record<GuardrailStatus, { stroke: string; fill: string }> = {
  PASS: { stroke: "#16a34a", fill: "#22c55e" },
  CAUTION: { stroke: "#d97706", fill: "#f59e0b" },
  FAIL: { stroke: "#dc2626", fill: "#ef4444" },
};

// --------------- Chart constants ---------------

const CHART_W = 600;
const CHART_H = 200;
const PAD = { top: 24, right: 32, bottom: 32, left: 16 };
const PLOT_W = CHART_W - PAD.left - PAD.right;
const PLOT_H = CHART_H - PAD.top - PAD.bottom;

export default function DecisionProjectionChart({
  result,
}: DecisionProjectionChartProps) {
  const { baselineSnapshot, postDecisionSnapshot, verdict } = result;
  const minEmergencyMonths = DEFAULT_ASSUMPTIONS.minEmergencyMonths;
  const safetyTarget =
    baselineSnapshot.monthlyExpenses * minEmergencyMonths;

  const points = buildCashProjection(baselineSnapshot, postDecisionSnapshot);
  const annotations = detectAnnotations(points, safetyTarget);
  const insight = buildInsightLabel(points, safetyTarget, minEmergencyMonths);

  // Compute Y range across all values including safety target and zero
  const allValues = points.flatMap((p) => [p.baseline, p.withDecision]);
  allValues.push(safetyTarget);
  if (Math.min(...allValues) < 0) allValues.push(0);

  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const valRange = rawMax - rawMin || 1;
  const valPad = valRange * 0.1;
  const yMin = rawMin - valPad;
  const yMax = rawMax + valPad;

  function x(month: number) {
    return PAD.left + (month / 12) * PLOT_W;
  }

  function y(val: number) {
    return PAD.top + PLOT_H - ((val - yMin) / (yMax - yMin)) * PLOT_H;
  }

  // Build paths
  const baselineCoords = points.map((p) => ({ cx: x(p.month), cy: y(p.baseline) }));
  const decisionCoords = points.map((p) => ({ cx: x(p.month), cy: y(p.withDecision) }));

  const baselineLine = baselineCoords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.cx},${c.cy}`)
    .join(" ");
  const decisionLine = decisionCoords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.cx},${c.cy}`)
    .join(" ");

  const baselineArea = `${baselineLine} L${baselineCoords[12].cx},${PAD.top + PLOT_H} L${baselineCoords[0].cx},${PAD.top + PLOT_H} Z`;
  const decisionArea = `${decisionLine} L${decisionCoords[12].cx},${PAD.top + PLOT_H} L${decisionCoords[0].cx},${PAD.top + PLOT_H} Z`;

  const vColor = verdictColors[verdict];
  const xLabels = [
    { month: 0, label: "Now" },
    { month: 3, label: "3m" },
    { month: 6, label: "6m" },
    { month: 9, label: "9m" },
    { month: 12, label: "12m" },
  ];

  const safetyY = y(safetyTarget);
  const showZeroLine = rawMin < 0;
  const zeroY = y(0);

  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold text-gray-900">
        Cash projection (12 months)
      </h3>
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          className="w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="baselineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="decisionGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={vColor.fill} stopOpacity={0.18} />
              <stop offset="100%" stopColor={vColor.fill} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          {/* Safety target dashed line */}
          <line
            x1={PAD.left}
            y1={safetyY}
            x2={PAD.left + PLOT_W}
            y2={safetyY}
            stroke="#9ca3af"
            strokeWidth={1}
            strokeDasharray="6 4"
          />
          <text
            x={PAD.left + PLOT_W + 4}
            y={safetyY + 4}
            fontSize={9}
            className="fill-gray-400"
          >
            {minEmergencyMonths}-mo buffer
          </text>

          {/* Zero line */}
          {showZeroLine && (
            <line
              x1={PAD.left}
              y1={zeroY}
              x2={PAD.left + PLOT_W}
              y2={zeroY}
              stroke="#d1d5db"
              strokeWidth={1}
            />
          )}

          {/* Baseline area + line */}
          <path d={baselineArea} fill="url(#baselineGrad)" />
          <path
            d={baselineLine}
            fill="none"
            stroke="#16a34a"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Decision area + line */}
          <path d={decisionArea} fill="url(#decisionGrad)" />
          <path
            d={decisionLine}
            fill="none"
            stroke={vColor.stroke}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Annotation markers */}
          {annotations.map((a) => (
            <circle
              key={a.type}
              cx={x(a.month)}
              cy={y(
                points.find((p) => p.month === a.month)!.withDecision,
              )}
              r={5}
              fill={a.color}
              fillOpacity={0.3}
              stroke={a.color}
              strokeWidth={2}
            />
          ))}

          {/* Endpoint dots — baseline */}
          {[0, 12].map((m) => (
            <circle
              key={`b-${m}`}
              cx={x(m)}
              cy={y(points[m].baseline)}
              r={4}
              fill="#fff"
              stroke="#16a34a"
              strokeWidth={2}
            />
          ))}

          {/* Endpoint dots — decision */}
          {[0, 12].map((m) => (
            <circle
              key={`d-${m}`}
              cx={x(m)}
              cy={y(points[m].withDecision)}
              r={4}
              fill="#fff"
              stroke={vColor.stroke}
              strokeWidth={2}
            />
          ))}

          {/* X-axis labels */}
          {xLabels.map((l) => (
            <text
              key={l.month}
              x={x(l.month)}
              y={PAD.top + PLOT_H + 18}
              textAnchor="middle"
              className="fill-gray-500"
              fontSize={11}
              fontWeight={500}
            >
              {l.label}
            </text>
          ))}
        </svg>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: "#16a34a" }}
            />
            Without decision
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: vColor.stroke }}
            />
            With decision
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0 w-4 border-t border-dashed border-gray-400" />
            Safety target ({formatCurrency(safetyTarget)})
          </span>
        </div>

        {/* Insight */}
        <p className="mt-2 text-sm text-gray-600">{insight}</p>
      </div>
    </div>
  );
}
