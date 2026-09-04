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
 * Wpięcie prawdziwego czujnika: implementacja tego interfejsu opakowuje
 * natywny czujnik Halla (Android `TYPE_MAGNETIC_FIELD`) lub zbliżeniowy
 * (`TYPE_PROXIMITY`) przez wtyczkę Capacitor `RepSensor` — patrz
 * `src/lib/native-sensor.ts`. Na webie/w podglądzie nikt tego interfejsu
 * nie implementuje i hook spada na symulację poniżej.
 */
export type RepSensorSource = {
  kind: SensorKind;
  /** `onSample` dostaje surowy sygnał odległości/pola w tej samej skali co symulacja (mm-podobna, 0..~20). */
  subscribe: (onSample: (sample: { distance: number }) => void) => () => void;
};

type Options = {
  kind?: SensorKind;
  /** próg detekcji w mm — przecięcie w dół liczy powtórzenie */
  threshold?: number;
  /** docelowe tempo jednego powtórzenia w ms (tylko symulacja) */
  cycleMs?: number;
  /** realne źródło danych (natywny czujnik); brak = symulacja */
  source?: RepSensorSource | null;
};

const TICK = 60;

export function useRepSensor({
  kind = "proximity",
  threshold = 8,
  cycleMs = 1200,
  source = null,
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
  const thresholdRef = useRef(threshold);
  thresholdRef.current = threshold;

  /** Wspólna logika zliczania: jedno miejsce dla symulacji i realnego czujnika. */
  const ingest = useCallback((next: number) => {
    setDistance(Math.max(1, next));
    const t = thresholdRef.current;

    if (next < t && !below.current) {
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
    } else if (next > t + 3) {
      below.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycleMs]);

  // Realny czujnik: subskrybuj natywne źródło, gdy dostępne.
  useEffect(() => {
    if (status !== "running" || !source) return;
    const unsubscribe = source.subscribe((sample) => ingest(sample.distance));
    return unsubscribe;
  }, [status, source, ingest]);

  // Symulacja: używana tylko, gdy nie podano realnego źródła (web / podgląd).
  useEffect(() => {
    if (status !== "running" || source) return;
    const id = window.setInterval(() => {
      phase.current += (TICK / cycleMs) * Math.PI * 2;
      const jitter = (Math.random() - 0.5) * 1.2;
      // 2mm (dół pompki) .. 20mm (góra)
      const next = 11 + Math.cos(phase.current) * 9 + jitter;
      ingest(next);
    }, TICK);
    return () => window.clearInterval(id);
  }, [status, cycleMs, source, ingest]);

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
    kind: source?.kind ?? kind,
    /** `true`, gdy powtórzenia liczy prawdziwy czujnik, a nie symulacja. */
    native: source !== null,
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
