import { useEffect, useId, useState } from "react";
import { EXERCISES } from "@/lib/exercises";
import type { ExerciseId } from "@/lib/plan-30";
/** Original vector diagrams: all movement and instructions stay available offline. */
export function ExerciseGuide({
  exercise,
  reps,
  sets = 1,
  compact = false,
}: {
  exercise: ExerciseId;
  reps: number;
  sets?: number;
  compact?: boolean;
}) {
  const e = EXERCISES[exercise],
    id = useId(),
    [playing, setPlaying] = useState(false),
    [position, setPosition] = useState(0);
  useEffect(() => {
    setPlaying(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setPosition(0);
  }, [exercise]);
  useEffect(() => {
    if (!playing) return;
    const origin = performance.now();
    let frame = 0;
    const tick = (time: number) => {
      setPosition((1 - Math.cos((((time - origin) % 4000) / 4000) * Math.PI * 2)) / 2);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);
  const t = position;
  const dumbbell = (x: number, y: number, key: string) => (
    <g key={key} transform={`translate(${x} ${y})`} stroke="#70e9a0" strokeWidth="4">
      <path d="M-9 0 H9" />
      <path d="M-10 -6 V6 M10 -6 V6" strokeWidth="6" />
    </g>
  );
  const arm = (
    shoulder: [number, number],
    elbow: [number, number],
    hand: [number, number],
    key: string,
  ) => (
    <g key={key}>
      <path
        d={`M${shoulder} L${elbow} L${hand}`}
        stroke="#70e9a0"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx={elbow[0]} cy={elbow[1]} r="4" fill="#d6ffe5" />
      {dumbbell(hand[0], hand[1], key + "weight")}
    </g>
  );
  let arms;
  if (exercise === "lateral-raise") {
    const a = (t * Math.PI) / 2;
    arms = [-1, 1].map((sign) =>
      arm(
        [150 + sign * 20, 92],
        [150 + sign * (20 + 34 * Math.sin(a)), 92 + 34 * Math.cos(a)],
        [150 + sign * (20 + 65 * Math.sin(a)), 92 + 65 * Math.cos(a)],
        String(sign),
      ),
    );
  } else if (exercise === "hammer-curl") {
    const a = t * Math.PI * 0.8;
    arms = arm(
      [150, 92],
      [150, 125],
      [150 + 32 * Math.sin(a), 125 + 32 * Math.cos(a)],
      "curl-side",
    );
  } else if (exercise === "triceps-extension") {
    const a = ((1 - t) * Math.PI) / 2;
    arms = <>{arm([150, 92], [155, 53], [155 + 36 * Math.sin(a), 53 - 36 * Math.cos(a)], "one")}</>;
  }
  return (
    <section className={`panel space-y-4 exercise-guide ${compact ? "exercise-compact" : ""}`}>
      <div>
        <p className="eyebrow text-accent">{e.muscles}</p>
        <h2 className="text-xl font-bold mt-2">{e.name}</h2>
        <p className="text-sm text-muted-foreground mt-2">
          {sets} {sets === 1 ? "seria" : "serie"} × {reps} powtórzeń
          {!compact && ` · ${e.equipment}`}
        </p>
      </div>
      <div className="exercise-stage">
        <svg viewBox="0 0 300 240" role="img" aria-labelledby={id}>
          <title id={id}>{e.name}: schemat pozycji początkowej i końcowej</title>
          <path d="M30 221 H270" stroke="#35483c" strokeWidth="1" />
          {exercise === "pushup" ? (
            <g
              transform={`translate(0 ${t * 23})`}
              stroke="#dce8e0"
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
            >
              <circle cx="92" cy="108" r="13" />
              <path d="M109 119 L208 167 L242 183" />
              <path d={`M120 126 L${115 + t * 16} ${160 + t * 10} L98 ${196 - t * 23}`} />
              <path d={`M215 171 L243 ${196 - t * 23}`} />
            </g>
          ) : (
            <>
              <g stroke="#dce8e0" strokeWidth="9" strokeLinecap="round" fill="none">
                <circle cx="150" cy="65" r="15" />
                <path d="M150 87 V155 M130 92 H170 M150 155 L128 215 M150 155 L172 215" />
              </g>
              {arms}
            </>
          )}
          <text x="150" y="237" fill="#9cad9f" fontSize="9" textAnchor="middle">
            {exercise === "triceps-extension"
              ? "Widok z boku · ramiona nieruchome"
              : exercise === "hammer-curl"
                ? "Widok z boku · obie ręce pracują równocześnie"
                : exercise === "pushup"
                  ? "Widok z boku · tułów w jednej linii"
                  : "Widok z przodu · spokojny ruch"}
          </text>
        </svg>
        <div className="flex flex-wrap gap-2 mt-3">
          <button
            type="button"
            className="secondary-button flex-1"
            aria-pressed={playing}
            onClick={() => setPlaying((p) => !p)}
          >
            {playing ? "Zatrzymaj" : "Odtwórz"} animację
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setPlaying(false);
              setPosition(0);
            }}
          >
            Start
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setPlaying(false);
              setPosition(1);
            }}
          >
            Koniec
          </button>
        </div>
      </div>
      <details open={!compact} className="space-y-4">
        <summary className="text-sm text-accent cursor-pointer">Technika krok po kroku</summary>
        <ol className="space-y-3 text-sm list-decimal pl-5">
          {e.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
        <p className="text-sm text-muted-foreground">{e.avoid}</p>
        <p className="text-xs text-muted-foreground">
          Schemat ruchu · unieś około 1 s, opuść około 2 s. Dobierz ciężar pozwalający zachować
          technikę. Jeśli czujesz ból, przerwij.
        </p>
        <a
          className="text-xs text-accent underline"
          href={e.source}
          target="_blank"
          rel="noreferrer"
        >
          Pełna demonstracja: {e.sourceName}
        </a>
      </details>
    </section>
  );
}
