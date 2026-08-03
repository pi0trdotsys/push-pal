import type { SeriesTarget } from "@/lib/training-plans";

export type SeriesState = "done" | "current" | "pending" | "rest";

type Props = {
  series: SeriesTarget[];
  currentIndex: number;
  currentReps: number;
  state: SeriesState;
  restLeft: number;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function SeriesTimeline({
  series,
  currentIndex,
  currentReps,
  state,
  restLeft,
}: Props) {
  return (
    <div className="relative space-y-4">
      <div className="absolute left-[15px] top-4 bottom-4 w-px bg-border" />

      {series.map((s, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        const delay = `${100 + i * 100}ms`;

        if (isCurrent) {
          const pct = Math.min(100, (currentReps / s.reps) * 100);
          return (
            <div
              key={s.index}
              className="animate-enter relative flex gap-6 items-start"
              style={{ animationDelay: delay }}
            >
              <div className="z-10 size-8 rounded-full bg-background border-2 border-accent flex items-center justify-center shadow-[0_0_15px_var(--ring)]">
                <div className="size-3 bg-accent rounded-full animate-pulse" />
              </div>
              <div className="flex-1 p-5 border border-accent/40 rounded-sm bg-accent/[0.03]">
                <div className="flex justify-between font-mono text-[10px] mb-2">
                  <span className="text-accent font-bold">
                    SERIES_{pad(s.index)} (CURRENT)
                  </span>
                  <span className="text-foreground">
                    {state === "rest"
                      ? `REST ${pad(restLeft)}s`
                      : state === "current"
                        ? "IN_PROGRESS"
                        : "READY"}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold tracking-tighter tabular-nums">
                    {pad(currentReps)}
                  </span>
                  <span className="text-muted-foreground text-sm">/ {s.reps}</span>
                </div>
                <div className="mt-4 h-1 w-full bg-foreground/5 overflow-hidden">
                  <div
                    className="h-full bg-accent transition-[width] duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        }

        return (
          <div
            key={s.index}
            className={`animate-enter relative flex gap-6 items-start ${
              isDone ? "opacity-50" : "opacity-40"
            }`}
            style={{ animationDelay: delay }}
          >
            <div
              className={`z-10 size-8 rounded-full bg-background flex items-center justify-center border ${
                isDone ? "border-accent" : "border-border"
              }`}
            >
              <div
                className={`size-2 rounded-full ${
                  isDone ? "bg-accent" : "bg-foreground/20"
                }`}
              />
            </div>
            <div
              className={`flex-1 p-4 border border-border rounded-sm ${
                isDone ? "bg-foreground/[0.02]" : ""
              }`}
            >
              <div className="flex justify-between font-mono text-[10px] mb-1">
                <span className="text-muted-foreground">SERIES_{pad(s.index)}</span>
                <span className={isDone ? "text-accent" : ""}>
                  {isDone ? "DONE" : "PENDING"}
                </span>
              </div>
              <div
                className={`text-xl font-extrabold ${isDone ? "" : "text-muted-foreground"}`}
              >
                {s.reps}{" "}
                <span className="text-xs font-normal text-muted-foreground">REPS</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
