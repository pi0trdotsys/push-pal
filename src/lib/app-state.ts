import { useSyncExternalStore } from "react";
import { DEFAULT_PLAN, TRAINING_PLANS, type TrainingPlan } from "./training-plans";
import type { SensorKind } from "@/hooks/use-rep-sensor";

export type AppSettings = {
  planId: string;
  sensorKind: SensorKind;
  threshold: number;
  oled: boolean;
};

let state: AppSettings = {
  planId: DEFAULT_PLAN.id,
  sensorKind: "proximity",
  threshold: 8,
  oled: true,
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function setSettings(patch: Partial<AppSettings>) {
  state = { ...state, ...patch };
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dim", !state.oled);
  }
  emit();
}

export function useSettings(): AppSettings {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
}

export function usePlan(): TrainingPlan {
  const { planId } = useSettings();
  return TRAINING_PLANS.find((p) => p.id === planId) ?? DEFAULT_PLAN;
}
