import { createFileRoute } from "@tanstack/react-router";
import { MONTH_TREND, SESSION_HISTORY } from "@/lib/training-plans";

export const Route = createFileRoute("/archive")({
  head: () => ({
    meta: [
      { title: "PUSH — historia treningów" },
      {
        name: "description",
        content:
          "Historia treningów pompek: liczba powtórzeń, czas trwania i tempo z ostatnich 30 dni.",
      },
      { property: "og:title", content: "PUSH — historia treningów" },
      {
        property: "og:description",
        content: "Powtórzenia, czas i tempo z ostatnich 30 dni treningu pompek.",
      },
    ],
  }),
  component: ArchivePage,
});

function ArchivePage() {
  const max = Math.max(...MONTH_TREND);
  const total = SESSION_HISTORY.reduce((a, s) => a + s.reps, 0);

  return (
    <main className="flex-1 px-8 py-12 space-y-12">
      <section className="space-y-5">
        <h2 className="text-3xl font-extrabold">Historia</h2>
        <p className="text-lg text-muted-foreground">
          {total} pompek w ostatnich 30 dniach
        </p>
        <div className="h-28 w-full flex items-end gap-[3px]">
          {MONTH_TREND.map((v, i) => (
            <div
              key={i}
              className={`flex-1 rounded-full ${v === max ? "bg-accent/80" : "bg-foreground/10"}`}
              style={{ height: `${v === 0 ? 2 : (v / max) * 100}%` }}
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        {SESSION_HISTORY.map((s) => (
          <div key={s.id} className="flex items-baseline justify-between py-3">
            <div className="flex flex-col">
              <span className="text-xl font-semibold">{s.date}</span>
              <span className="text-base text-muted-foreground">
                {s.duration} · {s.pace} na powtórzenie
              </span>
            </div>
            <span className="text-3xl font-extrabold tabular-nums">{s.reps}</span>
          </div>
        ))}
      </section>
    </main>
  );
}
