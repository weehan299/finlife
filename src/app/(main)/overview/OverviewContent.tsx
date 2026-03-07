"use client";

import { useCallback, useEffect, useState } from "react";
import type { BaselineResponse } from "@/types/baseline.types";
import type { ProjectionResponse } from "@/types/snapshot.types";
import type { DrawerState, EntityType } from "@/types/drawer.types";
import { computeSnapshot } from "@/lib/snapshot";
import type { SnapshotWithExtras } from "@/lib/snapshot";
import IntentSelector from "@/components/IntentSelector";
import QuickSetupForm from "@/components/forms/QuickSetupForm";
import SnapshotDisplay from "@/components/metrics/SnapshotDisplay";
import ProjectionDisplay from "@/components/metrics/ProjectionDisplay";
import NextActions from "@/components/NextActions";
import Drawer from "@/components/ui/Drawer";
import DrawerForm, { drawerTitles } from "@/components/forms/DrawerForm";

type Step = "loading" | "intent" | "setup" | "snapshot";

export default function OverviewContent() {
  const [step, setStep] = useState<Step>("loading");
  const [snapshot, setSnapshot] = useState<SnapshotWithExtras | null>(null);
  const [baseline, setBaseline] = useState<BaselineResponse | null>(null);
  const [projections, setProjections] = useState<ProjectionResponse | null>(null);
  const [drawer, setDrawer] = useState<DrawerState>({ open: false });

  const refreshBaseline = useCallback(async () => {
    try {
      const [baselineRes, projRes] = await Promise.all([
        fetch("/api/baseline"),
        fetch("/api/projections"),
      ]);
      const baselineJson = await baselineRes.json();
      if (baselineJson.ok) {
        const data = baselineJson.data as BaselineResponse;
        setSnapshot(computeSnapshot(data));
        setBaseline(data);
      }
      const projJson = await projRes.json();
      if (projJson.ok) {
        setProjections(projJson.data as ProjectionResponse);
      }
    } catch {
      // keep current state on error
    }
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [baselineRes, projRes] = await Promise.all([
          fetch("/api/baseline"),
          fetch("/api/projections"),
        ]);
        const json = await baselineRes.json();
        if (!json.ok) {
          setStep("intent");
          return;
        }
        const data = json.data as BaselineResponse;
        const hasData =
          data.assets.length > 0 ||
          data.liabilities.length > 0 ||
          data.incomes.length > 0 ||
          data.expenses.length > 0;

        if (hasData) {
          setSnapshot(computeSnapshot(data));
          setBaseline(data);
          const projJson = await projRes.json();
          if (projJson.ok) {
            setProjections(projJson.data as ProjectionResponse);
          }
          setStep("snapshot");
        } else {
          setStep("intent");
        }
      } catch {
        setStep("intent");
      }
    }
    load();
  }, []);

  function handleSetupComplete(data: BaselineResponse) {
    setSnapshot(computeSnapshot(data));
    setBaseline(data);
    setStep("snapshot");
  }

  function handleAddItem(entityType: string, category?: string) {
    setDrawer({
      open: true,
      mode: "add",
      entityType: entityType as EntityType,
      defaultCategory: category,
    });
  }

  function handleEditItem(entityType: string, id: string) {
    setDrawer({
      open: true,
      mode: "edit",
      entityType: entityType as EntityType,
      itemId: id,
    });
  }

  function handleDrawerSuccess() {
    setDrawer({ open: false });
    refreshBaseline();
  }

  function closeDrawer() {
    setDrawer({ open: false });
  }

  if (step === "loading") {
    return (
      <div className="space-y-4 py-12">
        <div className="mx-auto h-6 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mx-auto h-4 w-64 animate-pulse rounded bg-gray-100" />
        <div className="mx-auto grid max-w-2xl grid-cols-2 gap-4 pt-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg bg-gray-100"
            />
          ))}
        </div>
      </div>
    );
  }

  if (step === "intent") {
    return <IntentSelector onSelect={() => setStep("setup")} />;
  }

  if (step === "setup") {
    return <QuickSetupForm onComplete={handleSetupComplete} />;
  }

  const drawerTitle = drawer.open ? drawerTitles[drawer.mode][drawer.entityType] : "";

  return (
    <div className="py-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        Your Financial Overview
      </h1>
      {snapshot && baseline && (
        <SnapshotDisplay
          snapshot={snapshot}
          baseline={baseline}
          onAddItem={handleAddItem}
          onEditItem={handleEditItem}
        />
      )}
      {projections && <ProjectionDisplay projections={projections} />}
      <NextActions />

      <Drawer open={drawer.open} onClose={closeDrawer} title={drawerTitle}>
        {drawer.open && (
          <DrawerForm
            drawer={drawer}
            baseline={baseline}
            onSuccess={handleDrawerSuccess}
          />
        )}
      </Drawer>
    </div>
  );
}

