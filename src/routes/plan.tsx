import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DayRow } from "@/components/day-row";
import { PlanEditor } from "@/components/plan-editor";
import { CalendarOptions } from "@/components/calendar-options";
import { useRepSensor, type SensorKind } from "@/hooks/use-rep-sensor";
import { useNativeRepSensorSource } from "@/lib/native-sensor";
import {
  regeneratePlan,
  setSensorKind,
  setThreshold,
  useAppState,
  exportBackup,
  restoreBackup,
  regenerateDumbbells,
} from "@/lib/session-store";
export const Route = createFileRoute("/plan")({ component: PlanPage });
function PlanPage() {
  const app = useAppState(),
    [openDay, setOpenDay] = useState<number | null>(null),
    [message, setMessage] = useState(""),
    [importRaw, setImportRaw] = useState<string | null>(null);
  const source = useNativeRepSensorSource(app.sensorKind),
    test = useRepSensor({ kind: app.sensorKind, threshold: app.threshold, source });
  function download() {
    const url = URL.createObjectURL(new Blob([exportBackup()], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `push-pal-${app.today}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <main className="page space-y-8">
      <header>
        <p className="eyebrow text-accent">PUSH / Twój rytm</p>
        <h1 className="text-3xl font-bold mt-3">Plan i ustawienia</h1>
      </header>
      <PlanEditor variant={app.variant} volume={app.volume} onChange={regeneratePlan} />
      <CalendarOptions />
      <section className="panel space-y-4">
        <h2 className="text-xl font-semibold">Cel treningu z hantlami</h2>
        <label className="block text-sm">
          Powtórzenia w każdej z 6 serii: <strong>{app.dumbbellReps}</strong>
          <input
            className="w-full mt-4 accent-[var(--accent)]"
            type="range"
            min="6"
            max="15"
            value={app.dumbbellReps}
            onChange={(e) => regenerateDumbbells(Number(e.target.value))}
          />
        </label>
        <p className="text-xs text-muted-foreground">
          Barki, biceps i triceps: po 2 serie. Ciężar wpiszesz osobno podczas ćwiczenia.
        </p>
      </section>
      <section className="panel space-y-5">
        <h2 className="text-xl font-semibold">Liczenie pompek</h2>
        <p className="text-sm text-muted-foreground">
          Tryb ręczny działa zawsze. Automatyczne liczenie przetestuj w pozycji, w której ćwiczysz:
          wykonaj 3 próbne ruchy i porównaj wynik. Czujnik zbliżeniowy nie wymaga magnesu;
          magnetometr wymaga odpowiedniego akcesorium.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {(["proximity", "hall"] as SensorKind[]).map((k) => (
            <button
              key={k}
              className={`secondary-button ${k === app.sensorKind ? "selected" : ""}`}
              onClick={() => {
                test.reset();
                setSensorKind(k);
              }}
            >
              {k === "hall" ? "Magnetometr" : "Zbliżeniowy"}
            </button>
          ))}
        </div>
        <label className="block text-sm">
          Próg sygnału: {app.threshold}
          <input
            type="range"
            min="3"
            max="16"
            value={app.threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full accent-[var(--accent)] mt-4"
          />
        </label>
        <p className="text-xs text-muted-foreground">
          Skala umowna, nie pomiar odległości w milimetrach.
        </p>
        {source ? (
          <>
            <button
              className="secondary-button w-full"
              onClick={() => (test.status === "running" ? test.pause() : test.start())}
            >
              {test.status === "running" ? "Zatrzymaj test" : "Uruchom test czujnika"}
            </button>
            <p aria-live="polite">
              Wykryte: <strong>{test.reps}</strong> · Sygnał: {test.distance.toFixed(1)}
            </p>
            <button className="text-sm text-muted-foreground" onClick={test.reset}>
              Wyzeruj test
            </button>
          </>
        ) : (
          <p className="notice">
            Test czujnika jest dostępny w aplikacji Android. Tutaj używaj liczenia ręcznego.
          </p>
        )}
        {test.error && (
          <p role="alert" className="notice">
            {test.error}
          </p>
        )}
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-3">Najbliższe 30 dni</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Plan przesuwa się wraz z kalendarzem. Dotknij dnia, aby zmienić serie.
        </p>
        <ul>
          {app.plan.map((d) => (
            <DayRow
              key={d.date}
              plan={d}
              isToday={d.date === app.today}
              open={openDay === d.day}
              onToggle={() => setOpenDay(openDay === d.day ? null : d.day)}
            />
          ))}
        </ul>
      </section>
      <section className="panel space-y-4">
        <h2 className="text-xl font-semibold">Twoje dane</h2>
        <p className="text-sm text-muted-foreground">
          Historia pozostaje na tym urządzeniu. Zapisz kopię, zanim usuniesz aplikację lub dane
          przeglądarki.
        </p>
        <button className="secondary-button w-full" onClick={download}>
          Eksportuj kopię JSON
        </button>
        <label className="secondary-button cursor-pointer">
          Wybierz kopię do przywrócenia
          <input
            className="sr-only"
            type="file"
            accept="application/json,.json"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 5_000_000) {
                setMessage("Plik jest za duży (maks. 5 MB).");
                return;
              }
              try {
                setImportRaw(await file.text());
                setMessage("");
              } catch {
                setMessage("Nie udało się odczytać pliku.");
              }
              e.target.value = "";
            }}
          />
        </label>
        {importRaw !== null && (
          <div className="notice space-y-3">
            <p>Przywrócenie zastąpi bieżący plan i historię danymi z kopii.</p>
            <button
              className="secondary-button"
              onClick={() => {
                try {
                  restoreBackup(importRaw);
                  setMessage("Kopia została przywrócona.");
                  setImportRaw(null);
                } catch {
                  setMessage("Nieprawidłowa kopia. Obecne dane pozostają bez zmian.");
                }
              }}
            >
              Przywróć dane
            </button>
            <button className="secondary-button ml-2" onClick={() => setImportRaw(null)}>
              Anuluj
            </button>
          </div>
        )}
        {message && (
          <p role="status" className="text-sm">
            {message}
          </p>
        )}
      </section>
    </main>
  );
}
