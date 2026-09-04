import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { PlanCard } from "@/components/plan-card";
import { useRepSensor } from "@/hooks/use-rep-sensor";
import { setSettings, useSettings } from "@/lib/app-state";
import { TRAINING_PLANS } from "@/lib/training-plans";

export const Route = createFileRoute("/config")({
  head: () => ({
    meta: [
      { title: "PUSH — plan i czujnik" },
      {
        name: "description",
        content:
          "Wybierz plan treningowy pompek i ustaw czułość czujnika, który liczy powtórzenia.",
      },
      { property: "og:title", content: "PUSH — plan i czujnik" },
      {
        property: "og:description",
        content: "Plan treningowy pompek i czułość liczenia powtórzeń.",
      },
    ],
  }),
  component: ConfigPage,
});

function ConfigPage() {
  const { planId, sensorKind, threshold } = useSettings();
  const test = useRepSensor({ kind: sensorKind, threshold });

  useEffect(() => {
    test.start();
    return () => test.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="flex-1 px-8 py-12 space-y-14">
      <section className="space-y-5">
        <h2 className="text-3xl font-extrabold">Plan</h2>
        <div className="space-y-4">
          {TRAINING_PLANS.map((p) => (
            <PlanCard
              key={p.id}
              plan={p}
              selected={p.id === planId}
              onSelect={() => setSettings({ planId: p.id })}
            />
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-extrabold">Czujnik</h2>

        <div className="space-y-3">
          <div className="flex justify-between text-lg">
            <span className="text-muted-foreground">Czułość</span>
            <span className="tabular-nums">{threshold} mm</span>
          </div>
          <input
            type="range"
            min={3}
            max={16}
            value={threshold}
            onChange={(e) => setSettings({ threshold: Number(e.target.value) })}
            className="w-full accent-[var(--accent)]"
          />
        </div>

        <div className="flex items-baseline justify-between rounded-2xl bg-surface px-5 py-5">
          <span className="text-lg text-muted-foreground">Wykryte powtórzenia</span>
          <span className="text-3xl font-extrabold tabular-nums">{test.reps}</span>
        </div>
      </section>
    </main>
  );
}
