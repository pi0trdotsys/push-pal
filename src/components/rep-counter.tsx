/** Duży licznik — jedyny element ekranu w trybie ćwiczenia. */
export function RepCounter({
  value,
  caption,
  progress,
  dim = false,
}: {
  /** Wyświetlana liczba (powtórzenia lub sekundy przerwy). */
  value: number;
  /** Podpis pod licznikiem, np. `Seria 2 z 4`. */
  caption: string;
  /** Postęp 0..1 — cienka linia pod cyfrą. */
  progress: number;
  /** Przygaszenie cyfry (tryb przerwy). */
  dim?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-10 select-none">
      <span
        className={`text-[42vw] leading-[0.85] font-extrabold tabular-nums ${
          dim ? "text-muted-foreground" : "text-foreground"
        }`}
      >
        {value}
      </span>

      <div className="w-48 h-1 rounded-full bg-foreground/15 overflow-hidden">
        <div
          className="h-full rounded-full bg-foreground transition-[width] duration-300"
          style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
        />
      </div>

      <span className="w-full text-lg text-muted-foreground">{caption}</span>
    </div>
  );
}
