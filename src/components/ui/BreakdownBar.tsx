export interface BarSegment {
  label: string;
  value: number;
  color: string;
}

interface BreakdownBarProps {
  segments: BarSegment[];
}

export default function BreakdownBar({ segments }: BreakdownBarProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return null;

  return (
    <div>
      <div className="flex h-4 overflow-hidden rounded-full">
        {segments.map((seg) => {
          const pct = (seg.value / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={seg.label}
              className={`${seg.color} transition-all duration-300`}
              style={{ width: `${pct}%` }}
            />
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${seg.color}`} />
            {seg.label}
          </div>
        ))}
      </div>
    </div>
  );
}
