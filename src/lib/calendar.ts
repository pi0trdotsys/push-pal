import { dayVolume, estimateSeconds, exerciseFor, type DayPlan } from "./plan-30";
import { EXERCISES } from "./exercises";
export function calendarDescription(day: DayPlan): string {
  const lines = day.sets.map(
    (n, i) => `Seria ${i + 1}: ${EXERCISES[exerciseFor(day, i)].name} — ${n} powt.`,
  );
  return [
    `Rozgrzewka: 2 min.`,
    ...lines,
    `Przerwy: ${day.rest} s. Wyciszenie: 1 min.`,
    `Planowany czas: około ${Math.round(estimateSeconds(day) / 60)} min.`,
    `Ciężar dobierz do poprawnej techniki. Plan możesz zmienić w Push Pal.`,
  ].join("\n");
}
export function calendarTitle(day: DayPlan): string {
  return day.training === "dumbbells"
    ? "PUSH · Hantle — barki, biceps i triceps"
    : `PUSH · Pompki — ${dayVolume(day)} powtórzeń`;
}
export function eventTimes(day: DayPlan, time: string) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw Error("Nieprawidłowa godzina");
  const start = new Date(`${day.date}T${time}:00`);
  if (!Number.isFinite(start.getTime())) throw Error("Nieprawidłowa data");
  return { start: start.getTime(), end: start.getTime() + estimateSeconds(day) * 1000 };
}
function escape(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}
function fold(line: string) {
  let result = "",
    bytes = 0;
  const encoder = new TextEncoder();
  for (const char of line) {
    const length = encoder.encode(char).length;
    if (bytes + length > 75) {
      result += "\r\n ";
      bytes = 1;
    }
    result += char;
    bytes += length;
  }
  return result;
}
function localStamp(ms: number) {
  const d = new Date(ms);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}00`;
}
export function buildCalendar(
  days: DayPlan[],
  time: string,
  reminder = false,
  now = new Date(),
): string {
  const stamp = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Push Pal//Training Calendar//PL",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:PUSH — treningi",
  ];
  for (const day of days.filter((d) => d.sets.length)) {
    const { start, end } = eventTimes(day, time);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${day.date}-${day.training}@push-pal.local`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${localStamp(start)}`,
      `DTEND:${localStamp(end)}`,
      `SUMMARY:${escape(calendarTitle(day))}`,
      `DESCRIPTION:${escape(calendarDescription(day))}`,
      "TRANSP:TRANSPARENT",
    );
    if (reminder)
      lines.push(
        "BEGIN:VALARM",
        "TRIGGER:-PT15M",
        "ACTION:DISPLAY",
        "DESCRIPTION:Trening PUSH za 15 minut",
        "END:VALARM",
      );
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
