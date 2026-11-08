import { useState } from "react";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { useAppState, todayPlan } from "@/lib/session-store";
import { buildCalendar, calendarTitle, calendarDescription, eventTimes } from "@/lib/calendar";
const calendar = registerPlugin<{
  addCalendarEvent(o: {
    title: string;
    description: string;
    start: number;
    end: number;
    reminder: boolean;
  }): Promise<void>;
  shareCalendar(o: { content: string }): Promise<void>;
}>("TrainingWidget");
function download(content: string, name: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function CalendarOptions() {
  const app = useAppState(),
    day = todayPlan(app),
    [time, setTime] = useState("18:00"),
    [reminder, setReminder] = useState(false),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const native = Capacitor.isNativePlatform();
  async function addToday() {
    setBusy(true);
    try {
      const times = eventTimes(day, time);
      if (native) {
        await calendar.addCalendarEvent({
          title: calendarTitle(day),
          description: calendarDescription(day),
          ...times,
          reminder,
        });
        setMessage("Otwarto kalendarz telefonu. Sprawdź termin i zapisz wydarzenie.");
      } else {
        download(buildCalendar([day], time, reminder), "push-trening.ics");
        setMessage("Pobrano wydarzenie. Otwórz plik w swoim kalendarzu.");
      }
    } catch {
      setMessage("Nie udało się otworzyć kalendarza. Użyj eksportu pliku .ics.");
    } finally {
      setBusy(false);
    }
  }
  async function exportPlan() {
    setBusy(true);
    try {
      const content = buildCalendar(app.plan, time, reminder);
      if (native) await calendar.shareCalendar({ content });
      else download(content, "push-plan-30-dni.ics");
      setMessage("Otwórz plik .ics w kalendarzu i potwierdź import.");
    } catch {
      setMessage("Nie udało się udostępnić pliku kalendarza.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel space-y-4">
      <h2 className="text-xl font-semibold">Kalendarz w telefonie</h2>
      <p className="text-sm text-muted-foreground">
        Wybierz godzinę. Możesz dodać dzisiejszy trening albo zaimportować najbliższe 30 dni. Zmiany
        planu w aplikacji nie aktualizują automatycznie kalendarza.
      </p>
      <label className="flex justify-between items-center text-sm">
        Godzina treningu
        <input
          className="number-input"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
      </label>
      <label className="flex items-center gap-3 text-sm">
        <input
          className="accent-[var(--accent)]"
          type="checkbox"
          checked={reminder}
          onChange={(e) => setReminder(e.target.checked)}
        />
        Przypomnienie 15 min wcześniej
      </label>
      <p className="text-xs text-muted-foreground">
        Godziny są lokalne. W edytorze telefonu sprawdź także ustawienie przypomnienia.
      </p>
      <button
        disabled={busy || !time || !day.sets.length}
        className="primary-button"
        onClick={() => void addToday()}
      >
        Dodaj dzisiejszy trening
      </button>
      <button
        disabled={busy || !time}
        className="secondary-button w-full"
        onClick={() => void exportPlan()}
      >
        Eksportuj 30 dni do kalendarza (.ics)
      </button>
      {message && (
        <p className="text-sm" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
