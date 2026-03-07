import type { NarrativeData } from "@/types/decision.types";
import { formatCurrency } from "@/lib/format";
import MetricCard from "@/components/ui/MetricCard";
import RunwayGauge from "./RunwayGauge";

interface ResilienceSectionProps {
  resilience: NarrativeData["resilienceData"];
}

export default function ResilienceSection({ resilience }: ResilienceSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">
        If something goes wrong: are you still safe?
      </h3>
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <RunwayGauge
            months={resilience.runwayMonths}
            status={resilience.runwayStatus}
          />
          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            <MetricCard
              label="Stressed surplus"
              value={formatCurrency(resilience.stressedSurplus)}
              status={resilience.stressedSurplus >= 0 ? "positive" : "negative"}
            />
            <MetricCard
              label="Guaranteed income"
              value={formatCurrency(resilience.guaranteedIncome)}
              subtitle="Income if non-guaranteed drops"
              status="neutral"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
