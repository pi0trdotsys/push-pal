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
      className={`w-full text-left rounded-2xl px-5 py-5 transition-colors ${
        selected ? "bg-accent/10" : "bg-surface"
      }`}
    >
      <div className="flex items-baseline justify-between">
        <span className="text-xl font-bold">{plan.name}</span>
        <span className="text-lg text-muted-foreground tabular-nums">
          {plan.totalReps} pompek
        </span>
      </div>
      <p className="mt-2 text-base text-muted-foreground">{plan.focus}</p>
      <p className="mt-3 text-base text-muted-foreground tabular-nums">
        {plan.series.map((s) => s.reps).join(" · ")}
      </p>
    </button>
  );
}
