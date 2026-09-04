/**
 * PUSH — globalny stan aplikacji (plan, ustawienia czujnika, historia).
 *
 * Trwały zapis: cały stan poza `today` jest lustrzany do `localStorage`
 * (klucz `push-pal:state:v1`) po każdej zmianie. `today` liczy się świeżo
 * przy każdym starcie, żeby aplikacja otwarta następnego dnia pokazywała
 * właściwy dzień planu zamiast wczorajszej daty z zapisu.
 *
 * Store jest inicjalizowany leniwie przy pierwszym odczycie — nie wolno
 * wywoływać `new Date()` w zakresie modułu (runtime Workers/SSR).
 */
import { useSyncExternalStore } from "react";
import type { SensorKind } from "@/hooks/use-rep-sensor";
import {
  DEFAULT_VARIANT,
  DEFAULT_VOLUME,
  type DayPlan,
  type PlanVariant,
  generatePlan,
  toIso,
} from "./plan-30";

const STORAGE_KEY = "push-pal:state:v1";

/** Kształt zapisywany w `localStorage` — bez `today`, patrz komentarz modułu. */
type PersistedState = Omit<AppState, "today">;

function loadPersisted(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

function savePersisted(s: AppState) {
  if (typeof window === "undefined") return;
  try {
    const { today: _today, ...persisted } = s;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  } catch {
    // localStorage niedostępny (tryb prywatny, itp.) — działamy tylko w pamięci
  }
}

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
  /** Próg detekcji czujnika w mm (skala symulacji, patrz `useRepSensor`). */
  threshold: number;
  /** Który czujnik telefonu liczy powtórzenia (Hall = domyślny). */
  sensorKind: SensorKind;
  history: SessionResult[];
};

let state: AppState | null = null;
const listeners = new Set<() => void>();

function init(): AppState {
  const today = toIso(new Date());
  const persisted = loadPersisted();
  if (persisted) return { sensorKind: "hall", threshold: 8, ...persisted, today };

  return {
    startDate: today,
    today,
    variant: DEFAULT_VARIANT,
    volume: DEFAULT_VOLUME,
    plan: generatePlan(today, DEFAULT_VARIANT, DEFAULT_VOLUME),
    threshold: 8,
    sensorKind: "hall",
    history: [],
  };
}

function getState(): AppState {
  if (!state) state = init();
  return state;
}

function set(patch: Partial<AppState>) {
  state = { ...getState(), ...patch };
  savePersisted(state);
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

/** Przełącza źródło czujnika (Hall / zbliżeniowy). */
export function setSensorKind(sensorKind: SensorKind) {
  set({ sensorKind });
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
