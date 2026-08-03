import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { PlanCard } from "@/components/plan-card";
import { useRepSensor } from "@/hooks/use-rep-sensor";
import { setSettings, useSettings } from "@/lib/app-state";
import { TRAINING_PLANS } from "@/lib/training-plans";

export const Route = createFileRoute("/config")({
  head: () => ({
    meta: [
      { title: "Config — plan i kalibracja czujnika" },
      {
        name: "description",
        content:
          "Wybierz plan treningowy pompek, źródło czujnika (zbliżeniowy lub Halla), próg detekcji i tryb OLED.",
      },
      { property: "og:title", content: "Config — plan i kalibracja czujnika" },
      {
        property: "og:description",
        content: "Plan treningowy, źródło czujnika, próg detekcji i tryb OLED.",
      },
    ],
  }),
  component: ConfigPage,
});

function ConfigPage() {
  const { planId, sensorKind, threshold, oled } = useSettings();
  const test = useRepSensor({ kind: sensorKind, threshold });

  useEffect(() => {
    test.start();
    return () => test.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="flex-1 px-6 py-8 space-y-12">
      <section className="space-y-4">
        <h2 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Training_Plan
        </h2>
        <div className="space-y-3">
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

      <section className="space-y-5">
        <h2 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Sensor_Calibration
        </h2>

        <div className="grid grid-cols-2 gap-px bg-border border border-border rounded-sm overflow-hidden">
          {(["proximity", "hall"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setSettings({ sensorKind: k })}
              className={`py-4 font-mono text-[10px] uppercase tracking-widest ${
                sensorKind === k
                  ? "bg-accent/10 text-accent"
                  : "bg-background text-muted-foreground"
              }`}
            >
              {k === "proximity" ? "Proximity" : "Hall Effect"}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex justify-between font-mono text-[10px]">
            <span className="text-muted-foreground">DETECTION_THRESHOLD</span>
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

        <div className="border border-border rounded-sm p-5 space-y-4">
          <div className="flex justify-between font-mono text-[10px]">
            <span className="text-muted-foreground">LIVE_TEST</span>
            <span className="text-accent">{test.reps} DETECTED</span>
          </div>
          <div className="h-16 flex items-end gap-px">
            <div
              className="w-full bg-accent/60 transition-[height] duration-75"
              style={{ height: `${Math.min(100, (test.distance / 20) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between font-mono text-[10px] border-t border-border pt-3">
            <span className="text-muted-foreground">DIST</span>
            <span className="tabular-nums">{test.distance.toFixed(1)} mm</span>
          </div>
        </div>
      </section>

      <section className="space-y-4 pb-2">
        <h2 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Display
        </h2>
        <div className="grid grid-cols-2 gap-px bg-border border border-border rounded-sm overflow-hidden">
          <button
            onClick={() => setSettings({ oled: true })}
            className={`py-4 font-mono text-[10px] uppercase tracking-widest ${
              oled ? "bg-accent/10 text-accent" : "bg-background text-muted-foreground"
            }`}
          >
            OLED / True Black
          </button>
          <button
            onClick={() => setSettings({ oled: false })}
            className={`py-4 font-mono text-[10px] uppercase tracking-widest ${
              !oled ? "bg-accent/10 text-accent" : "bg-background text-muted-foreground"
            }`}
          >
            Dim
          </button>
        </div>
      </section>
    </main>
  );
}
