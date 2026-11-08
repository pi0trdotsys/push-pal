import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Pause, Play, Minus, Plus } from "lucide-react";
import { useRepSensor } from "@/hooks/use-rep-sensor";
import { useNativeRepSensorSource } from "@/lib/native-sensor";
import {
  pushSession,
  saveActive,
  todayPlan,
  useAppState,
  type SessionResult,
} from "@/lib/session-store";
import {
  newSession,
  nextPhase,
  pauseSession,
  resumeSession,
  reviewSession,
  resultFor,
  remainingSeconds,
} from "@/lib/session-machine";
import { ExerciseGuide } from "@/components/exercise-guide";
import { EXERCISES } from "@/lib/exercises";
import { exerciseFor } from "@/lib/plan-30";
import { setKeepAwake } from "@/lib/widget-bridge";
export const Route = createFileRoute("/session")({ component: SessionPage });
function SessionPage() {
  const app = useAppState(),
    navigate = useNavigate(),
    s = app.active;
  const source = useNativeRepSensorSource(app.sensorKind),
    sensor = useRepSensor({ kind: app.sensorKind, threshold: app.threshold, source });
  const [now, setNow] = useState(Date.now()),
    [difficulty, setDifficulty] = useState<SessionResult["difficulty"]>(null);
  const current = useRef(s),
    seen = useRef(sensor.reps),
    mounted = useRef(false);
  current.current = s;
  // Recover into a deliberate pause; never count unattended on reopening.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      const saved = current.current;
      if (saved && !saved.paused) saveActive(pauseSession(saved));
    }
    return () => {
      const saved = current.current;
      if (saved && !saved.paused) saveActive(pauseSession(saved));
    };
  }, []);
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    const checkpoint = window.setInterval(() => {
      const saved = current.current;
      if (saved && !saved.paused) saveActive(saved);
    }, 5000);
    const suspend = () => {
      const saved = current.current;
      if (saved && !saved.paused) saveActive(pauseSession(saved));
    };
    const hidden = () => {
      if (document.hidden) suspend();
    };
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("push-background", suspend);
    window.addEventListener("pagehide", suspend);
    return () => {
      clearInterval(id);
      clearInterval(checkpoint);
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("push-background", suspend);
      window.removeEventListener("pagehide", suspend);
    };
  }, []);
  const running = Boolean(
    s && s.phase === "set" && !s.paused && s.mode === "sensor" && s.plan.training === "pushups",
  );
  const { start: startSensor, pause: pauseSensor } = sensor;
  useEffect(() => {
    if (running) startSensor();
    else pauseSensor();
  }, [running, startSensor, pauseSensor]);
  useEffect(() => {
    const delta = sensor.reps - seen.current;
    seen.current = sensor.reps;
    const saved = current.current;
    if (delta > 0 && saved && running) {
      saveActive({ ...saved, reps: Math.min(999, saved.reps + delta) });
      navigator.vibrate?.(20);
    }
  }, [sensor.reps, running]);
  useEffect(() => {
    if (sensor.error) {
      const saved = current.current;
      if (saved && !saved.paused) saveActive(pauseSession(saved));
    }
  }, [sensor.error]);
  const keepAwake = Boolean(s && !s.paused && s.phase !== "review");
  useEffect(() => {
    void setKeepAwake(keepAwake);
    return () => {
      void setKeepAwake(false);
    };
  }, [keepAwake]);
  useEffect(() => {
    const saved = current.current;
    if (saved && !saved.paused && saved.deadline !== null && now >= saved.deadline) {
      saveActive(nextPhase(saved));
      navigator.vibrate?.([60, 50, 60]);
    }
  }, [now]);
  if (!s) {
    const day = todayPlan(app);
    return (
      <main className="page flex flex-col justify-center gap-6">
        <p className="eyebrow text-accent">Gotowy na swój trening?</p>
        <h1 className="text-4xl font-bold">
          {day.training === "dumbbells" ? "Hantle: barki i ramiona." : "15 minut dla siebie."}
        </h1>
        <p className="text-muted-foreground">
          Połóż telefon stabilnie. Zacznij od 2 minut spokojnej rozgrzewki: nadgarstki, barki i
          łatwe ruchy. W razie bólu przerwij ćwiczenie.
        </p>
        {day.sets.length ? (
          <button className="primary-button" onClick={() => saveActive(newSession(day))}>
            Rozpocznij rozgrzewkę
          </button>
        ) : (
          <p>
            Dzisiaj masz zaplanowany odpoczynek. Zmień termin na ekranie Dziś, jeśli chcesz
            przesunąć trening.
          </p>
        )}
        <Link className="secondary-button" to="/">
          Wróć
        </Link>
      </main>
    );
  }
  if (s.phase === "review")
    return (
      <main className="page space-y-7">
        <p className="eyebrow text-accent">Trening zapisany roboczo</p>
        <h1 className="text-4xl font-bold">Dobra robota.</h1>
        <p className="text-6xl font-bold">
          {s.sets.reduce((a, b) => a + b.reps, 0)}{" "}
          <span className="text-lg text-muted-foreground">
            {s.plan.training === "dumbbells" ? "powtórzeń" : "pompek"}
          </span>
        </p>
        <div className="panel space-y-3">
          {s.sets.map((entry, i) => (
            <p key={i} className="flex justify-between">
              <span>
                Seria {i + 1} · {EXERCISES[entry.exercise].name}
                {entry.weight !== null ? ` · ${entry.weight} kg` : ""}
              </span>
              <strong>
                {entry.reps} / {entry.target}
              </strong>
            </p>
          ))}
          {!s.sets.length && (
            <p className="text-muted-foreground">Sesja zakończona bez wykonanej serii.</p>
          )}
        </div>
        <h2 className="font-semibold">Jak było?</h2>
        <div className="grid grid-cols-3 gap-2">
          {(["easy", "right", "hard"] as const).map((d) => (
            <button
              key={d}
              aria-pressed={difficulty === d}
              className={`secondary-button ${difficulty === d ? "selected" : ""}`}
              onClick={() => setDifficulty(d)}
            >
              {d === "easy" ? "Łatwo" : d === "hard" ? "Trudno" : "W sam raz"}
            </button>
          ))}
        </div>
        <button
          className="primary-button"
          disabled={!difficulty}
          onClick={() => {
            pushSession(resultFor(s, difficulty));
            void navigate({ to: "/insights" });
          }}
        >
          Zapisz i zakończ
        </button>
        <p className="text-xs text-muted-foreground">
          Czas sesji obejmuje ćwiczenia i przerwy. Pauzy i czas z zamkniętą aplikacją są pomijane.
        </p>
      </main>
    );
  const dumbbells = s.plan.training === "dumbbells";
  const timed = s.phase !== "set",
    left = remainingSeconds(s, now),
    target = s.plan.sets[s.index] ?? 0;
  return (
    <main className="page session-page space-y-6">
      <header className="flex justify-between items-center">
        <p className="eyebrow text-accent">
          {s.phase === "warmup"
            ? "Przygotowanie"
            : s.phase === "rest"
              ? "Złap oddech"
              : s.phase === "cooldown"
                ? "Wyciszenie"
                : `Seria ${s.index + 1} / ${s.plan.sets.length}`}
        </p>
        <button
          className="icon-button"
          aria-label={s.paused ? "Wznów" : "Pauza"}
          onClick={() => saveActive(s.paused ? resumeSession(s) : pauseSession(s))}
        >
          {s.paused ? <Play size={20} /> : <Pause size={20} />}
        </button>
      </header>
      {!timed && <ExerciseGuide exercise={exerciseFor(s.plan, s.index)} reps={target} compact />}
      <div className="flex-1 flex flex-col justify-center items-center gap-5 text-center">
        <h1 className="session-number">
          {timed ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}` : s.reps}
        </h1>
        <p className="text-lg text-muted-foreground">
          {s.paused
            ? "Pauza · postęp jest zapisany"
            : s.phase === "warmup"
              ? "Rozgrzej nadgarstki i barki"
              : s.phase === "rest"
                ? `Dalej: ${EXERCISES[exerciseFor(s.plan, s.index + 1)].name} · ${s.plan.sets[s.index + 1]} powt.`
                : s.phase === "cooldown"
                  ? "Spokojny oddech i rozluźnienie"
                  : `Cel: ${target} powtórzeń`}
        </p>
        {!timed && (
          <div className="w-full h-1 rounded-full bg-white/10">
            <div
              className="h-full bg-accent rounded-full transition-all"
              style={{ width: `${Math.min(100, (s.reps / Math.max(1, target)) * 100)}%` }}
            />
          </div>
        )}
      </div>
      {!timed && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <button
              className={`secondary-button ${s.mode === "manual" ? "selected" : ""}`}
              onClick={() => saveActive({ ...pauseSession(s), mode: "manual" })}
            >
              Ręcznie
            </button>
            <button
              className={`secondary-button ${s.mode === "sensor" && s.plan.training === "pushups" ? "selected" : ""}`}
              disabled={!source || dumbbells}
              onClick={() => saveActive({ ...pauseSession(s), mode: "sensor" })}
            >
              Czujnik
            </button>
          </div>
          {dumbbells && (
            <label className="flex items-center justify-between text-sm">
              Ciężar jednego hantla (kg)
              <input
                className="number-input w-24"
                type="number"
                min="0"
                max="100"
                step="0.5"
                placeholder="kg"
                value={s.weight ?? ""}
                onChange={(e) => {
                  const weight = e.target.value === "" ? null : Number(e.target.value);
                  if (weight === null || (Number.isFinite(weight) && weight >= 0 && weight <= 100))
                    saveActive({ ...s, weight });
                }}
              />
            </label>
          )}
          {!source && (
            <p className="text-xs text-muted-foreground">
              W przeglądarce działa tryb ręczny. Nie symulujemy wykonanych pompek.
            </p>
          )}
          {sensor.error && (
            <p role="alert" className="notice">
              {sensor.error}
            </p>
          )}
          <div className="flex items-center justify-center gap-4">
            <button
              className="icon-button"
              aria-label="Odejmij powtórzenie"
              onClick={() => saveActive({ ...s, reps: Math.max(0, s.reps - 1) })}
            >
              <Minus />
            </button>
            <label className="sr-only" htmlFor="reps">
              Wykonane powtórzenia
            </label>
            <input
              id="reps"
              className="number-input w-24 text-center"
              type="number"
              min="0"
              max="999"
              value={s.reps}
              onChange={(e) => {
                const reps = Number(e.target.value);
                if (Number.isInteger(reps) && reps >= 0 && reps <= 999) saveActive({ ...s, reps });
              }}
            />
            <button
              className="icon-button"
              aria-label="Dodaj powtórzenie"
              onClick={() => saveActive({ ...s, reps: Math.min(999, s.reps + 1) })}
            >
              <Plus />
            </button>
          </div>
        </>
      )}
      {s.paused ? (
        <button className="primary-button" onClick={() => saveActive(resumeSession(s))}>
          Wznów trening
        </button>
      ) : (
        <button className="primary-button" onClick={() => saveActive(nextPhase(s))}>
          {s.phase === "set"
            ? "Zatwierdź serię"
            : s.phase === "rest"
              ? "Zakończ przerwę"
              : s.phase === "warmup"
                ? "Rozgrzewka gotowa"
                : "Przejdź do podsumowania"}
        </button>
      )}
      <button
        className="text-sm text-muted-foreground py-3"
        onClick={() => saveActive(reviewSession(s))}
      >
        Zakończ wcześniej i zachowaj wynik
      </button>
    </main>
  );
}
