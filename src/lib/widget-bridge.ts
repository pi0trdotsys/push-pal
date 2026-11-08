import { Capacitor, registerPlugin } from "@capacitor/core";
import type { AppState } from "./session-store";
const widget = registerPlugin<{ update(options: { payload: string }): Promise<void> }>(
  "TrainingWidget",
);
export async function consumeWidgetLaunch(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  return registerPlugin<{ consumeLaunch(): Promise<{ session: boolean }> }>("TrainingWidget")
    .consumeLaunch()
    .then((data) => data.session)
    .catch(() => false);
}
export async function syncWidget(s: AppState) {
  if (!Capacitor.isNativePlatform()) return;
  await widget.update({
    payload: JSON.stringify({
      startDate: s.startDate,
      volume: s.volume,
      dumbbellReps: s.dumbbellReps,
      plan: s.plan,
      history: s.history.map((h) => ({
        date: h.date,
        reps: h.reps,
        completed: h.completed,
        training: h.training,
      })),
      active: Boolean(s.active),
    }),
  });
}
export async function setKeepAwake(enabled: boolean) {
  if (!Capacitor.isNativePlatform()) return;
  await registerPlugin<{ keepAwake(o: { enabled: boolean }): Promise<void> }>("TrainingWidget")
    .keepAwake({ enabled })
    .catch(() => {});
}
