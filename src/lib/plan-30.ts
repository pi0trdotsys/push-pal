export type PlanVariant = "base" | "hypertrophy" | "max";
export type ExerciseId = "pushup" | "lateral-raise" | "hammer-curl" | "triceps-extension";
export type TrainingKind = "pushups" | "dumbbells";
export type DayPlan = {
  day: number;
  date: string;
  sets: number[];
  rest: number;
  manual: boolean;
  training: TrainingKind;
  exercises: ExerciseId[];
};
export const DEFAULT_VARIANT: PlanVariant = "base";
export const DEFAULT_VOLUME = 40;
export const PLAN_LENGTH = 30;
export const WARMUP_SECONDS = 120;
export const COOLDOWN_SECONDS = 60;
export const PLAN_VARIANTS = [
  { id: "base", name: "Regularność", hint: "Co drugi dzień · około 15 minut", sets: 5, rest: 150 },
] as const;
export function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function addDays(iso: string, offset: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + offset);
  return toIso(d);
}
export function calendarDays(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86400000);
}
export function weekdayLabel(iso: string): string {
  return ["ndz", "pon", "wt", "śr", "czw", "pt", "sob"][new Date(`${iso}T12:00:00`).getDay()] ?? "";
}
export const dayVolume = (d: DayPlan): number => d.sets.reduce((a, b) => a + b, 0);
export const isRestDay = (d: DayPlan): boolean => !d.sets.length;
export function estimateSeconds(d: DayPlan): number {
  return isRestDay(d) ? 0 : 180 + dayVolume(d) * 3 + Math.max(0, d.sets.length - 1) * d.rest;
}
export function generatePlan(
  startIso: string,
  _variant: PlanVariant,
  startVolume: number,
  keep: DayPlan[] = [],
  windowStart = startIso,
  dumbbellReps = 10,
): DayPlan[] {
  const volume = Math.max(5, Math.min(120, Math.round(startVolume)));
  const sets = Array.from(
    { length: 5 },
    (_, i) => Math.floor(volume / 5) + (i < volume % 5 ? 1 : 0),
  );
  const rest = Math.max(45, Math.min(180, Math.round((720 - volume * 3) / 4)));
  const armReps = Math.max(6, Math.min(15, Math.round(dumbbellReps)));
  return Array.from({ length: 30 }, (_, i) => {
    const date = addDays(windowStart, i);
    const day = calendarDays(startIso, date) + 1;
    const training: TrainingKind = (day - 1) % 2 === 0 ? "pushups" : "dumbbells";
    return (
      keep.find((d) => d.date === date && d.manual) ?? {
        day,
        date,
        training,
        sets: training === "pushups" ? [...sets] : Array.from({ length: 6 }, () => armReps),
        exercises:
          training === "pushups"
            ? sets.map(() => "pushup")
            : [
                "lateral-raise",
                "lateral-raise",
                "hammer-curl",
                "hammer-curl",
                "triceps-extension",
                "triceps-extension",
              ],
        rest: training === "pushups" ? rest : Math.round((720 - armReps * 18) / 5),
        manual: false,
      }
    );
  });
}
export function exerciseFor(d: DayPlan, index: number): ExerciseId {
  return d.exercises[index] ?? (d.training === "dumbbells" ? "hammer-curl" : "pushup");
}
