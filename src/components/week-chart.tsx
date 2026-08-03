import { WEEK_PROGRESS } from "@/lib/training-plans";

export function WeekChart({ highlight = 3 }: { highlight?: number }) {
  return (
    <section className="animate-enter space-y-4" style={{ animationDelay: "700ms" }}>
      <div className="flex justify-between">
        <h2 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Week Progress
        </h2>
        <span className="font-mono text-[11px]">+12% vs LW</span>
      </div>

      <div className="h-24 w-full flex items-end gap-1 px-1 border-b border-border pb-2">
        {WEEK_PROGRESS.map((d, i) => (
          <div
            key={d.day}
            className={`flex-1 rounded-t-sm transition-all ${
              i === highlight ? "bg-accent/80" : "bg-foreground/5 hover:bg-accent/40"
            }`}
            style={{ height: `${d.value}%` }}
          />
        ))}
      </div>

      <div className="flex justify-between font-mono text-[9px] text-muted-foreground px-1">
        {WEEK_PROGRESS.map((d) => (
          <span key={d.day}>{d.day}</span>
        ))}
      </div>
    </section>
  );
}
