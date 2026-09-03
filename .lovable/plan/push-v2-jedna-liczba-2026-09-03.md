# PUSH v2 — "Jedna liczba"

Przeprojektowanie na maksymalny minimalizm: podczas ćwiczenia na ekranie jest wyłącznie licznik. Wszystko inne (plan 30 dni, historia, AI) chowa się poza trybem treningu.

Zakres: **same makiety w TypeScript**, dane w pamięci (znikają po odświeżeniu), pełna dokumentacja pod dalszą implementację. Bez backendu, bez localStorage, bez realnych wywołań AI.

## Ekrany

**1. `/` — Dziś**
Jeden ekran, trzy elementy: data + numer dnia planu, cel dnia (np. `48` powtórzeń w 4 seriach), duży przycisk `START`. Pod spodem cienka linia 7 kropek (ostatni tydzień: zrobione / pominięte). Nic więcej.

**2. `/session` — Tryb ćwiczenia (pełny ekran)**
Czarny ekran, bez nawigacji, bez paska statusu aplikacji:
- gigantyczna cyfra licznika powtórzeń (ok. 40vw, tabular-nums), rosnąca z czujnika
- pod nią jedna cienka linia postępu serii
- mikro-podpis `SERIA 2/4` w kolorze przygaszonym
- przerwa: ta sama cyfra zamienia się w odliczanie sekund, linia postępu maleje
- koniec: krótkie podsumowanie (suma / czas), jeden przycisk `ZAKOŃCZ`
- tap na ekran = pauza/wznowienie; długie przytrzymanie = przerwij

**3. `/plan` — Plan 30 dni (edytowalny)**
Lista 30 wierszy: `D01 · pon · 48` — dzień, dzień tygodnia, liczba powtórzeń. Edycja:
- tap na wiersz rozwija inline edytor: liczba serii i powtórzenia w każdej serii, przycisk „dzień wolny"
- na górze generator: wybór wariantu bazowego (Base / Hypertrophy / Max Effort) + suwak startowego wolumenu → przelicza całe 30 dni progresją
- pojedyncze dni edytowane ręcznie zostają oznaczone jako „ręczne" i generator ich nie nadpisuje (bez potwierdzenia)

**4. `/insights` — AI (zaślepka)**
- pole konfiguracji lokalnego modelu: URL endpointu (domyślnie `http://localhost:11434`), nazwa modelu, przycisk „Sprawdź połączenie" (w makiecie zawsze zwraca stan offline)
- lista mockowych podpowiedzi w formie zwykłych zdań (np. „Tempo spada w serii 3 — rozważ +15 s przerwy")
- przycisk „Analizuj ostatnie 7 dni" pokazuje stan ładowania i mockowy wynik

Nawigacja: trzy słowa tekstem u dołu (`DZIŚ · PLAN · AI`), ukryte w trybie sesji. Bez ikon.

## Czujnik zbliżeniowy

Zostaje warstwa abstrakcji `RepSensorSource` (obecna w projekcie), uproszczona:
- `useRepSensor` symuluje strumień dystansu i zwraca tylko `{ reps, active, start, pause, reset }` — telemetria (tempo, stabilność, dystans) przestaje być pokazywana w UI, ale nadal jest liczona i dostępna w danych sesji
- kalibracja progu przenosi się do `/plan` → sekcja „Czujnik" (jeden suwak + podgląd wykrycia jako mrugnięcie kropki)

## Co znika

`SensorDial`, `WeekChart`, `SeriesTimeline`, ekran `/archive` w obecnej formie, panel telemetrii, badge'y i etykiety typu `SYSTEM.ACTIVE`, `KINETIC_03`. Historia sesji redukuje się do rzędu kropek na ekranie „Dziś".

## Szczegóły techniczne

- Paleta: czysta czerń `#000`, biel, jeden przygaszony szary. Akcent zieleni tylko jako stan „zrobione" — sam licznik jest biały (mniej rozprasza). Tryb Dim usunięty (full OLED).
- Typografia: jeden krój (Inter) w skrajnych wagach — licznik ExtraBold, podpisy Regular z szerokim trackingiem. JetBrains Mono zostaje tylko dla numerów dni w planie.
- Nowe pliki: `src/lib/plan-30.ts` (typy `DayPlan`, generator progresji, 30 dni), `src/lib/session-store.ts` (stan sesji na `useReducer`), `src/lib/ai-client.ts` (typowany interfejs `AiAdvisor` + implementacja mock, gotowa do zamiany na fetch do lokalnego Ollama), komponenty `RepCounter`, `DayRow`, `PlanEditor`, `AiPanel`, `MiniStreak`.
- Zmiana istniejących: `src/routes/index.tsx`, `src/routes/config.tsx` → `plan.tsx`, `archive.tsx` usunięty, `__root.tsx` (tekstowa nawigacja + ukrywanie w sesji), `src/styles.css` (usunięcie `.dim`, redukcja tokenów).
- Dokumentacja: `README.md` z opisem architektury i punktów wpięcia oraz `docs/IMPLEMENTATION.md` — kontrakty typów, miejsce podpięcia realnego `ProximitySensor`, kontrakt `AiAdvisor` (prompt, kształt wejścia/wyjścia), lista TODO do trwałego zapisu danych. Komentarze JSDoc na każdym publicznym typie i hooku.
- Każda trasa ma własne `head()` z tytułem i opisem; `/session` z `robots: noindex`.
