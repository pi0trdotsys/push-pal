import type { SessionResult } from "./session-store";
import { addDays } from "./plan-30";
export function analyze(history: SessionResult[], today: string, volume: number) {
  const week = history.filter(
    (h) => h.training === "pushups" && h.date >= addDays(today, -6) && h.date <= today,
  );
  const recent = history
    .filter((h) => h.training === "pushups" && h.date <= today && h.reps > 0)
    .slice(0, 3);
  const total = week.reduce((sum, h) => sum + h.reps, 0);
  let suggested: number | null = null,
    reason = "Po trzech ocenionych treningach zaproponujemy zmianę obciążenia.";
  if (
    recent.length === 3 &&
    recent.every((h) => h.completed && h.difficulty === "easy" && h.target === volume)
  ) {
    suggested = Math.min(120, volume + Math.max(1, Math.round(volume * 0.05)));
    reason =
      "Trzy ostatnie treningi ukończone i ocenione jako łatwe. Proponujemy niewielkie zwiększenie celu.";
  } else if (
    recent.length === 3 &&
    recent.every((h) => h.target === volume) &&
    recent.filter((h) => h.difficulty === "hard" || (!h.completed && h.reps > 0)).length >= 2
  ) {
    suggested = Math.max(5, Math.round(volume * 0.9));
    reason =
      "Co najmniej dwa z trzech ostatnich treningów były trudne lub niepełne. Proponujemy zmniejszenie celu.";
  } else if (recent.length === 3) {
    reason = "Ostatnie wyniki nie wskazują potrzeby zmiany. Utrzymaj obecny cel.";
  }
  if (suggested === volume) suggested = null;
  return { week, total, suggested, reason };
}

export function analyzeDumbbells(history: SessionResult[], today: string, reps: number) {
  const recent = history
    .filter((h) => h.training === "dumbbells" && h.date <= today && h.reps > 0)
    .slice(0, 3);
  const week = history.filter(
    (h) => h.training === "dumbbells" && h.date >= addDays(today, -6) && h.date <= today,
  );
  const comparable =
    recent.length === 3 &&
    recent.every(
      (h) =>
        h.sets.length === 6 &&
        h.sets.every(
          (s, i) =>
            s.weight !== null &&
            s.weight === recent[0]?.sets[i]?.weight &&
            s.exercise === recent[0]?.sets[i]?.exercise,
        ),
    );
  let suggested: number | null = null,
    reason =
      "Zapisuj powtórzenia, ciężar i ocenę. Po trzech porównywalnych sesjach z hantlami zaproponujemy zmianę liczby powtórzeń.";
  if (
    comparable &&
    recent.every((h) => h.completed && h.difficulty === "easy") &&
    recent.every((h) => h.sets.every((s) => s.target === reps))
  ) {
    suggested = Math.min(15, reps + 1);
    reason =
      "Trzy łatwe, ukończone sesje przy tych samych ciężarach. Proponujemy jedno powtórzenie więcej w każdej serii, bez zmiany ciężaru.";
  } else if (
    recent.length === 3 &&
    recent.filter((h) => h.difficulty === "hard").length >= 2 &&
    recent.every((h) => h.sets.every((s) => s.target === reps))
  ) {
    suggested = Math.max(6, reps - 1);
    reason =
      "Dwie z trzech ostatnich sesji z hantlami oceniono jako trudne. Proponujemy mniej powtórzeń; sprawdź również dobór ciężaru.";
  }
  if (suggested === reps) suggested = null;
  return { suggested, reason, total: week.reduce((a, h) => a + h.reps, 0), sessions: week.length };
}
