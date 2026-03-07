import type { GuardrailStatus } from "@/types/decision.types";

const statusDot: Record<GuardrailStatus, string> = {
  PASS: "bg-green-500",
  CAUTION: "bg-amber-500",
  FAIL: "bg-red-500",
};

const statusText: Record<GuardrailStatus, string> = {
  PASS: "text-green-700",
  CAUTION: "text-amber-700",
  FAIL: "text-red-700",
};

interface ImpactCardProps {
  label: string;
  value: string;
  target: string;
  status: GuardrailStatus;
}

export default function ImpactCard({ label, value, target, status }: ImpactCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${statusDot[status]}`} />
        <p className="text-sm font-medium text-gray-500">{label}</p>
      </div>
      <p className={`mt-2 text-2xl font-semibold ${statusText[status]}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-gray-400">{target}</p>
    </div>
  );
}
