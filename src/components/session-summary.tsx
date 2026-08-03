type Props = {
  totalReps: number;
  duration: string;
  tempo: number;
  onReset: () => void;
};

export function SessionSummary({ totalReps, duration, tempo, onReset }: Props) {
  return (
    <section className="animate-enter border border-accent/40 bg-accent/[0.03] p-6 rounded-sm space-y-6">
      <div className="flex justify-between items-baseline">
        <span className="font-mono text-[10px] tracking-widest text-accent uppercase">
          Session_Complete
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">SUMMARY</span>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-6xl font-extrabold tracking-tighter tabular-nums">
          {totalReps}
        </span>
        <span className="text-sm text-muted-foreground font-mono">REPS</span>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 font-mono text-[10px]">
        <div className="flex justify-between">
          <span className="text-muted-foreground">DURATION</span>
          <span>{duration}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">AVG TEMPO</span>
          <span className="tabular-nums">{tempo.toFixed(1)}s</span>
        </div>
      </div>

      <button
        onClick={onReset}
        className="w-full py-4 border border-foreground/20 font-mono text-[11px] tracking-widest uppercase rounded-sm active:scale-[0.98] transition-transform"
      >
        Reset Session
      </button>
    </section>
  );
}
