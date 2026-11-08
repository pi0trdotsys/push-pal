import { useState } from "react";
import { logWeekendActivity, useAppState, type WeekendActivity } from "@/lib/session-store";
export const ACTIVITY_NAMES = {
  elliptical: "Orbitrek",
  run: "Bieganie",
  hike: "Wędrówka",
  bike: "Rower",
} as const;
export function WeekendCard() {
  const app = useAppState(),
    [kind, setKind] = useState<WeekendActivity["kind"]>("hike"),
    [minutes, setMinutes] = useState(30),
    [saved, setSaved] = useState(false);
  const day = new Date(`${app.today}T12:00:00`).getDay();
  if (day !== 0 && day !== 6) return null;
  return (
    <section className="panel space-y-4">
      <p className="eyebrow text-accent">Weekend / opcjonalnie</p>
      <h2 className="text-xl font-bold">Zmień otoczenie.</h2>
      <p className="text-sm text-muted-foreground">
        Wybierz dodatkową aktywność w spokojnym tempie. Jeśli potrzebujesz regeneracji, możesz ją
        pominąć.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(ACTIVITY_NAMES) as WeekendActivity["kind"][]).map((k) => (
          <button
            className={`secondary-button ${k === kind ? "selected" : ""}`}
            key={k}
            onClick={() => {
              setKind(k);
              setSaved(false);
            }}
          >
            {ACTIVITY_NAMES[k]}
          </button>
        ))}
      </div>
      <label className="flex gap-4 items-center text-sm">
        Wykonany czas (min)
        <input
          className="number-input w-24"
          type="number"
          min="1"
          max="720"
          value={minutes}
          onChange={(e) => {
            setMinutes(Number(e.target.value));
            setSaved(false);
          }}
        />
      </label>
      <button
        className="secondary-button w-full"
        disabled={saved || !Number.isInteger(minutes) || minutes < 1 || minutes > 720}
        onClick={() => {
          logWeekendActivity(kind, minutes);
          setSaved(true);
        }}
      >
        {saved ? "Aktywność zapisana" : "Zapisz wykonaną aktywność"}
      </button>
    </section>
  );
}
