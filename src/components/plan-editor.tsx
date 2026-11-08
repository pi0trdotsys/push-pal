import { type PlanVariant } from "@/lib/plan-30";
export function PlanEditor({
  volume,
  onChange,
}: {
  variant: PlanVariant;
  volume: number;
  onChange: (variant: PlanVariant, volume: number) => void;
}) {
  return (
    <div className="panel space-y-5">
      <p className="eyebrow text-accent">Pompki ↔ hantle · około 15 min dziennie</p>
      <p className="text-sm text-muted-foreground">
        Pompki: pięć serii. Hantle: barki, biceps i triceps, po dwie serie po 10 powtórzeń. Każda
        sesja ma rozgrzewkę, przerwy i wyciszenie. Dni wolne możesz ustawić poniżej.
      </p>
      <label className="block">
        Cel treningu pompek <strong className="float-right">{volume} pompek</strong>
        <input
          className="w-full mt-5 accent-[var(--accent)]"
          type="range"
          min="5"
          max="120"
          step="1"
          value={volume}
          onChange={(e) => onChange("base", Number(e.target.value))}
        />
      </label>
    </div>
  );
}
