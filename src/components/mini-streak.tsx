import { dayVolume, isRestDay, type DayPlan } from "@/lib/plan-30";
import type { SessionResult } from "@/lib/session-store";

/** Rząd 7 kropek: ostatni tydzień planu (zrobione / pominięte / wolne). */
export function MiniStreak({
  plan,
  today,
  history,
}: {
  plan: DayPlan[];
  today: string;
  history: SessionResult[];
}) {
  const idx = Math.max(0, plan.findIndex((d) => d.date === today));
  const start = Math.max(0, idx - 6);
  const week = plan.slice(start, start + 7);
  const doneDates = new Set(history.map((h) => h.date));

  return (
    <div className="flex items-center gap-3">
      {week.map((d) => {
        const done = doneDates.has(d.date);
        const rest = isRestDay(d);
        const future = d.date > today;
        return (
          <span
            key={d.day}
            title={`${d.date} · ${rest ? "wolne" : `${dayVolume(d)} powt.`}`}
            className={`size-1.5 rounded-full ${
              done
                ? "bg-accent"
                : rest
                  ? "bg-foreground/15"
                  : future
                    ? "bg-foreground/25"
                    : "bg-foreground/10"
            }`}
          />
        );
      })}
    </div>
  );
}
