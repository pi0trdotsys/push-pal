import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Settings2, ArrowUpRight, Check, Play, RotateCcw } from "lucide-react";
import { WeekendCard } from "@/components/weekend-card";
import { MiniStreak } from "@/components/mini-streak";
import { dayVolume, estimateSeconds, isRestDay, weekdayLabel } from "@/lib/plan-30";
import {
  completeOnboarding,
  moveTrainingToToday,
  todayPlan,
  useAppState,
} from "@/lib/session-store";
export const Route = createFileRoute("/")({ component: TodayPage });
function TodayPage() {
  const app = useAppState(),
    day = todayPlan(app),
    rest = isRestDay(day),
    total = dayVolume(day),
    dumbbells = day.training === "dumbbells",
    done = app.history.some(
      (h) => h.date === app.today && h.training === day.training && h.completed,
    );
  const [capacity, setCapacity] = useState(10);
  if (!app.onboarded)
    return (
      <main className="page flex flex-col justify-center gap-8">
        <p className="eyebrow text-accent">PUSH / Twój rytm</p>
        <h1 className="text-5xl font-extrabold leading-tight">
          Mały trening.
          <br />
          Duża zmiana.
        </h1>
        <p className="text-muted-foreground">
          Pompki co drugi dzień, pomiędzy nimi hantle na barki i ramiona. Około 15 minut. Bez konta,
          z historią na telefonie.
        </p>
        <section className="panel space-y-5">
          <label className="block" htmlFor="capacity">
            Ile poprawnych pompek wykonujesz w jednej serii?
          </label>
          <input
            id="capacity"
            className="number-input"
            type="number"
            min="1"
            max="50"
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
          />
          <p className="text-sm text-muted-foreground">
            Zacznij spokojnie. Możesz ćwiczyć przy podwyższeniu lub na kolanach i utrzymywać ten sam
            wariant w kolejnych treningach.
          </p>
        </section>
        <button
          className="primary-button"
          disabled={!Number.isInteger(capacity) || capacity < 1 || capacity > 50}
          onClick={() =>
            completeOnboarding(Math.max(5, Math.min(120, Math.round(capacity * 0.6) * 5)))
          }
        >
          Ułóż mój plan <ArrowUpRight size={20} />
        </button>
      </main>
    );
  return (
    <main className="page space-y-7">
      <header className="flex justify-between items-center">
        <div>
          <p className="eyebrow text-accent">PUSH / Dziś</p>
          <p className="text-sm text-muted-foreground mt-2">
            {weekdayLabel(app.today)} · {app.today}
          </p>
        </div>
        <Link to="/plan" aria-label="Plan i ustawienia" className="icon-button">
          <Settings2 size={20} />
        </Link>
      </header>
      <section className="hero-card">
        <p className="eyebrow">
          {done
            ? "Dobra robota"
            : rest
              ? "Czas na regenerację"
              : dumbbells
                ? "Barki · biceps · triceps"
                : "Twój moment"}
        </p>
        <h1 className="hero-number">
          {done ? <Check size={100} /> : rest ? "OFF" : dumbbells ? "6" : total}
        </h1>
        <p className="text-xl font-semibold">
          {done
            ? "Trening ukończony"
            : rest
              ? "Dzisiaj odpoczywasz"
              : dumbbells
                ? "serii z hantlami"
                : "pompek w Twoim tempie"}
        </p>
        <p className="text-sm text-muted-foreground mt-3">
          {rest
            ? "Kolejny trening: " +
              (app.plan.find((d) => d.date > app.today && d.sets.length)?.date ?? "za dwa dni")
            : `${day.sets.length} serii · około ${Math.round(estimateSeconds(day) / 60)} min`}
        </p>
        {!rest && (
          <div className="flex justify-center gap-2 mt-7 flex-wrap">
            {day.sets.map((n, i) => (
              <span className="set-pill" key={i}>
                {n}
              </span>
            ))}
          </div>
        )}
      </section>
      {app.active ? (
        <Link className="primary-button" to="/session">
          <RotateCcw size={20} /> Wznów zapisany trening
        </Link>
      ) : !rest && !done ? (
        <Link className="primary-button" to="/session">
          <Play size={20} /> Zaczynam trening
        </Link>
      ) : null}
      <WeekendCard />
      <section className="panel space-y-4">
        <div className="flex justify-between">
          <p className="eyebrow">Twój rytm</p>
          <span className="text-xs text-muted-foreground">Pompki / hantle</span>
        </div>
        <MiniStreak plan={app.plan} today={app.today} history={app.history} />
        <p className="text-sm text-muted-foreground">
          Pompki i hantle naprzemiennie. Możesz ustawić dzień wolny w Planie.
        </p>
      </section>
      {!app.active && (
        <details className="text-sm text-muted-foreground">
          <summary className="cursor-pointer">Zmień termin treningu</summary>
          <p className="my-3">
            Ustaw pompki na dziś, a hantle na jutro. Kolejne dni będą naprzemienne. Bez nadrabiania
            zaległości. Ręczne zmiany przyszłego planu zostaną zastąpione.
          </p>
          <button className="secondary-button" onClick={moveTrainingToToday}>
            Zacznij nowy rytm od pompek
          </button>
        </details>
      )}
    </main>
  );
}
