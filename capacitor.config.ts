import type { CapacitorConfig } from "@capacitor/cli";

/**
 * PUSH — konfiguracja Capacitor dla powłoki Android.
 *
 * `webDir` wskazuje na statyczny SPA eksport wygenerowany przez
 * `npm run build:mobile` (patrz `vite.mobile.config.ts`), a nie na standardowy
 * build serwerowy (`npm run build`), który celuje w Cloudflare/SSR i wymaga
 * runtime'u serwera, którego telefon nie odpali.
 */
const config: CapacitorConfig = {
  appId: "com.pushpal.app",
  appName: "Push Pal",
  webDir: "dist-mobile",
  backgroundColor: "#000000",
  android: {
    backgroundColor: "#000000",
  },
};

export default config;
