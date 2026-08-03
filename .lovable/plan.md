# PUSH — makiety aplikacji do treningu pompek

Kierunek: **Sequential State Timeline** — czysta czerń OLED (#000), jeden akcent (zielony #22c55e), Inter + JetBrains Mono, hairline bordery, ostre rogi. Format mobilny (390px), wyśrodkowany na desktopie.

Zakres: **same makiety w TypeScript** — bez backendu, bez logowania, bez trwałego zapisu. Pomiar powtórzeń jest **symulowany** (mock strumienia czujnika), z warstwą abstrakcji gotową na podpięcie prawdziwego czujnika później.

## Ekrany

**1. `/` — Monitor (główny)**
Wierna implementacja wybranego kierunku:
- Sticky nav: `SYSTEM.ACTIVE` / `KINETIC_03` + pulsująca kropka
- Timeline serii: karty stanów DONE / CURRENT / PENDING połączone pionową linią, aktywna karta z licznikiem `08 / 12` i paskiem postępu
- Panel telemetrii czujnika: koncentryczne pierścienie ze skanującą linią, dystans w mm, TEMPO, STABILITY, badge `CALIBRATED`
- Wykres tygodnia (7 słupków, MON–SUN) + `+12% vs LW`
- Duży przycisk `START SERIES_XX`
- Dolna nawigacja: Monitor / Archive / Config

**2. `/archive` — Historia**
Lista sesji w tym samym języku wizualnym: data, liczba powtórzeń, czas trwania, średnie tempo, oznaczenia rekordów. Prosty wykres 30 dni ze słupków div (bez biblioteki).

**3. `/config` — Ustawienia + plan**
- Wybór planu treningowego: 3 warianty (Base / Hypertrophy / Max Effort) jako karty stanów, z rozpisaną progresją tygodniową
- Kalibracja czujnika: wybór źródła (Proximity / Hall), próg wykrycia (suwak), test detekcji na żywo
- Przełącznik OLED (true black) vs Dim

## Symulacja czujnika

Hook `useRepSensor` udaje strumień czujnika:
- generuje dystans oscylujący 2–20 mm w rytmie ~1.2 s/rep
- przecięcie progu w dół = zaliczone powtórzenie → impuls świetlny na kropce + inkrementacja licznika
- eksponuje `{ distance, reps, tempo, stability, status, start, pause, reset }`
- interfejs `RepSensorSource` jako punkt wpięcia realnego `ProximitySensor` w przyszłości

Sesja jest sterowana lokalnym stanem (`useReducer`) — start serii, auto-przejście do przerwy, odliczanie odpoczynku, przejście do kolejnej serii, ekran podsumowania po ostatniej serii.

## Szczegóły techniczne

- Tokeny z prototypu (`--color-accent: #22c55e`, hairline `rgba(255,255,255,0.08)`, `--ease-out-expo`, keyframes `pulse-ring` / `slide-up`) trafiają do `src/styles.css`; ciemny motyw domyślny, wartości OLED jako `:root`
- Fonty Inter + JetBrains Mono ładowane przez `<link>` w `src/routes/__root.tsx`
- Trasy: `src/routes/index.tsx` (nadpisanie placeholdera), `archive.tsx`, `config.tsx`; wspólna dolna nawigacja i shell w `__root.tsx`
- Komponenty: `SeriesTimeline`, `SeriesCard`, `SensorDial`, `WeekChart`, `BottomNav`, `PlanCard`, `SessionSummary`
- Dane treningowe jako typowane stałe w `src/lib/training-plans.ts`
- Każda trasa dostaje własne `head()` z tytułem i opisem
- Podgląd przełączam na widok mobilny
