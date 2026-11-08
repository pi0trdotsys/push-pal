import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
function load(name, overrides = {}) {
  const exports = {};
  const js = ts.transpileModule(
    fs.readFileSync(new URL("../src/lib/" + name + ".ts", import.meta.url), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  ).outputText;
  vm.runInNewContext(
    js,
    {
      exports,
      require: (id) =>
        id in overrides
          ? overrides[id]
          : id.startsWith("./")
            ? load(id.slice(2), overrides)
            : require(id),
      Date,
      Math,
      JSON,
      crypto,
      structuredClone,
      TextEncoder,
      Set,
      window: overrides.window,
    },
    { filename: name + ".ts" },
  );
  return exports;
}
const plan = load("plan-30"),
  machine = load("session-machine"),
  analysis = load("training-analysis");
const normalize = (x) => JSON.parse(JSON.stringify(x));
test("calendar alternates pushups and arms, also across DST and month boundaries", () => {
  const p = plan.generatePlan("2026-10-24", "base", 40);
  assert.equal(p[1].training, "dumbbells");
  assert.equal(p[2].date, "2026-10-26");
  assert.equal(p[2].training, "pushups");
  assert.equal(p[29].date, "2026-11-22");
  for (const d of p) assert.ok(Math.abs(plan.estimateSeconds(d) - 900) <= 2);
});
test("rolling plan after 30 days retains cadence and manual edits by date", () => {
  const initial = plan.generatePlan("2026-11-08", "base", 40);
  const edited = { ...initial[3], sets: [4, 4], manual: true };
  const p = plan.generatePlan("2026-11-08", "base", 45, [edited], "2026-11-10");
  assert.deepEqual(normalize(p[1].sets), [4, 4]);
  const next = plan.generatePlan("2026-11-08", "base", 40, [], "2027-01-01");
  assert.equal(next[0].date, "2027-01-01");
  assert.equal(next[0].day, 55);
  assert.equal(next[0].training, "pushups");
});
test("all allowed pushup volumes fit approximately 15 minutes with positive sets", () => {
  for (let n = 5; n <= 120; n++) {
    const d = plan.generatePlan("2026-11-08", "base", n)[0];
    assert.equal(plan.dayVolume(d), n);
    assert.ok(d.sets.every((x) => x > 0));
    assert.ok(Math.abs(plan.estimateSeconds(d) - 900) <= 2);
  }
});
test("pause and resume preserve countdown without counting background time", () => {
  const s = machine.newSession(plan.generatePlan("2026-11-08", "base", 40)[0], 1000);
  const paused = machine.pauseSession(s, 11000);
  assert.equal(paused.remaining, 110);
  const resumed = machine.resumeSession(paused, 100000);
  assert.equal(resumed.deadline, 210000);
  assert.equal(machine.remainingSeconds(resumed, 150000), 60);
});
test("completed arms workout preserves exercise identity and load", () => {
  let s = machine.newSession(plan.generatePlan("2026-11-08", "base", 40)[1], 0);
  s = machine.nextPhase(s, 120000);
  for (let i = 0; i < 6; i++) {
    s = { ...s, reps: 10, weight: 4 };
    s = machine.nextPhase(s, 150000 + i * 200000);
    s = machine.nextPhase(s, 258000 + i * 200000);
  }
  assert.equal(s.phase, "review");
  const r = machine.resultFor(s, "right", 1500000);
  assert.equal(r.completed, true);
  assert.equal(r.training, "dumbbells");
  assert.equal(r.reps, 60);
  assert.equal(r.sets[0].exercise, "lateral-raise");
  assert.equal(r.sets[2].exercise, "hammer-curl");
  assert.equal(r.sets[4].exercise, "triceps-extension");
  assert.equal(r.sets[5].weight, 4);
});
test("early finish keeps partial series and never marks full completion", () => {
  let s = machine.nextPhase(
    machine.newSession(plan.generatePlan("2026-11-08", "base", 40)[0], 0),
    120000,
  );
  s = { ...s, reps: 3 };
  s = machine.reviewSession(s, 130000);
  const r = machine.resultFor(s, "hard", 131000);
  assert.equal(r.completed, false);
  assert.equal(r.reps, 3);
  assert.equal(r.sets[0].seconds, 10);
});
test("analysis uses only pushups, filters week and does not invent measurements", () => {
  const sample = (training, date, difficulty) => ({
    id: crypto.randomUUID(),
    training,
    date,
    reps: 40,
    target: 40,
    seconds: 900,
    tempo: 0,
    sets: [],
    difficulty,
    completed: true,
  });
  const h = [
    sample("dumbbells", "2026-11-08", "hard"),
    sample("pushups", "2026-11-07", "easy"),
    sample("pushups", "2026-11-05", "easy"),
    sample("pushups", "2026-11-03", "easy"),
    sample("pushups", "2026-10-01", "easy"),
  ];
  const a = analysis.analyze(h, "2026-11-08", 40);
  assert.equal(a.total, 120);
  assert.equal(a.suggested, 42);
  assert.equal(analysis.analyze([], "2026-11-08", 40).suggested, null);
});
function storeWith(records) {
  const storage = new Map(Object.entries(records));
  const store = load("session-store", {
    "./widget-bridge": { syncWidget: async () => {} },
    react: { useSyncExternalStore: (_subscribe, get) => get() },
    window: {
      localStorage: {
        getItem: (k) => storage.get(k) ?? null,
        setItem: (k, v) => storage.set(k, v),
      },
    },
  });
  return { store, storage };
}
test("legacy migration preserves all history and creates new alternating plan", () => {
  const h = Array.from({ length: 65 }, () => ({
    date: "2026-11-01",
    reps: 20,
    target: 40,
    seconds: 600,
    tempo: 2,
  }));
  const { store } = storeWith({ "push-pal:state:v1": JSON.stringify({ history: h, volume: 40 }) });
  const state = store.useAppState();
  assert.equal(state.history.length, 65);
  assert.equal(state.history[0].training, "pushups");
  assert.equal(state.plan[1].training, "dumbbells");
});
test("backup round-trip validates before mutation, keeps optional cardio and deduplicates saves", () => {
  const { store } = storeWith({});
  store.completeOnboarding(40);
  store.logWeekendActivity("bike", 30);
  const raw = store.exportBackup();
  assert.throws(() => store.restoreBackup("{}"));
  assert.equal(store.useAppState().activities.length, 1);
  store.restoreBackup(raw);
  let s = machine.newSession(store.useAppState().plan[0]);
  s = machine.reviewSession(s);
  const r = machine.resultFor(s, "right");
  store.pushSession(r);
  store.pushSession(r);
  assert.equal(store.useAppState().history.length, 1);
  assert.equal(store.useAppState().active, null);
});
test("corrupted data is preserved for recovery", () => {
  const { store, storage } = storeWith({ "push-pal:state:v2": "bad-json" });
  assert.equal(store.useAppState().storageError, true);
  assert.ok([...storage.keys()].some((k) => k.startsWith("push-pal:recovery:")));
});
test("recovery freezes at persisted checkpoint, not time spent with app closed", () => {
  const first = storeWith({});
  first.store.completeOnboarding(40);
  let s = machine.newSession(first.store.useAppState().plan[0], 1000);
  s = machine.nextPhase(s, 121000);
  first.store.saveActive(s);
  const saved = JSON.parse(first.store.exportBackup());
  saved.active.checkpointAt = 126000;
  const { store } = storeWith({ "push-pal:state:v2": JSON.stringify(saved) });
  const recovered = store.useAppState().active;
  assert.equal(recovered.paused, true);
  assert.equal(recovered.setSeconds, 5);
});

const calendar = load("calendar");
test("calendar includes alternating workouts, exact dates, local times and optional alarms", () => {
  const days = plan.generatePlan("2026-11-08", "base", 40);
  const text = calendar.buildCalendar(days, "18:30", true, new Date("2026-11-08T12:00:00Z"));
  const unfolded = text.replace(/\r\n /g, "");
  assert.equal((text.match(/BEGIN:VEVENT/g) || []).length, 30);
  assert.equal((text.match(/BEGIN:VALARM/g) || []).length, 30);
  assert.ok(text.includes("DTSTART:20261108T183000"));
  assert.ok(text.includes("DTEND:20261108T184500"));
  assert.ok(unfolded.includes("Hantle"));
  assert.ok(text.endsWith("END:VCALENDAR\r\n"));
  for (const line of text.split("\r\n")) assert.ok(Buffer.byteLength(line, "utf8") <= 75);
});
test("calendar omits rest days, validates time and exports no unwanted reminders", () => {
  const days = plan.generatePlan("2026-11-08", "base", 40);
  days[0].sets = [];
  const text = calendar.buildCalendar(days, "07:00");
  assert.equal((text.match(/BEGIN:VEVENT/g) || []).length, 29);
  assert.ok(!text.includes("VALARM"));
  assert.throws(() => calendar.buildCalendar(days, "25:00"));
});
test("a recommendation cannot be applied repeatedly against the same old results", () => {
  const h = Array.from({ length: 3 }, () => ({
    id: crypto.randomUUID(),
    training: "pushups",
    date: "2026-11-07",
    reps: 40,
    target: 40,
    sets: [],
    completed: true,
    difficulty: "easy",
  }));
  assert.equal(analysis.analyze(h, "2026-11-08", 40).suggested, 42);
  assert.equal(analysis.analyze(h, "2026-11-08", 42).suggested, null);
});
test("arm targets persist through reload and keep the 15-minute budget", () => {
  const first = storeWith({});
  first.store.completeOnboarding(40);
  first.store.regenerateDumbbells(12);
  const raw = first.store.exportBackup();
  const second = storeWith({ "push-pal:state:v2": raw });
  const s = second.store.useAppState(),
    d = s.plan.find((d) => d.training === "dumbbells");
  assert.equal(d.sets[0], 12);
  assert.ok(Math.abs(plan.estimateSeconds(d) - 900) <= 2);
});
