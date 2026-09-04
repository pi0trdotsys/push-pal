/**
 * PUSH — most do natywnej wtyczki Capacitor `RepSensor`.
 *
 * Implementacja Kotlin (`android/app/.../repsensor/RepSensorPlugin.kt`) słucha
 * Android `Sensor.TYPE_MAGNETIC_FIELD` (Hall) albo `Sensor.TYPE_PROXIMITY`
 * i strumieniuje znormalizowany sygnał w tej samej skali co symulacja
 * (`useRepSensor`), żeby cała logika zliczania powtórzeń (próg, tempo,
 * stabilność) została identyczna na webie i na urządzeniu.
 *
 * Na webie / w podglądzie Lovable `Capacitor.isNativePlatform()` zwraca
 * `false` i nikt tej wtyczki nie woła — `useRepSensor` spada wtedy na
 * wbudowaną symulację.
 */
import { useMemo } from "react";
import { registerPlugin, Capacitor } from "@capacitor/core";
import type { RepSensorSource, SensorKind } from "@/hooks/use-rep-sensor";

type ReadingEvent = { distance: number };

type RepSensorPlugin = {
  start: (opts: { kind: SensorKind }) => Promise<void>;
  stop: () => Promise<void>;
  addListener: (
    eventName: "reading",
    listener: (event: ReadingEvent) => void,
  ) => Promise<{ remove: () => void }> & { remove?: () => void };
};

let plugin: RepSensorPlugin | null = null;

function getPlugin(): RepSensorPlugin | null {
  if (!Capacitor.isNativePlatform()) return null;
  if (!plugin) {
    plugin = registerPlugin<RepSensorPlugin>("RepSensor");
  }
  return plugin;
}

/** Czy w tym środowisku w ogóle warto pytać o realny czujnik (jesteśmy w apce natywnej). */
export function isNativeSensorAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Tworzy `RepSensorSource` podpięty do natywnego czujnika telefonu.
 * Zwraca `null` poza platformą natywną (web) — wołający ma wtedy przekazać
 * `source: null` do `useRepSensor`, co włącza symulację.
 */
export function createNativeRepSensorSource(kind: SensorKind): RepSensorSource | null {
  const p = getPlugin();
  if (!p) return null;

  return {
    kind,
    subscribe(onSample) {
      let handle: { remove: () => void } | null = null;
      let cancelled = false;

      p.start({ kind }).catch((err) => console.error("RepSensor.start failed", err));
      Promise.resolve(p.addListener("reading", (event) => onSample({ distance: event.distance })))
        .then((h) => {
          if (cancelled) h.remove();
          else handle = h;
        })
        .catch((err) => console.error("RepSensor.addListener failed", err));

      return () => {
        cancelled = true;
        handle?.remove();
        p.stop().catch(() => {});
      };
    },
  };
}

/**
 * Wersja hookowa: memoizuje `RepSensorSource` po `kind`, żeby `useRepSensor`
 * nie resubskrybowywał czujnika przy każdym renderze. Zwraca `null` na webie.
 */
export function useNativeRepSensorSource(kind: SensorKind): RepSensorSource | null {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => createNativeRepSensorSource(kind), [kind]);
}
