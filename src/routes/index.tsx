import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SeriesTimeline, type SeriesState } from "@/components/series-timeline";
import { SensorDial } from "@/components/sensor-dial";
import { WeekChart } from "@/components/week-chart";
import { SessionSummary } from "@/components/session-summary";
import { useRepSensor } from "@/hooks/use-rep-sensor";
import { usePlan, useSettings } from "@/lib/app-state";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PUSH — Monitor treningu pompek" },
      {
        name: "description",
        content:
          "Automatyczne liczenie pompek czujnikiem zbliżeniowym: timeline serii, telemetria i tempo w minimalistycznym interfejsie OLED.",
      },
      { property: "og:title", content: "PUSH — Monitor treningu pompek" },
      {
        property: "og:description",
        content: "Timeline serii, telemetria czujnika i tempo powtórzeń na czarnym ekranie OLED.",
      },
    ],
  }),
  component: MonitorPage,
});

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function MonitorPage() {
  const plan = usePlan();
  const { sensorKind, threshold } = useSettings();

  const [seriesIndex, setSeriesIndex] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);
  const [phase, setPhase] = useState<SeriesState>("pending");
  const [restLeft, setRestLeft] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const sensor = useRepSensor({ kind: sensorKind, threshold });
  const target = plan.series[seriesIndex];
  const finished = seriesIndex >= plan.series.length;

  // session clock
  useEffect(() => {
    if (finished) return;
    const id = window.setInterval(() => {
      if (phase !== "pending") setElapsed((e) => e + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, finished]);

  // series completed -> rest
  useEffect(() => {
    if (phase !== "current" || !target) return;
    if (sensor.reps >= target.reps) {
      sensor.pause();
      setCompleted((c) => [...c, target.reps]);
      setPhase("rest");
      setRestLeft(target.rest);
    }
  }, [sensor.reps, phase, target, sensor]);

  // rest countdown -> next series
  useEffect(() => {
    if (phase !== "rest") return;
    const id = window.setInterval(() => {
      setRestLeft((r) => {
        if (r <= 1) {
          window.clearInterval(id);
          sensor.reset();
          setSeriesIndex((i) => i + 1);
          setPhase("pending");
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, sensor]);

  const totalReps = useMemo(
    () => completed.reduce((a, b) => a + b, 0),
    [completed],
  );

  const duration = `${pad(Math.floor(elapsed / 60))}m ${pad(elapsed % 60)}s`;

  const reset = () => {
    setSeriesIndex(0);
    setCompleted([]);
    setPhase("pending");
    setElapsed(0);
    sensor.reset();
  };

  return (
    <>
      <main className="flex-1 px-6 py-8 space-y-12">
        <section className="space-y-6">
          <header className="flex justify-between items-baseline">
            <h2 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Today / {plan.code}
            </h2>
            <span className="text-xs font-mono text-accent tabular-nums">
              {plan.totalReps} Reps Total
            </span>
          </header>

          {finished ? (
            <SessionSummary
              totalReps={totalReps}
              duration={duration}
              tempo={sensor.tempo}
              onReset={reset}
            />
          ) : (
            <SeriesTimeline
              series={plan.series}
              currentIndex={seriesIndex}
              currentReps={sensor.reps}
              state={phase}
              restLeft={restLeft}
            />
          )}
        </section>

        <SensorDial
          distance={sensor.distance}
          tempo={sensor.tempo}
          stability={sensor.stability}
          kind={sensor.kind}
          active={sensor.status === "running"}
          pulse={sensor.pulse}
        />

        <WeekChart />
      </main>

      {!finished && (
        <div className="p-6 pt-0">
          <button
            onClick={() => {
              if (phase === "current") {
                sensor.pause();
                setPhase("pending");
              } else if (phase === "pending") {
                sensor.start();
                setPhase("current");
              }
            }}
            disabled={phase === "rest"}
            className="w-full py-5 bg-accent text-accent-foreground font-extrabold text-sm tracking-widest uppercase rounded-sm active:scale-[0.98] transition-transform disabled:opacity-30"
          >
            {phase === "rest"
              ? `Rest ${pad(restLeft)}s`
              : phase === "current"
                ? `Pause Series_${pad(seriesIndex + 1)}`
                : `Start Series_${pad(seriesIndex + 1)}`}
          </button>
        </div>
      )}
    </>
  );
}
