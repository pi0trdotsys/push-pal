import { WARMUP_SECONDS, COOLDOWN_SECONDS, dayVolume, exerciseFor, type DayPlan } from "./plan-30";
import type { ActiveSession, SessionResult } from "./session-store";
export function newSession(plan: DayPlan, now = Date.now()): ActiveSession {
  return {
    id: crypto.randomUUID(),
    date: plan.date,
    plan: structuredClone(plan),
    phase: "warmup",
    index: 0,
    reps: 0,
    sets: [],
    startedAt: now,
    phaseStartedAt: now,
    deadline: now + WARMUP_SECONDS * 1000,
    paused: false,
    remaining: WARMUP_SECONDS,
    mode: "manual",
    setSeconds: 0,
    restSeconds: 0,
    weight: null,
    checkpointAt: now,
    elapsedSeconds: 0,
  };
}
export function remainingSeconds(s: ActiveSession, now = Date.now()) {
  return s.paused ? s.remaining : Math.max(0, Math.ceil(((s.deadline ?? now) - now) / 1000));
}
export function pauseSession(s: ActiveSession, now = Date.now()): ActiveSession {
  if (s.paused) return s;
  const seconds = Math.max(0, (now - s.phaseStartedAt) / 1000);
  return {
    ...s,
    paused: true,
    remaining: remainingSeconds(s, now),
    setSeconds: s.setSeconds + (s.phase === "set" ? seconds : 0),
    restSeconds: s.restSeconds + (s.phase === "rest" ? seconds : 0),
    phaseStartedAt: now,
    deadline: null,
  };
}
export function resumeSession(s: ActiveSession, now = Date.now()): ActiveSession {
  return {
    ...s,
    paused: false,
    phaseStartedAt: now,
    deadline: ["warmup", "rest", "cooldown"].includes(s.phase) ? now + s.remaining * 1000 : null,
  };
}
export function nextPhase(s: ActiveSession, now = Date.now()): ActiveSession {
  if (s.phase === "warmup")
    return { ...s, phase: "set", phaseStartedAt: now, deadline: null, remaining: 0, paused: false };
  if (s.phase === "rest")
    return {
      ...s,
      phase: "set",
      index: s.index + 1,
      reps: 0,
      setSeconds: 0,
      restSeconds: s.restSeconds + (s.paused ? 0 : Math.max(0, (now - s.phaseStartedAt) / 1000)),
      phaseStartedAt: now,
      deadline: null,
      paused: false,
      remaining: 0,
    };
  if (s.phase === "cooldown") return { ...s, phase: "review", deadline: null, paused: true };
  if (s.phase !== "set") return s;
  const entry = {
    target: s.plan.sets[s.index] ?? 0,
    reps: s.reps,
    seconds: s.setSeconds + (s.paused ? 0 : Math.max(0, (now - s.phaseStartedAt) / 1000)),
    restSeconds: s.restSeconds,
    mode: s.mode,
    exercise: exerciseFor(s.plan, s.index),
    weight: s.weight,
  };
  const last = s.index + 1 >= s.plan.sets.length;
  const remaining = last ? COOLDOWN_SECONDS : s.plan.rest;
  return {
    ...s,
    sets: [...s.sets, entry],
    phase: last ? "cooldown" : "rest",
    reps: 0,
    setSeconds: 0,
    restSeconds: 0,
    remaining,
    deadline: now + remaining * 1000,
    phaseStartedAt: now,
    paused: false,
  };
}
export function reviewSession(s: ActiveSession, now = Date.now()): ActiveSession {
  const next = s.phase === "set" && s.reps > 0 ? nextPhase(s, now) : s;
  return { ...next, phase: "review", deadline: null, paused: true };
}
export function resultFor(
  s: ActiveSession,
  difficulty: SessionResult["difficulty"],
  now = Date.now(),
): SessionResult {
  const reps = s.sets.reduce((a, b) => a + b.reps, 0),
    target = dayVolume(s.plan);
  return {
    id: s.id,
    date: s.date,
    reps,
    target,
    seconds: Math.max(
      0,
      Math.round(s.elapsedSeconds + (s.paused ? 0 : (now - s.checkpointAt) / 1000)),
    ),
    tempo: 0,
    sets: s.sets,
    difficulty,
    training: s.plan.training,
    completed: s.sets.length === s.plan.sets.length && s.sets.every((e) => e.reps >= e.target),
  };
}
