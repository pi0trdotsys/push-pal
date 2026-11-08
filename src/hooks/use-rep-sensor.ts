import { useCallback, useEffect, useRef, useState } from "react";
export type SensorKind = "proximity" | "hall";
export type SensorStatus = "idle" | "running" | "paused";
export type RepSensorSource = {
  kind: SensorKind;
  subscribe(
    onSample: (sample: { distance: number }) => void,
    onError: (message: string) => void,
  ): () => void;
};
type Options = {
  kind?: SensorKind;
  threshold?: number;
  source?: RepSensorSource | null;
  demo?: boolean;
};
export function useRepSensor({
  kind = "proximity",
  threshold = 8,
  source = null,
  demo = false,
}: Options = {}) {
  const [status, setStatus] = useState<SensorStatus>("idle"),
    [distance, setDistance] = useState(20),
    [reps, setReps] = useState(0),
    [tempo, setTempo] = useState(0),
    [error, setError] = useState<string | null>(null);
  const below = useRef(false),
    last = useRef<number | null>(null),
    thresholdRef = useRef(threshold),
    phase = useRef(0);
  thresholdRef.current = threshold;
  const ingest = useCallback((next: number) => {
    setDistance(next);
    const now = performance.now();
    if (next < thresholdRef.current && !below.current) {
      below.current = true;
      if (last.current === null || now - last.current >= 450) {
        if (last.current !== null) setTempo(Math.round((now - last.current) / 100) / 10);
        last.current = now;
        setReps((r) => r + 1);
      }
    } else if (next > thresholdRef.current + 3) below.current = false;
  }, []);
  useEffect(() => {
    if (status !== "running") return;
    if (source)
      return source.subscribe(
        (s) => ingest(s.distance),
        (message) => {
          setError(message);
          setStatus("paused");
        },
      );
    if (!demo) {
      setError("Automatyczne liczenie wymaga czujnika Androida. Użyj trybu ręcznego.");
      setStatus("paused");
      return;
    }
    const id = window.setInterval(() => {
      phase.current += Math.PI / 10;
      ingest(11 + Math.cos(phase.current) * 9);
    }, 60);
    return () => window.clearInterval(id);
  }, [status, source, demo, ingest]);
  const start = useCallback(() => {
    below.current = false;
    last.current = null;
    setError(null);
    setStatus("running");
  }, []);
  const pause = useCallback(() => setStatus("paused"), []);
  const reset = useCallback(() => {
    setStatus("idle");
    setReps(0);
    setDistance(20);
    setTempo(0);
    setError(null);
    below.current = false;
    last.current = null;
  }, []);
  return {
    kind: source?.kind ?? kind,
    native: source !== null,
    status,
    distance,
    reps,
    tempo,
    error,
    start,
    pause,
    reset,
  };
}
