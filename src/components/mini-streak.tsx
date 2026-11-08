import { dayVolume, isRestDay, weekdayLabel, type DayPlan } from "@/lib/plan-30";
import type { SessionResult } from "@/lib/session-store";
export function MiniStreak({
  plan,
  today,
  history,
}: {
  plan: DayPlan[];
  today: string;
  history: SessionResult[];
}) {
  const week = plan.filter((d) => d.date >= today).slice(0, 7);
  return (
    <div className="grid grid-cols-7 gap-2">
      {week.map((d) => {
        const done = history.some(
            (h) => h.date === d.date && h.training === d.training && h.completed,
          ),
          rest = isRestDay(d);
        return (
          <div className="text-center" key={d.date}>
            <span className="text-[10px] text-muted-foreground">{weekdayLabel(d.date)}</span>
            <div
              title={`${d.date} · ${rest ? "odpoczynek" : dayVolume(d) + (d.training === "dumbbells" ? " powt. z hantlami" : " pompek")}`}
              className={`rhythm-dot ${done ? "rhythm-done" : rest ? "rhythm-rest" : ""} ${d.date === today ? "rhythm-today" : ""}`}
            >
              {done ? "✓" : rest ? "—" : d.training === "dumbbells" ? "H" : "P"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
