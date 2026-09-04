import { createFileRoute, Link } from "@tanstack/react-router";
import { MiniStreak } from "@/components/mini-streak";
import { dayVolume, isRestDay, weekdayLabel } from "@/lib/plan-30";
import { todayPlan, useAppState } from "@/lib/session-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PUSH — dziś" },
      {
        name: "description",
        content:
          "Minimalistyczny trening pompek: cel na dziś, jeden przycisk startu i licznik napędzany czujnikiem zbliżeniowym.",
      },
      { property: "og:title", content: "PUSH — dziś" },
      {
        property: "og:description",
        content: "Cel na dziś i jeden przycisk. Reszta znika, gdy ćwiczysz.",
      },
    ],
  }),
  component: TodayPage,
});

function TodayPage() {
  const app = useAppState();
  const day = todayPlan(app);
  const rest = isRestDay(day);
  const total = dayVolume(day);
  /** Szacunek: ~3 s na powtórzenie + 60 s przerwy między seriami. */
  const estSeconds = total * 3 + Math.max(0, day.sets.length - 1) * 60;
  const estMinutes = Math.max(1, Math.round(estSeconds / 60));

  return (
    <main className="flex-1 flex flex-col justify-between px-8 py-14">
      <header className="space-y-1">
        <p className="text-[11px] tracking-[0.35em] uppercase text-muted-foreground">
          Dzień {String(day.day).padStart(2, "0")} / 30 · {weekdayLabel(day.date)}
        </p>
      </header>

      <div className="flex flex-col items-center gap-4">
        {rest ? (
          <>
            <span className="text-5xl font-extrabold tracking-tighter text-muted-foreground">
              wolne
            </span>
            <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground">
              Regeneracja
            </p>
          </>
        ) : (
          <>
            <span className="text-[26vw] leading-[0.8] font-extrabold tabular-nums tracking-tighter">
              {total}
            </span>
            <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground">
              {day.sets.length} serie · {day.sets.join(" / ")} · ~{estMinutes} min
            </p>
          </>
        )}
      </div>

      <div className="space-y-10">
        {!rest && (
          <Link
            to="/session"
            className="block w-full py-5 text-center bg-foreground text-background text-[12px] font-bold tracking-[0.4em] uppercase active:scale-[0.99] transition-transform"
          >
            Start
          </Link>
        )}

        <div className="flex justify-center">
          <MiniStreak plan={app.plan} today={app.today} history={app.history} />
        </div>
      </div>
    </main>
  );
}
