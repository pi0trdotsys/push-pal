import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { RepCounter } from "@/components/rep-counter";
import { useRepSensor } from "@/hooks/use-rep-sensor";
import { dayVolume } from "@/lib/plan-30";
import { pushSession, todayPlan, useAppState } from "@/lib/session-store";

export const Route = createFileRoute("/session")({
  head: () => ({
    meta: [
      { title: "PUSH — trening" },
      {
        name: "description",
        content: "Tryb ćwiczenia: pełny ekran, jedna liczba, licznik z czujnika zbliżeniowego.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "PUSH — trening" },
      { property: "og:description", content: "Jedna liczba na czarnym ekranie." },
    ],
  }),
  component: SessionPage,
});

const REST_SECONDS = 60;

function SessionPage() {
  const app = useAppState();
  const navigate = useNavigate();
  const day = todayPlan(app);
  const target = dayVolume(day);

  const sensor = useRepSensor({ threshold: app.threshold });
  const [setIndex, setSetIndex] = useState(0);
  const [done, setDone] = useState(0);
  const [rest, setRest] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const base = useRef(0);

  const setTarget = day.sets[setIndex] ?? 0;
  const inSet = sensor.reps - base.current;

  // start on mount
  useEffect(() => {
    sensor.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // total timer
  useEffect(() => {
    if (finished) return;
    const id = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [finished]);

  // set completion
  useEffect(() => {
    if (finished || rest !== null || setTarget === 0) return;
    if (inSet >= setTarget) {
      sensor.pause();
      base.current = sensor.reps;
      setDone((d) => d + setTarget);
      if (setIndex + 1 >= day.sets.length) setFinished(true);
      else setRest(REST_SECONDS);
    }
  }, [inSet, setTarget, rest, finished, setIndex, day.sets.length, sensor]);

  // rest countdown
  useEffect(() => {
    if (rest === null) return;
    if (rest <= 0) {
      setRest(null);
      setSetIndex((i) => i + 1);
      sensor.start();
      return;
    }
    const id = window.setTimeout(() => setRest((r) => (r ?? 1) - 1), 1000);
    return () => window.clearTimeout(id);
  }, [rest, sensor]);

  const finish = () => {
    pushSession({
      date: app.today,
      reps: done,
      target,
      seconds: elapsed,
      tempo: sensor.tempo,
    });
    navigate({ to: "/" });
  };

  if (finished) {
    return (
      <main className="fixed inset-0 bg-background flex flex-col items-center justify-center gap-10 px-8 text-center">
        <span className="text-[32vw] leading-[0.85] font-extrabold tabular-nums">{done}</span>
        <p className="text-xl text-muted-foreground">
          Gotowe · {Math.floor(elapsed / 60)} min {elapsed % 60} s
        </p>
        <button
          onClick={finish}
          className="w-full max-w-xs py-6 rounded-2xl bg-foreground text-background text-xl font-bold"
        >
          Zakończ
        </button>
      </main>
    );
  }

  // Ekran przerwy — odliczanie do następnej serii; tap = pomiń przerwę.
  if (rest !== null) {
    const nextTarget = day.sets[setIndex + 1] ?? 0;
    return (
      <main
        className="fixed inset-0 bg-background flex flex-col items-center justify-center gap-12 select-none text-center px-8"
        onClick={() => setRest(0)}
      >
        <span className="text-2xl text-muted-foreground">Przerwa</span>

        <div className="flex flex-col items-center gap-10">
          <span className="text-[40vw] leading-[0.85] font-extrabold tabular-nums text-muted-foreground">
            {rest}
          </span>
          <div className="w-48 h-1 rounded-full bg-foreground/15 overflow-hidden">
            <div
              className="h-full rounded-full bg-foreground/40 transition-[width] duration-1000 ease-linear"
              style={{ width: `${(rest / REST_SECONDS) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="text-lg text-muted-foreground">
            Dalej: seria {setIndex + 2} z {day.sets.length} · {nextTarget} pompek
          </span>
          <span className="text-base text-muted-foreground/60">
            Dotknij, aby kontynuować
          </span>
        </div>
      </main>
    );
  }

  const paused = sensor.status !== "running";

  return (
    <main
      className="fixed inset-0 bg-background flex flex-col items-center justify-center gap-10"
      onClick={() => (sensor.status === "running" ? sensor.pause() : sensor.start())}
    >
      <RepCounter
        value={inSet}
        caption={`Seria ${setIndex + 1} z ${day.sets.length} · cel ${setTarget}`}
        progress={setTarget ? inSet / setTarget : 0}
        dim={paused}
      />
      {paused && (
        <span className="absolute bottom-16 text-lg text-muted-foreground/70">
          Pauza — dotknij, aby wznowić
        </span>
      )}
    </main>
  );
}
