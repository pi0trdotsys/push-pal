import { useSyncExternalStore } from "react";
import { z } from "zod";
import type { SensorKind } from "@/hooks/use-rep-sensor";
import { generatePlan, toIso, type DayPlan, type PlanVariant } from "./plan-30";
import { syncWidget } from "./widget-bridge";
import { pauseSession } from "./session-machine";
const KEY = "push-pal:state:v2";
const iso = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T12:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Nieprawidłowa data kalendarzowa");
const count = z.number().int().min(0).max(10000);
const training = z.enum(["pushups", "dumbbells"]);
const exercise = z.enum(["pushup", "lateral-raise", "hammer-curl", "triceps-extension"]);
const setSchema = z.object({
  target: count,
  reps: count,
  seconds: z.number().nonnegative(),
  restSeconds: z.number().nonnegative(),
  mode: z.enum(["manual", "sensor"]),
  exercise: exercise.default("pushup"),
  weight: z.number().min(0).max(100).nullable().default(null),
});
const resultSchema = z.object({
  id: z.string(),
  date: iso,
  reps: count,
  target: count,
  seconds: z.number().nonnegative(),
  tempo: z.number().nonnegative(),
  sets: z.array(setSchema),
  difficulty: z.enum(["easy", "right", "hard"]).nullable(),
  completed: z.boolean(),
  training: training.default("pushups"),
});
const daySchema = z.object({
  day: z.number().int(),
  date: iso,
  sets: z.array(z.number().int().min(1).max(120)).max(12),
  rest: z.number().min(10).max(600),
  manual: z.boolean(),
  training: training.default("pushups"),
  exercises: z.array(exercise).default([]),
});
const draftSchema = z.object({
  id: z.string(),
  date: iso,
  plan: daySchema,
  phase: z.enum(["warmup", "set", "rest", "cooldown", "review"]),
  index: count,
  reps: count,
  sets: z.array(setSchema),
  startedAt: z.number(),
  phaseStartedAt: z.number(),
  deadline: z.number().nullable(),
  paused: z.boolean(),
  remaining: z.number().nonnegative(),
  mode: z.enum(["manual", "sensor"]),
  setSeconds: z.number().nonnegative(),
  restSeconds: z.number().nonnegative(),
  weight: z.number().min(0).max(100).nullable().default(null),
  checkpointAt: z.number().default(0),
  elapsedSeconds: z.number().nonnegative().default(0),
});
const activitySchema = z.object({
  id: z.string(),
  date: iso,
  kind: z.enum(["elliptical", "run", "hike", "bike"]),
  minutes: z.number().int().min(1).max(720),
});
const schema = z.object({
  startDate: iso,
  variant: z.enum(["base", "hypertrophy", "max"]),
  volume: z.number().int().min(5).max(120),
  dumbbellReps: z.number().int().min(6).max(15).default(10),
  plan: z.array(daySchema),
  threshold: z.number().min(3).max(16),
  sensorKind: z.enum(["hall", "proximity"]),
  history: z.array(resultSchema),
  active: draftSchema.nullable(),
  onboarded: z.boolean(),
  activities: z.array(activitySchema).default([]),
});
export type WeekendActivity = z.infer<typeof activitySchema>;
export type SetResult = z.infer<typeof setSchema>;
export type SessionResult = z.infer<typeof resultSchema>;
export type ActiveSession = z.infer<typeof draftSchema>;
export type AppState = z.infer<typeof schema> & { today: string; storageError: boolean };
let state: AppState | null = null;
const listeners = new Set<() => void>();
let syncing = false,
  pending = false;
function fresh(today: string): AppState {
  return {
    startDate: today,
    today,
    variant: "base",
    volume: 40,
    dumbbellReps: 10,
    plan: generatePlan(today, "base", 40),
    threshold: 8,
    sensorKind: "proximity",
    history: [],
    active: null,
    onboarded: false,
    activities: [],
    storageError: false,
  };
}
function init(): AppState {
  const today = toIso(new Date()),
    base = fresh(today);
  if (typeof window === "undefined") return base;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = schema.parse(JSON.parse(raw));
      if (parsed.active && !parsed.active.paused)
        parsed.active = pauseSession(
          parsed.active,
          parsed.active.checkpointAt || parsed.active.phaseStartedAt,
        );
      return {
        ...parsed,
        today,
        storageError: false,
        plan: generatePlan(
          parsed.startDate,
          parsed.variant,
          parsed.volume,
          parsed.plan,
          today,
          parsed.dumbbellReps,
        ),
      };
    }
    const legacy = window.localStorage.getItem("push-pal:state:v1");
    if (legacy) {
      const old = z
        .object({
          volume: z.number().optional(),
          threshold: z.number().optional(),
          sensorKind: z.enum(["hall", "proximity"]).optional(),
          history: z
            .array(
              z.object({
                date: iso,
                reps: count,
                target: count,
                seconds: z.number().nonnegative(),
                tempo: z.number().nonnegative(),
              }),
            )
            .optional(),
        })
        .parse(JSON.parse(legacy));
      base.volume = Math.max(5, Math.min(120, Math.round(old.volume ?? 40)));
      base.threshold = Math.max(3, Math.min(16, old.threshold ?? 8));
      base.sensorKind = old.sensorKind ?? "proximity";
      base.history = (old.history ?? []).map((h, i) => ({
        ...h,
        id: `legacy-${h.date}-${i}`,
        sets: [],
        difficulty: null,
        training: "pushups",
        completed: h.reps >= h.target,
      }));
      base.plan = generatePlan(today, "base", base.volume);
    }
  } catch {
    base.storageError = true;
    try {
      const damaged = window.localStorage.getItem(KEY);
      if (damaged) window.localStorage.setItem("push-pal:recovery:" + Date.now(), damaged);
    } catch {
      /* Never remove a failed record. */
    }
  }
  return base;
}
function getState(): AppState {
  return (state ??= init());
}
const serverState = fresh("2000-01-01");
function persist(next: AppState) {
  if (typeof window === "undefined") return;
  try {
    const { today: _today, storageError: _error, ...data } = next;
    window.localStorage.setItem(KEY, JSON.stringify(data));
    next.storageError = false;
  } catch {
    next.storageError = true;
  }
}
async function updateWidget() {
  pending = true;
  if (syncing) return;
  syncing = true;
  try {
    while (pending) {
      pending = false;
      await syncWidget(getState()).catch(() => {});
    }
  } finally {
    syncing = false;
  }
}
function set(patch: Partial<AppState>) {
  state = { ...getState(), ...patch };
  persist(state);
  listeners.forEach((fn) => fn());
  void updateWidget();
}
export function useAppState(): AppState {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    getState,
    () => serverState,
  );
}
export function refreshCalendar() {
  const s = getState(),
    today = toIso(new Date());
  if (s.today !== today)
    set({
      today,
      plan: generatePlan(s.startDate, s.variant, s.volume, s.plan, today, s.dumbbellReps),
    });
  else void updateWidget();
}
export function regeneratePlan(_variant: PlanVariant, volume: number) {
  const s = getState(),
    safe = Math.max(5, Math.min(120, Math.round(volume)));
  set({
    volume: safe,
    variant: "base",
    plan: generatePlan(s.startDate, "base", safe, s.plan, s.today, s.dumbbellReps),
  });
}
export function completeOnboarding(volume: number) {
  regeneratePlan("base", volume);
  set({ onboarded: true });
}
export function updateDay(day: number, sets: number[]) {
  if (sets.length > 12 || sets.some((r) => !Number.isInteger(r) || r < 1 || r > 120)) return;
  set({ plan: getState().plan.map((d) => (d.day === day ? { ...d, sets, manual: true } : d)) });
}
export function releaseDay(day: number) {
  const s = getState(),
    keep = s.plan.map((d) => (d.day === day ? { ...d, manual: false } : d));
  set({ plan: generatePlan(s.startDate, s.variant, s.volume, keep, s.today, s.dumbbellReps) });
}
export function setThreshold(threshold: number) {
  set({ threshold: Math.max(3, Math.min(16, threshold)) });
}
export function setSensorKind(sensorKind: SensorKind) {
  set({ sensorKind });
}
export function saveActive(active: ActiveSession) {
  const previous = getState().active;
  const now = Date.now();
  const delta =
    previous && previous.id === active.id && !previous.paused
      ? Math.max(0, (now - previous.checkpointAt) / 1000)
      : 0;
  const elapsedSeconds =
    previous?.id === active.id ? previous.elapsedSeconds : active.elapsedSeconds;
  set({ active: { ...active, elapsedSeconds: elapsedSeconds + delta, checkpointAt: now } });
}
export function logWeekendActivity(kind: WeekendActivity["kind"], minutes: number) {
  const s = getState(),
    entry = activitySchema.parse({ id: crypto.randomUUID(), date: s.today, kind, minutes });
  set({ activities: [entry, ...s.activities] });
}
export function pushSession(result: SessionResult) {
  const s = getState(),
    parsed = resultSchema.parse(result);
  set({ history: [parsed, ...s.history.filter((h) => h.id !== result.id)], active: null });
}
export function todayPlan(s: AppState): DayPlan {
  return (
    s.plan.find((d) => d.date === s.today) ??
    generatePlan(s.startDate, s.variant, s.volume, [], s.today, s.dumbbellReps)[0]!
  );
}
export function moveTrainingToToday() {
  const s = getState();
  if (!s.active)
    set({
      startDate: s.today,
      plan: generatePlan(s.today, "base", s.volume, [], s.today, s.dumbbellReps),
    });
}
export function exportBackup(): string {
  const { today: _today, storageError: _error, ...data } = getState();
  return JSON.stringify(data, null, 2);
}
export function restoreBackup(raw: string) {
  const data = schema.parse(JSON.parse(raw)),
    today = toIso(new Date());
  set({
    ...data,
    today,
    plan: generatePlan(
      data.startDate,
      data.variant,
      data.volume,
      data.plan,
      today,
      data.dumbbellReps,
    ),
  });
}

export function regenerateDumbbells(reps: number) {
  const s = getState(),
    dumbbellReps = Math.max(6, Math.min(15, Math.round(reps)));
  set({
    dumbbellReps,
    plan: generatePlan(s.startDate, s.variant, s.volume, s.plan, s.today, dumbbellReps),
  });
}
