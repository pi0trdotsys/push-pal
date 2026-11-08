# PUSH — osobisty plan treningowy

Aplikacja React + TypeScript, dostępna jako web oraz Android (Capacitor).
Treningi działają offline; konto i model AI nie są wymagane.

## Codzienny rytm

- Pompki co drugi dzień: 5 serii dopasowanych do zadeklarowanych możliwości.
- Pomiędzy pompkami hantle: barki, biceps i triceps, po 2 serie.
- Domyślnie 10 powtórzeń w serii z hantlami, regulowane w zakresie 6–15.
- Rozgrzewka 2 min, kontrolowane powtórzenia, przerwy dopasowane do budżetu
  około 15 min, wyciszenie 1 min. To szacunek czasu, a nie limit sesji.
- Dzień wolny można ustawić ręcznie w Planie; brak kar i nadrabiania zaległości.
- W weekend opcjonalny orbitrek, bieganie, wędrówka lub rower z zapisem czasu.

## Sesja i dane

Każde ćwiczenie ma własny schemat animowany SVG, pozycję Start/Koniec,
instrukcję krok po kroku, liczbę powtórzeń oraz link do pełnej demonstracji.
Animacje i opisy są zapisane w aplikacji i działają offline; zewnętrzne
materiały wymagają internetu. Uwzględniamy preferencję ograniczenia animacji.

W trybie ręcznym wpisujesz lub korygujesz wykonane powtórzenia i ciężar
jednego hantla. W prostowaniu ramion oburącz używasz jednego hantla.
Automatyczne liczenie pompek jest opcją w Androidzie: czujnik zbliżeniowy
albo magnetometr z odpowiednim akcesorium magnetycznym. Próg ma skalę
umowną, nie jest pomiarem milimetrów. Test czujnika uruchamiasz w Planie.
W przeglądarce nie ma symulacji zaliczającej fikcyjne pompki.

Postęp zapisujemy przy każdej zmianie i co 5 sekund aktywnej sesji.
Po wyjściu do tła lub ponownym otwarciu trening jest w pauzie. Awaryjny
restart odzyskuje czas do ostatniego punktu zapisu. Serie wymagają jawnego
zatwierdzenia. Wcześniejsze zakończenie zachowuje częściowy wynik.
Zapis sesji jest idempotentny po identyfikatorze.

Stan `push-pal:state:v2` jest walidowany przez Zod. Import v1 zachowuje historię;
stary zapis pozostaje dostępny. Historia nie ma limitu 60 sesji. Eksport i import
JSON są w Planie. Import zastępuje dane dopiero po potwierdzeniu w aplikacji.
Uszkodzony rekord jest kopiowany pod klucz `push-pal:recovery:<timestamp>`,
jeżeli zapis jest dostępny. Brak dostępu do pamięci pokazuje ostrzeżenie.

## Postępy

Analiza lokalna rozdziela pompki, hantle i aktywności dodatkowe. Pokazuje dane
z ostatnich 7 dni oraz historię serii. Po trzech porównywalnych sesjach proponuje
małą zmianę celu, wymagającą akceptacji. Zapisane sesje i ręcznie zmienione dni
nie są przepisywane. Kolejna propozycja wymaga wyników dla aktualnego celu.
Nie generujemy obserwacji o tempie ani technice bez danych pomiarowych.

## Widget Android

Natywny `TrainingWidgetProvider` obsługuje zmianę rozmiaru w obu kierunkach.
Na Androidzie 12+ udostępnia zestaw responsywnych układów; starsze wersje
korzystają z rozmiarów podanych przez launcher. Minimalny obszar: 100 × 80 dp.
Wyświetla rodzaj treningu, cel, czas, opcję startu/wznowienia i — na dużym
obszarze — tygodniową sumę. Kliknięcie prowadzi do przygotowania treningu,
nie uruchamia samodzielnie licznika.

Dane są przekazywane do SharedPreferences przez `TrainingWidgetPlugin`.
Widget odczytuje je także przy zamkniętej aplikacji. Odświeża się po zapisach,
na żądanie systemu co około 30 min oraz po zmianie daty/czasu/strefy.
System może opóźnić odświeżenie. Po końcu zapisanego okna widget wylicza
kolejne dni na podstawie początku rytmu i celów.

## Kalendarz telefonu

Plan → Kalendarz: wybierz lokalną godzinę treningu.

- Android: „Dodaj dzisiejszy trening” otwiera systemowy edytor wydarzenia.
  Użytkownik sprawdza termin, przypomnienie i zapisuje wydarzenie. Aplikacja
  nie żąda dostępu do odczytu ani zapisu kalendarza.
- Web: pobranie wydarzenia w formacie `.ics`.
- Eksport 30 dni `.ics` zawiera daty, rodzaje ćwiczeń, serie, powtórzenia i przerwy;
  pomija ręcznie ustawione dni wolne. Android otwiera arkusz udostępniania.
- Opcjonalne przypomnienie 15 min wcześniej jest zapisane w eksporcie ICS.
  W natywnym edytorze należy sprawdzić jego ustawienie.
- To eksport, a nie synchronizacja. Późniejsze zmiany planu nie zmieniają
  istniejących wydarzeń. Godziny ICS są lokalne w kalendarzu importującym.

## Uruchomienie i weryfikacja

```powershell
npm ci
npm run dev:mobile
npm test
npm run typecheck
npm run lint
npm run build:mobile
npm run build
```

`npm run dev` uruchamia wariant web SSR. Statyczny build mobilny trafia do
`dist-mobile/`. Do Androida potrzebne są JDK 21 i Android SDK (compileSdk 36):

```powershell
npm run android
cd android
.\gradlew.bat assembleDebug
```

APK: `android/app/build/outputs/apk/debug/app-debug.apk`.

Przed wydaniem na telefon należy sprawdzić: oba czujniki (w tym brak czujnika),
przejście do tła i ubicie procesu, wznowienie, mały/szeroki/wysoki widget,
zmianę daty, start z widgetu, edytor kalendarza i import ICS. Testy JavaScript
nie zastępują tych testów urządzenia.

## Źródła opisów techniki

Własne opisy i schematy opracowano z odniesieniem do:

- [ACE — Lateral Raise](https://www.acefitness.org/resources/everyone/exercise-library/26/lateral-raise/)
- [Catalyst Athletics — Hammer Curl](https://www.catalystathletics.com/exercise/841/Hammer-Curl/)
- [ACE — Triceps Extension](https://www.acefitness.org/resources/everyone/exercise-library/74/triceps-extension/)
- [ACE — Push-up](https://www.acefitness.org/resources/everyone/exercise-library/41/push-up/)

Schematy są uproszczone; pełne demonstracje są podlinkowane przy ćwiczeniach.

## Lovable

Projekt pozostaje zgodny z dotychczasowym podziałem: wspólne trasy i logika,
web SSR oraz statyczna powłoka Androida. Nie przepisuj opublikowanej historii
Git projektu połączonego z Lovable (patrz AGENTS.md).

## Weryfikacja na telefonie

Aplikacja została zbudowana, zainstalowana i sprawdzona na Xiaomi z Androidem 16.
Testy urządzenia przechodzą; naprawiono wykryty w nich błąd dat kalendarza.
[Szczegółowy raport i zakres testów](docs/testing/android-device-2026-11-08.md).
Opcjonalne `java.home=` w `android/local.properties` wskazuje JDK dla
`npm run android:apk`, bez zmieniania globalnych ustawień Javy.
