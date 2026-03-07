import type { UpfrontWaterfallStep } from "@/types/decision.types";
import WaterfallChart from "./WaterfallChart";

interface UpfrontImpactSectionProps {
  steps: UpfrontWaterfallStep[];
  reserveTarget: number;
}

export default function UpfrontImpactSection({ steps, reserveTarget }: UpfrontImpactSectionProps) {
  if (steps.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">
        Today: what happens the moment you decide
      </h3>
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <WaterfallChart steps={steps} reserveTarget={reserveTarget} />
      </div>
    </div>
  );
}
