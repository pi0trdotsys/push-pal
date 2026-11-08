import { EXERCISES } from "@/lib/exercises";
import { ACTIVITY_NAMES } from "./weekend-card";
import { useAppState, regeneratePlan, regenerateDumbbells } from "@/lib/session-store";
import { analyze, analyzeDumbbells } from "@/lib/training-analysis";
export function AiPanel() {
  const app = useAppState(),
    data = analyze(app.history, app.today, app.volume),
    arms = analyzeDumbbells(app.history, app.today, app.dumbbellReps);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="panel">
          <p className="eyebrow">Pompki / 7 dni</p>
          <p className="text-4xl font-bold mt-3">
            {data.week.length}
            <span className="text-sm text-muted-foreground"> sesji</span>
          </p>
        </div>
        <div className="panel">
          <p className="eyebrow">Liczba pompek</p>
          <p className="text-4xl font-bold mt-3">{data.total}</p>
        </div>
      </div>
      <section className="panel space-y-4">
        <p className="eyebrow text-accent">Twój kolejny krok</p>
        <p>{data.reason}</p>
        {data.suggested !== null && (
          <button
            className="primary-button"
            onClick={() => regeneratePlan("base", data.suggested!)}
          >
            Zastosuj cel {data.suggested} pompek
          </button>
        )}
        <p className="text-xs text-muted-foreground">
          Analiza działa lokalnie, na podstawie wyników i Twoich ocen. Ręcznie zmienione dni
          pozostają bez zmian.
        </p>
      </section>
      <section className="panel space-y-4">
        <p className="eyebrow text-accent">Hantle / ostatnie 7 dni</p>
        <p className="text-2xl font-bold">
          {arms.sessions} sesji · {arms.total} powtórzeń
        </p>
        <p className="text-sm">{arms.reason}</p>
        {arms.suggested !== null && (
          <button className="primary-button" onClick={() => regenerateDumbbells(arms.suggested!)}>
            Zastosuj {arms.suggested} powtórzeń w serii
          </button>
        )}
      </section>
      <section>
        <h3 className="text-xl font-bold mb-4">Historia treningów</h3>
        {!app.history.length ? (
          <p className="text-muted-foreground">Pierwszy trening rozpocznie Twoją historię.</p>
        ) : (
          app.history.map((h) => (
            <article className="panel mb-3" key={h.id}>
              <div className="flex justify-between gap-3">
                <span>
                  {h.date} · {h.training === "dumbbells" ? "Hantle" : "Pompki"}
                </span>
                <strong>
                  {h.reps} / {h.target}
                </strong>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {Math.floor(h.seconds / 60)} min ·{" "}
                {h.completed ? "Ukończony" : "Zapisany wcześniej"}
                {h.difficulty
                  ? ` · ${h.difficulty === "easy" ? "Łatwo" : h.difficulty === "hard" ? "Trudno" : "W sam raz"}`
                  : ""}
              </p>
              {h.sets.length > 0 && (
                <p className="text-sm mt-2">
                  Serie:{" "}
                  {h.sets
                    .map(
                      (s) =>
                        `${EXERCISES[s.exercise].name}: ${s.reps}${s.weight !== null ? ` × ${s.weight} kg` : ""}`,
                    )
                    .join(" · ")}
                </p>
              )}
            </article>
          ))
        )}
      </section>
      <section>
        <h3 className="text-xl font-bold mb-4">Aktywności dodatkowe</h3>
        {!app.activities.length ? (
          <p className="text-sm text-muted-foreground">
            W weekend możesz zapisać orbitrek, bieg, wędrówkę lub rower.
          </p>
        ) : (
          app.activities.map((a) => (
            <p key={a.id} className="panel mb-3 text-sm">
              {a.date} · {ACTIVITY_NAMES[a.kind]} · {a.minutes} min
            </p>
          ))
        )}
      </section>
    </div>
  );
}
