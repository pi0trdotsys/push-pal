/**
 * PUSH — model 30-dniowego planu pompek.
 *
 * Moduł jest czysty: brak I/O, brak `Date.now()` / `Math.random()` w zakresie
 * modułu (wymóg runtime'u Workers). Datę startu przekazuje wywołujący.
 */

/** Warianty progresji, z których generowany jest plan. */
export type PlanVariant = "base" | "hypertrophy" | "max";

/** Metadane wariantu pokazywane w edytorze planu. */
export type PlanVariantMeta = {
  id: PlanVariant;
  /** Krótka nazwa widoczna w UI. */
  name: string;
  /** Jedno zdanie opisu charakteru wariantu. */
  hint: string;
  /** Liczba serii w dniu treningowym. */
  sets: number;
  /** Przerwa między seriami w sekundach. */
  rest: number;
  /** Indeksy dni tygodnia planu (0-6 w cyklu 7-dniowym), które są wolne. */
  offDays: number[];
  /** Przyrost dziennego wolumenu na tydzień (mnożnik). */
  weeklyGain: number;
};

/** Pojedynczy dzień planu. */
export type DayPlan = {
  /** 1-indeksowany numer dnia planu (1..30). */
  day: number;
  /** Data w formacie ISO `YYYY-MM-DD`. */
  date: string;
  /** Powtórzenia w kolejnych seriach; pusta tablica = dzień wolny. */
  sets: number[];
  /** Przerwa między seriami w sekundach. */
  rest: number;
  /**
   * `true` gdy użytkownik edytował dzień ręcznie — generator go nie nadpisuje.
   */
  manual: boolean;
};

export const PLAN_VARIANTS: PlanVariantMeta[] = [
  {
    id: "base",
    name: "Base",
    hint: "Objętość bazowa, technika, dwa dni wolne w tygodniu.",
    sets: 4,
    rest: 60,
    offDays: [3, 6],
    weeklyGain: 1.12,
  },
  {
    id: "hypertrophy",
    name: "Hypertrophy",
    hint: "Więcej serii, krótsze przerwy, czas pod napięciem.",
    sets: 5,
    rest: 45,
    offDays: [6],
    weeklyGain: 1.1,
  },
  {
    id: "max",
    name: "Max Effort",
    hint: "Mniej powtórzeń, długie przerwy, siła maksymalna.",
    sets: 5,
    rest: 120,
    offDays: [2, 5],
    weeklyGain: 1.08,
  },
];

export const DEFAULT_VARIANT: PlanVariant = "base";
export const DEFAULT_VOLUME = 40;
export const PLAN_LENGTH = 30;

const WEEKDAYS = ["ndz", "pon", "wt", "śr", "czw", "pt", "sob"] as const;

/** Skrót dnia tygodnia (pl) dla daty ISO. */
export function weekdayLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`);
  return WEEKDAYS[d.getDay()] ?? "";
}

/** Data ISO przesunięta o `offset` dni od `startIso`. */
export function addDays(startIso: string, offset: number): string {
  const d = new Date(`${startIso}T00:00:00`);
  d.setDate(d.getDate() + offset);
  return toIso(d);
}

/** `Date` -> `YYYY-MM-DD` w czasie lokalnym. */
export function toIso(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Suma powtórzeń w dniu. */
export function dayVolume(d: DayPlan): number {
  return d.sets.reduce((a, b) => a + b, 0);
}

/** Czy dzień jest wolny. */
export function isRestDay(d: DayPlan): boolean {
  return d.sets.length === 0;
}

/** Rozbija dzienny wolumen na `count` serii z lekkim spadkiem pod koniec. */
function splitSets(volume: number, count: number): number[] {
  const weights = Array.from({ length: count }, (_, i) => 1 - i * 0.07);
  const total = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map((w) => Math.max(1, Math.round((volume * w) / total)));
  // korekta zaokrągleń na pierwszej serii
  const diff = volume - raw.reduce((a, b) => a + b, 0);
  raw[0] = Math.max(1, (raw[0] ?? 1) + diff);
  return raw;
}

/**
 * Generuje 30 dni planu.
 *
 * @param startIso data dnia 1 (`YYYY-MM-DD`)
 * @param variant wariant progresji
 * @param startVolume dzienny wolumen w pierwszym tygodniu
 * @param keep dni oznaczone jako `manual` zostają zachowane bez zmian
 */
export function generatePlan(
  startIso: string,
  variant: PlanVariant,
  startVolume: number,
  keep: DayPlan[] = [],
): DayPlan[] {
  const meta = PLAN_VARIANTS.find((v) => v.id === variant) ?? PLAN_VARIANTS[0]!;
  const manualByDay = new Map(keep.filter((d) => d.manual).map((d) => [d.day, d]));

  return Array.from({ length: PLAN_LENGTH }, (_, i) => {
    const day = i + 1;
    const kept = manualByDay.get(day);
    if (kept) return { ...kept, date: addDays(startIso, i) };

    const week = Math.floor(i / 7);
    const isDeload = week === 3;
    const cycleDay = i % 7;
    const off = meta.offDays.includes(cycleDay);

    const scale = isDeload ? 0.8 : Math.pow(meta.weeklyGain, week);
    const volume = Math.round(startVolume * scale);

    return {
      day,
      date: addDays(startIso, i),
      sets: off ? [] : splitSets(volume, meta.sets),
      rest: meta.rest,
      manual: false,
    };
  });
}
