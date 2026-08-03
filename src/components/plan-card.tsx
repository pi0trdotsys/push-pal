import type { TrainingPlan } from "@/lib/training-plans";

type Props = {
  plan: TrainingPlan;
  selected: boolean;
  onSelect: () => void;
};

export function PlanCard({ plan, selected, onSelect }: Props) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-5 border rounded-sm transition-colors ${
        selected
          ? "border-accent/40 bg-accent/[0.03]"
          : "border-border hover:border-foreground/20"
      }`}
    >
      <div className="flex justify-between font-mono text-[10px] mb-2">
        <span className={selected ? "text-accent font-bold" : "text-muted-foreground"}>
          {plan.code}
        </span>
        <span>{selected ? "ACTIVE" : "AVAILABLE"}</span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-xl font-extrabold tracking-tighter">{plan.name}</span>
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {plan.totalReps} REPS
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{plan.focus}</p>
      <div className="mt-4 flex gap-1">
        {plan.series.map((s) => (
          <span
            key={s.index}
            className={`flex-1 h-8 border rounded-sm flex items-center justify-center font-mono text-[10px] tabular-nums ${
              selected ? "border-accent/30 text-foreground" : "border-border text-muted-foreground"
            }`}
          >
            {s.reps}
          </span>
        ))}
      </div>
      <div className="mt-3 flex justify-between font-mono text-[9px] text-muted-foreground">
        {plan.progression.map((p) => (
          <span key={p}>{p}</span>
        ))}
      </div>
    </button>
  );
}
