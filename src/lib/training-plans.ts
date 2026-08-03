export type SeriesTarget = {
  /** 1-indexed position in the session */
  index: number;
  reps: number;
  /** rest after this series, in seconds */
  rest: number;
};

export type TrainingPlan = {
  id: string;
  code: string;
  name: string;
  focus: string;
  totalReps: number;
  series: SeriesTarget[];
  progression: string[];
};

const build = (reps: number[], rest: number): SeriesTarget[] =>
  reps.map((r, i) => ({ index: i + 1, reps: r, rest }));

export const TRAINING_PLANS: TrainingPlan[] = [
  {
    id: "base",
    code: "PLAN_01",
    name: "Base",
    focus: "Objętość bazowa / technika",
    totalReps: 45,
    series: build([10, 12, 10, 8, 5], 60),
    progression: ["W1 45", "W2 50", "W3 56", "W4 48 deload"],
  },
  {
    id: "hypertrophy",
    code: "PLAN_02",
    name: "Hypertrophy",
    focus: "Czas pod napięciem / tempo 3-1-1",
    totalReps: 60,
    series: build([12, 12, 12, 12, 12], 45),
    progression: ["W1 60", "W2 66", "W3 72", "W4 60 deload"],
  },
  {
    id: "max",
    code: "PLAN_03",
    name: "Max Effort",
    focus: "Siła maksymalna / długie przerwy",
    totalReps: 38,
    series: build([8, 8, 8, 8, 6], 120),
    progression: ["W1 38", "W2 42", "W3 46", "W4 34 deload"],
  },
];

export const DEFAULT_PLAN: TrainingPlan = TRAINING_PLANS[1]!;

export const WEEK_PROGRESS = [
  { day: "MON", value: 40 },
  { day: "TUE", value: 65 },
  { day: "WED", value: 55 },
  { day: "THU", value: 90 },
  { day: "FRI", value: 70 },
  { day: "SAT", value: 85 },
  { day: "SUN", value: 20 },
];

export type SessionRecord = {
  id: string;
  date: string;
  plan: string;
  reps: number;
  duration: string;
  pace: string;
  record?: boolean;
};

export const SESSION_HISTORY: SessionRecord[] = [
  { id: "s-108", date: "02.08", plan: "PLAN_02", reps: 66, duration: "18m 42s", pace: "1.2s", record: true },
  { id: "s-107", date: "31.07", plan: "PLAN_02", reps: 60, duration: "17m 05s", pace: "1.3s" },
  { id: "s-106", date: "29.07", plan: "PLAN_01", reps: 52, duration: "15m 20s", pace: "1.1s" },
  { id: "s-105", date: "27.07", plan: "PLAN_03", reps: 38, duration: "21m 10s", pace: "1.6s" },
  { id: "s-104", date: "25.07", plan: "PLAN_02", reps: 58, duration: "16m 44s", pace: "1.3s" },
  { id: "s-103", date: "23.07", plan: "PLAN_01", reps: 48, duration: "14m 02s", pace: "1.2s" },
  { id: "s-102", date: "21.07", plan: "PLAN_01", reps: 45, duration: "13m 51s", pace: "1.2s" },
];

export const MONTH_TREND = [
  22, 30, 0, 41, 38, 0, 45, 48, 0, 44, 52, 0, 50, 55, 0, 47, 58, 0, 60, 54, 0,
  38, 62, 0, 57, 60, 0, 66, 0, 64,
];
