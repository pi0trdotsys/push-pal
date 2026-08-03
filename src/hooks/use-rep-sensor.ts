import { useCallback, useEffect, useRef, useState } from "react";

export type SensorKind = "proximity" | "hall";
export type SensorStatus = "idle" | "running" | "paused";

export type SensorSample = {
  /** distance in millimetres */
  distance: number;
  /** true on the falling edge that counts as a rep */
  rep: boolean;
};

/**
 * Wpięcie prawdziwego czujnika: implementacja tego interfejsu może opakować
 * przeglądarkowe ProximitySensor / Generic Sensor API zamiast mocka poniżej.
 */
export type RepSensorSource = {
  kind: SensorKind;
  subscribe: (onSample: (sample: SensorSample) => void) => () => void;
};

type Options = {
  kind?: SensorKind;
  /** próg detekcji w mm — przecięcie w dół liczy powtórzenie */
  threshold?: number;
  /** docelowe tempo jednego powtórzenia w ms */
  cycleMs?: number;
};

const TICK = 60;

export function useRepSensor({
  kind = "proximity",
  threshold = 8,
  cycleMs = 1200,
}: Options = {}) {
  const [status, setStatus] = useState<SensorStatus>("idle");
  const [distance, setDistance] = useState(20);
  const [reps, setReps] = useState(0);
  const [pulse, setPulse] = useState(0);
  const [tempo, setTempo] = useState(cycleMs / 1000);
  const [stability, setStability] = useState(98);

  const phase = useRef(0);
  const below = useRef(false);
  const lastRepAt = useRef<number | null>(null);

  useEffect(() => {
    if (status !== "running") return;
    const id = window.setInterval(() => {
      phase.current += (TICK / cycleMs) * Math.PI * 2;
      const jitter = (Math.random() - 0.5) * 1.2;
      // 2mm (dół pompki) .. 20mm (góra)
      const next = 11 + Math.cos(phase.current) * 9 + jitter;
      setDistance(Math.max(1, next));

      if (next < threshold && !below.current) {
        below.current = true;
        const now = performance.now();
        if (lastRepAt.current !== null) {
          const delta = (now - lastRepAt.current) / 1000;
          setTempo(Math.round(delta * 10) / 10);
          setStability(Math.max(80, Math.min(99, 100 - Math.abs(delta - cycleMs / 1000) * 30)));
        }
        lastRepAt.current = now;
        setReps((r) => r + 1);
        setPulse((p) => p + 1);
      } else if (next > threshold + 3) {
        below.current = false;
      }
    }, TICK);
    return () => window.clearInterval(id);
  }, [status, threshold, cycleMs]);

  const start = useCallback(() => setStatus("running"), []);
  const pause = useCallback(() => setStatus("paused"), []);
  const reset = useCallback(() => {
    setStatus("idle");
    setReps(0);
    setDistance(20);
    setTempo(cycleMs / 1000);
    phase.current = 0;
    below.current = false;
    lastRepAt.current = null;
  }, [cycleMs]);

  return {
    kind,
    status,
    distance,
    reps,
    pulse,
    tempo,
    stability: Math.round(stability),
    threshold,
    start,
    pause,
    reset,
  };
}
