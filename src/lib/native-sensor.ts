import { useMemo } from "react";
import { Capacitor, registerPlugin } from "@capacitor/core";
import type { RepSensorSource, SensorKind } from "@/hooks/use-rep-sensor";
type Plugin = {
  start(o: { kind: SensorKind }): Promise<void>;
  stop(): Promise<void>;
  addListener(
    name: "reading",
    fn: (event: { distance: number }) => void,
  ): Promise<{ remove(): Promise<void> }>;
};
const plugin = registerPlugin<Plugin>("RepSensor");
let lifecycle = Promise.resolve();
export function isNativeSensorAvailable() {
  return Capacitor.isNativePlatform();
}
export function createNativeRepSensorSource(kind: SensorKind): RepSensorSource | null {
  if (!isNativeSensorAvailable()) return null;
  return {
    kind,
    subscribe(onSample, onError) {
      let cancelled = false;
      let handle: { remove(): Promise<void> } | null = null;
      // Serialize setup/teardown so a late start cannot resurrect a stopped sensor.
      lifecycle = lifecycle
        .then(async () => {
          if (cancelled) return;
          handle = await plugin.addListener("reading", (e) => {
            if (!cancelled) onSample(e);
          });
          if (!cancelled) await plugin.start({ kind });
        })
        .catch(() => {
          if (!cancelled)
            onError("Czujnik jest niedostępny. Wybierz tryb ręczny lub drugi czujnik.");
        });
      return () => {
        cancelled = true;
        lifecycle = lifecycle
          .then(async () => {
            await handle?.remove();
            await plugin.stop();
          })
          .catch(() => {});
      };
    },
  };
}
export function useNativeRepSensorSource(kind: SensorKind) {
  return useMemo(() => createNativeRepSensorSource(kind), [kind]);
}
