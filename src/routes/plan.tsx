import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DayRow } from "@/components/day-row";
import { PlanEditor } from "@/components/plan-editor";
import { useRepSensor, type SensorKind } from "@/hooks/use-rep-sensor";
import { useNativeRepSensorSource, isNativeSensorAvailable } from "@/lib/native-sensor";
import { regeneratePlan, setSensorKind, setThreshold, useAppState } from "@/lib/session-store";

export const Route = createFileRoute("/plan")({
  head: () => ({
    meta: [
      { title: "PUSH — plan" },
      {
        name: "description",
        content: "Plan 30 dni pompek: generator progresji, ręczna edycja dni i kalibracja czujnika.",
      },
      { property: "og:title", content: "PUSH — plan" },
      { property: "og:description", content: "30 dni progresji i kalibracja czujnika Halla." },
    ],
  }),
  component: PlanPage,
});

const SENSOR_LABEL: Record<SensorKind, string> = {
  hall: "Hall",
  proximity: "Zbliżeniowy",
};

function PlanPage() {
  const app = useAppState();
  const [openDay, setOpenDay] = useState<number | null>(null);

  const source = useNativeRepSensorSource(app.sensorKind);
  const test = useRepSensor({ kind: app.sensorKind, threshold: app.threshold, source });

  useEffect(() => {
    test.start();
    return () => test.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.sensorKind]);

  return (
    <main className="flex-1 px-8 py-12 space-y-14">
      <section className="space-y-5">
        <h2 className="text-3xl font-extrabold">Plan</h2>
        <PlanEditor
          variant={app.variant}
          volume={app.volume}
          onChange={(variant, volume) => regeneratePlan(variant, volume)}
        />
      </section>

      <section className="space-y-1">
        <h2 className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground pb-3">
          30 dni
        </h2>
        <ul>
          {app.plan.map((d) => (
            <DayRow
              key={d.day}
              plan={d}
              isToday={d.date === app.today}
              open={openDay === d.day}
              onToggle={() => setOpenDay((o) => (o === d.day ? null : d.day))}
            />
          ))}
        </ul>
      </section>

      <section className="space-y-6">
        <h2 className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground">Czujnik</h2>

        <div className="flex gap-2">
          {(["hall", "proximity"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setSensorKind(k)}
              className={`flex-1 py-2.5 text-[11px] tracking-widest uppercase border ${
                k === app.sensorKind
                  ? "border-foreground text-foreground"
                  : "border-border text-muted-foreground"
              }`}
            >
              {SENSOR_LABEL[k]}
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {isNativeSensorAvailable()
            ? `Odczyt na żywo z czujnika ${SENSOR_LABEL[app.sensorKind].toLowerCase()} telefonu.`
            : "Podgląd webowy — symulowany sygnał. Na urządzeniu z Androidem liczy prawdziwy czujnik."}
        </p>

        <div className="space-y-3">
          <div className="flex justify-between text-lg">
            <span className="text-muted-foreground">Czułość</span>
            <span className="tabular-nums">{app.threshold} mm</span>
          </div>
          <input
            type="range"
            min={3}
            max={16}
            value={app.threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full accent-[var(--accent)]"
            aria-label="Czułość detekcji"
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
