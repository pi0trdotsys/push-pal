/** Gigantyczny licznik — jedyny element ekranu w trybie ćwiczenia. */
export function RepCounter({
  value,
  caption,
  progress,
  dim = false,
}: {
  /** Wyświetlana liczba (powtórzenia lub sekundy przerwy). */
  value: number;
  /** Mikro-podpis pod licznikiem, np. `SERIA 2/4`. */
  caption: string;
  /** Postęp 0..1 — cienka linia pod cyfrą. */
  progress: number;
  /** Przygaszenie cyfry (tryb przerwy). */
  dim?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-8 select-none">
      <span
        className={`text-[40vw] leading-[0.8] font-extrabold tabular-nums tracking-tighter ${
          dim ? "text-muted-foreground" : "text-foreground"
        }`}
      >
        {value}
      </span>

      <div className="w-40 h-px bg-foreground/15 overflow-hidden">
        <div
          className="h-full bg-foreground transition-[width] duration-300"
          style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
        />
      </div>

      <span className="text-[11px] tracking-[0.35em] uppercase text-muted-foreground">
        {caption}
      </span>
    </div>
  );
}
