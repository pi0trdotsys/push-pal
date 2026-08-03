import { createFileRoute } from "@tanstack/react-router";
import { MONTH_TREND, SESSION_HISTORY } from "@/lib/training-plans";

export const Route = createFileRoute("/archive")({
  head: () => ({
    meta: [
      { title: "Archive — historia sesji PUSH" },
      {
        name: "description",
        content:
          "Historia treningów pompek: liczba powtórzeń, czas trwania, średnie tempo i rekordy z ostatnich 30 dni.",
      },
      { property: "og:title", content: "Archive — historia sesji PUSH" },
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

  return (
    <main className="flex-1 px-6 py-8 space-y-12">
      <section className="animate-enter space-y-4">
        <div className="flex justify-between items-baseline">
          <h2 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Trend / 30_Days
          </h2>
          <span className="font-mono text-[11px] text-accent tabular-nums">
            {SESSION_HISTORY.reduce((a, s) => a + s.reps, 0)} REPS
          </span>
        </div>
        <div className="h-24 w-full flex items-end gap-[2px] border-b border-border pb-2">
          {MONTH_TREND.map((v, i) => (
            <div
              key={i}
              className={`flex-1 rounded-t-sm ${v === max ? "bg-accent/80" : "bg-foreground/5"}`}
              style={{ height: `${v === 0 ? 2 : (v / max) * 100}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between font-mono text-[9px] text-muted-foreground">
          <span>-30D</span>
          <span>-15D</span>
          <span>TODAY</span>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Session_Log
        </h2>
        {SESSION_HISTORY.map((s, i) => (
          <div
            key={s.id}
            className={`animate-enter p-4 border rounded-sm ${
              s.record ? "border-accent/40 bg-accent/[0.03]" : "border-border"
            }`}
            style={{ animationDelay: `${100 + i * 60}ms` }}
          >
            <div className="flex justify-between font-mono text-[10px] mb-2">
              <span className="text-muted-foreground">
                {s.date} / {s.plan}
              </span>
              <span className={s.record ? "text-accent" : ""}>
                {s.record ? "NEW RECORD" : "LOGGED"}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold tracking-tighter tabular-nums">
                {s.reps}
                <span className="text-xs font-normal text-muted-foreground ml-1">REPS</span>
              </span>
              <div className="flex gap-4 font-mono text-[10px] text-muted-foreground">
                <span>{s.duration}</span>
                <span>{s.pace}/REP</span>
              </div>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
