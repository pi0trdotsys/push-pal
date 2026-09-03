import { useState } from "react";
import { dayVolume, isRestDay, weekdayLabel, type DayPlan } from "@/lib/plan-30";
import { releaseDay, updateDay } from "@/lib/session-store";

/** Wiersz planu z rozwijanym edytorem serii. */
export function DayRow({
  plan,
  isToday,
  open,
  onToggle,
}: {
  plan: DayPlan;
  isToday: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const [draft, setDraft] = useState<number[]>(plan.sets);
  const rest = isRestDay(plan);

  const commit = (sets: number[]) => {
    setDraft(sets);
    updateDay(plan.day, sets);
  };

  return (
    <li className="border-b border-border">
      <button
        onClick={onToggle}
        className="w-full flex items-baseline gap-4 py-3.5 text-left"
      >
        <span className="font-mono text-[11px] text-muted-foreground w-8">
          D{String(plan.day).padStart(2, "0")}
        </span>
        <span className="text-[11px] tracking-widest uppercase text-muted-foreground w-10">
          {weekdayLabel(plan.date)}
        </span>
        <span
          className={`flex-1 text-right tabular-nums ${
            rest ? "text-muted-foreground text-sm" : "text-lg font-bold"
          } ${isToday ? "text-accent" : ""}`}
        >
          {rest ? "wolne" : dayVolume(plan)}
        </span>
        {plan.manual && (
          <span className="text-[9px] tracking-widest uppercase text-muted-foreground">
            ręczne
          </span>
        )}
      </button>

      {open && (
        <div className="pb-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {draft.map((reps, i) => (
              <div key={i} className="flex items-center border border-border">
                <button
                  onClick={() =>
                    commit(draft.map((r, j) => (j === i ? Math.max(1, r - 1) : r)))
                  }
                  className="px-3 py-2 text-muted-foreground"
                  aria-label={`Mniej w serii ${i + 1}`}
                >
                  –
                </button>
                <span className="w-8 text-center tabular-nums text-sm">{reps}</span>
                <button
                  onClick={() => commit(draft.map((r, j) => (j === i ? r + 1 : r)))}
                  className="px-3 py-2 text-muted-foreground"
                  aria-label={`Więcej w serii ${i + 1}`}
                >
                  +
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 text-[11px] tracking-widest uppercase">
            <button
              onClick={() => commit([...draft, draft.at(-1) ?? 10])}
              className="text-muted-foreground hover:text-foreground"
            >
              + seria
            </button>
            {draft.length > 0 && (
              <button
                onClick={() => commit(draft.slice(0, -1))}
                className="text-muted-foreground hover:text-foreground"
              >
                – seria
              </button>
            )}
            <button
              onClick={() => commit([])}
              className="text-muted-foreground hover:text-foreground"
            >
              dzień wolny
            </button>
            {plan.manual && (
              <button
                onClick={() => {
                  releaseDay(plan.day);
                  onToggle();
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                przywróć generator
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
