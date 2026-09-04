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
        <p className="text-lg text-muted-foreground">
          Dzień {day.day} z 30 · {weekdayLabel(day.date)}
        </p>
      </header>

      <div className="flex flex-col items-center gap-5 text-center">
        {rest ? (
          <>
            <span className="text-6xl font-extrabold text-muted-foreground">Dzień wolny</span>
            <p className="text-lg text-muted-foreground">Dziś odpoczywasz</p>
          </>
        ) : (
          <>
            <span className="text-[30vw] leading-[0.85] font-extrabold tabular-nums">
              {total}
            </span>
            <p className="text-xl text-muted-foreground">pompek dziś</p>
            <p className="w-full text-base text-muted-foreground">
              {day.sets.length} serie po {day.sets.join(", ")} · około {estMinutes} min
            </p>
          </>
        )}
      </div>

      <div className="space-y-10">
        {!rest && (
          <Link
            to="/session"
            className="block w-full py-6 text-center rounded-2xl bg-foreground text-background text-xl font-bold active:scale-[0.99] transition-transform"
          >
            Zacznij
          </Link>
        )}

        <div className="flex justify-center">
          <MiniStreak plan={app.plan} today={app.today} history={app.history} />
        </div>
      </div>
    </main>
  );
}
