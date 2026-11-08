# Test telefonu — 8 listopada 2026

Urządzenie: Xiaomi 25102PCBEG, Android 16, USB ADB.

Narzędzia: SDK Platform 36, Build Tools 35.0.0 i 36.0.0, Platform Tools 37.0.1,
Eclipse Temurin JDK 21.0.13+9. Pobrane z Google / Eclipse Adoptium,
zweryfikowane sumami SHA-256. Instalacja lokalna w `.tools/` folderu tej rozmowy.
`android/local.properties` przechowuje ścieżki SDK i JDK i nie jest wersjonowany.

## Instalacja i dane

Stare APK miało inny certyfikat. Po zgodzie właściciela zabezpieczono stare APK
i dane, zastąpiono instalację oraz przywrócono dane. Kopia pozostaje lokalnie
w `.delivery/phone-backup/` folderu rozmowy, poza repozytorium. Tymczasowy pakiet
`com.pushpal.app.test` usunięto po testach.

## Wyniki

- `:app:assembleDebug :app:assembleDebugAndroidTest`: BUILD SUCCESSFUL.
- AndroidJUnitRunner / PushPalDeviceTest: OK (2 tests).
- Rzeczywisty WebView: utworzenie planu, rozpoczęcie sesji, 3 powtórzenia,
  przeładowanie, odzyskanie sesji w pauzie, zakończenie częściowe, ocena i zapis.
- Hantle: trzy ćwiczenia, serie, instrukcje i SVG animacji widoczne na telefonie.
- Natywny most: blokada wygaszania, odczyt startu z widgetu,
  start i zatrzymanie czujnika zbliżeniowego oraz magnetometru.
- Kalendarz: ACTION_INSERT, tytuł, początek i 15-minutowa długość wydarzenia.
  Test przechwytuje zamiar; nie zapisuje wydarzenia i nie otwiera zewnętrznej aplikacji.
- Android RemoteViews: renderowanie i układ dla 100×80, 220×80, 160×160, 240×220 dp.
- Testy przywracają stan aplikacji i widgetu; sztuczny trening nie pozostaje w historii.

## Naprawiony błąd

Całkowite milisekundy dat JSON docierają do Androida jako Long.
`PluginCall.getDouble()` nie odczytywało tych wartości, co dawało komunikat
„Nieprawidłowy termin”. Wtyczka używa teraz `optLong`; test potwierdza poprawne daty.

## Granice testu

Nie weryfikowano dokładności liczenia podczas fizycznych pompek ani kalibracji
w docelowym ułożeniu telefonu. Widget testowano w natywnym rendererze Androida,
bez dodawania go na pulpit. Nie zapisano prawdziwego wydarzenia w kalendarzu.

## Ponowny build

```powershell
npm ci
npm run android:apk
# Po dodaniu platform-tools do PATH:
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Skrypt odczytuje opcjonalne `java.home=` z `android/local.properties`,
bez zmieniania globalnej Javy używanej przez inne projekty.
