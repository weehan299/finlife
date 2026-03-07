interface RunwayGaugeProps {
  months: number;
  status: "safe" | "borderline" | "unsafe";
}

export default function RunwayGauge({ months, status }: RunwayGaugeProps) {
  // Semicircle gauge: 0-12 months range
  const maxMonths = 12;
  const clamped = Math.min(Math.max(months, 0), maxMonths);
  const ratio = clamped / maxMonths;

  // Arc from 180deg (left) to 0deg (right)
  const angle = Math.PI * (1 - ratio);
  const cx = 100;
  const cy = 90;
  const r = 70;

  // Needle endpoint
  const nx = cx + r * Math.cos(angle);
  const ny = cy - r * Math.sin(angle);

  // Zone arcs: unsafe (0-3), borderline (3-6), safe (6-12)
  function arcPath(startFrac: number, endFrac: number): string {
    const a1 = Math.PI * (1 - startFrac);
    const a2 = Math.PI * (1 - endFrac);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy - r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2);
    const y2 = cy - r * Math.sin(a2);
    const largeArc = Math.abs(endFrac - startFrac) > 0.5 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  }

  const statusColor = {
    safe: "text-green-600",
    borderline: "text-amber-600",
    unsafe: "text-red-600",
  }[status];

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 110" className="w-48" role="img" aria-label={`Emergency runway: ${months} months`}>
        {/* Zone arcs */}
        <path d={arcPath(0, 3 / maxMonths)} fill="none" stroke="#fca5a5" strokeWidth={14} strokeLinecap="round" />
        <path d={arcPath(3 / maxMonths, 6 / maxMonths)} fill="none" stroke="#fcd34d" strokeWidth={14} strokeLinecap="round" />
        <path d={arcPath(6 / maxMonths, 1)} fill="none" stroke="#86efac" strokeWidth={14} strokeLinecap="round" />

        {/* Needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#374151" strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={4} fill="#374151" />

        {/* Labels */}
        <text x={cx - r - 6} y={cy + 14} textAnchor="middle" className="fill-gray-400 text-[9px]">0</text>
        <text x={cx + r + 6} y={cy + 14} textAnchor="middle" className="fill-gray-400 text-[9px]">12</text>
      </svg>
      <p className={`-mt-2 text-3xl font-bold ${statusColor}`}>
        {months}
      </p>
      <p className="text-sm text-gray-500">months runway</p>
    </div>
  );
}
