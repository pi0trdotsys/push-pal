/**
 * PUSH — globalny stan makiety (plan, ustawienia czujnika, historia).
 *
 * Świadomie w pamięci: dane znikają po odświeżeniu. Punkt wpięcia trwałego
 * zapisu (localStorage / Lovable Cloud) opisuje `docs/IMPLEMENTATION.md`.
 *
 * Store jest inicjalizowany leniwie przy pierwszym odczycie — nie wolno
 * wywoływać `new Date()` w zakresie modułu (runtime Workers).
 */
import { useSyncExternalStore } from "react";
import {
  DEFAULT_VARIANT,
  DEFAULT_VOLUME,
  type DayPlan,
  type PlanVariant,
  generatePlan,
  toIso,
} from "./plan-30";

/** Wynik jednego zakończonego dnia treningowego. */
export type SessionResult = {
  /** Data ISO dnia. */
  date: string;
  /** Suma zaliczonych powtórzeń. */
  reps: number;
  /** Zaplanowana suma powtórzeń. */
  target: number;
  /** Czas trwania sesji w sekundach. */
  seconds: number;
  /** Średnie tempo powtórzenia w sekundach (z czujnika). */
  tempo: number;
};

export type AppState = {
  /** Data dnia 1 planu (ISO). */
  startDate: string;
  /** Dzisiejsza data (ISO) — ustalana raz przy starcie aplikacji. */
  today: string;
  variant: PlanVariant;
  /** Dzienny wolumen w pierwszym tygodniu. */
  volume: number;
  plan: DayPlan[];
  /** Próg detekcji czujnika zbliżeniowego w mm. */
  threshold: number;
  history: SessionResult[];
};

let state: AppState | null = null;
const listeners = new Set<() => void>();

function init(): AppState {
  const today = toIso(new Date());
  return {
    startDate: today,
    today,
    variant: DEFAULT_VARIANT,
    volume: DEFAULT_VOLUME,
    plan: generatePlan(today, DEFAULT_VARIANT, DEFAULT_VOLUME),
    threshold: 8,
    history: [],
  };
}

function getState(): AppState {
  if (!state) state = init();
  return state;
}

function set(patch: Partial<AppState>) {
  state = { ...getState(), ...patch };
  listeners.forEach((l) => l());
}

/** Subskrypcja całego stanu aplikacji. */
export function useAppState(): AppState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getState,
    getState,
  );
}

/** Przelicza cały plan, zachowując dni oznaczone jako ręczne. */
export function regeneratePlan(variant: PlanVariant, volume: number) {
  const s = getState();
  set({ variant, volume, plan: generatePlan(s.startDate, variant, volume, s.plan) });
}

/** Nadpisuje pojedynczy dzień i oznacza go jako edytowany ręcznie. */
export function updateDay(day: number, sets: number[]) {
  const s = getState();
  set({
    plan: s.plan.map((d) => (d.day === day ? { ...d, sets, manual: true } : d)),
  });
}

/** Zdejmuje flagę ręcznej edycji — dzień wróci pod kontrolę generatora. */
export function releaseDay(day: number) {
  const s = getState();
  const next = s.plan.map((d) => (d.day === day ? { ...d, manual: false } : d));
  set({ plan: next });
  set({ plan: generatePlan(s.startDate, s.variant, s.volume, next) });
}

/** Ustawia próg detekcji czujnika (mm). */
export function setThreshold(threshold: number) {
  set({ threshold });
}

/** Zapisuje zakończoną sesję do historii. */
export function pushSession(result: SessionResult) {
  const s = getState();
  set({ history: [result, ...s.history].slice(0, 60) });
}

/** Dzień planu przypadający na dzisiaj (lub pierwszy dzień, gdy poza zakresem). */
export function todayPlan(s: AppState): DayPlan {
  return s.plan.find((d) => d.date === s.today) ?? s.plan[0]!;
}
