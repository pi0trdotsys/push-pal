type Props = {
  distance: number;
  tempo: number;
  stability: number;
  kind: "proximity" | "hall";
  active: boolean;
  pulse: number;
};

export function SensorDial({ distance, tempo, stability, kind, active, pulse }: Props) {
  return (
    <section
      className="animate-enter border border-border p-6 rounded-sm space-y-6"
      style={{ animationDelay: "600ms" }}
    >
      <div className="flex justify-between items-center">
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground">
          {kind === "hall" ? "HALL_EFFECT_SENSOR" : "PROXIMITY_SENSOR"}
        </span>
        <span className="px-2 py-0.5 rounded-full border border-accent/30 text-accent text-[9px] font-mono">
          {active ? "STREAMING" : "CALIBRATED"}
        </span>
      </div>

      <div className="flex items-center justify-center py-4">
        <div className="relative size-32">
          <div className="absolute inset-0 rounded-full border border-foreground/5" />
          <div className="absolute inset-4 rounded-full border border-foreground/10" />
          <div className="absolute inset-8 rounded-full border border-foreground/20" />
          <div
            className={`absolute top-1/2 left-0 w-full h-px bg-accent/30 ${
              active ? "animate-[spin_4s_linear_infinite]" : ""
            }`}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              key={pulse}
              className={`text-2xl font-mono font-bold tabular-nums ${
                active ? "animate-rep-flash" : ""
              }`}
            >
              {distance.toFixed(0).padStart(2, "0")}
            </span>
            <span className="text-[9px] font-mono text-muted-foreground">MM_DIST</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 font-mono text-[10px]">
        <div className="flex justify-between">
          <span className="text-muted-foreground">TEMPO</span>
          <span className="tabular-nums">{tempo.toFixed(1)}s/REP</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">STABILITY</span>
          <span className="tabular-nums">{stability}%</span>
        </div>
      </div>
    </section>
  );
}
