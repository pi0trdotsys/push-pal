import { PLAN_VARIANTS, type PlanVariant } from "@/lib/plan-30";

/** Generator planu: wariant + startowy dzienny wolumen. */
export function PlanEditor({
  variant,
  volume,
  onChange,
}: {
  variant: PlanVariant;
  volume: number;
  onChange: (variant: PlanVariant, volume: number) => void;
}) {
  const meta = PLAN_VARIANTS.find((v) => v.id === variant)!;

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {PLAN_VARIANTS.map((v) => (
          <button
            key={v.id}
            onClick={() => onChange(v.id, volume)}
            className={`flex-1 py-2.5 text-[11px] tracking-widest uppercase border ${
              v.id === variant
                ? "border-foreground text-foreground"
                : "border-border text-muted-foreground"
            }`}
          >
            {v.name}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">{meta.hint}</p>

      <div className="space-y-3">
        <div className="flex justify-between items-baseline">
          <span className="text-[11px] tracking-widest uppercase text-muted-foreground">
            Wolumen / dzień
          </span>
          <span className="tabular-nums text-lg font-bold">{volume}</span>
        </div>
        <input
          type="range"
          min={10}
          max={120}
          step={2}
          value={volume}
          onChange={(e) => onChange(variant, Number(e.target.value))}
          className="w-full accent-white"
          aria-label="Startowy dzienny wolumen"
        />
      </div>
    </div>
  );
}
