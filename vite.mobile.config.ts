import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { fileURLToPath } from "node:url";

/**
 * Build statycznego SPA dla powłoki Capacitor/Android — patrz komentarz w
 * `src/mobile-main.tsx`. Celowo NIE reużywa `@lovable.dev/vite-tanstack-config`
 * (ta apka jest tam skonfigurowana pod SSR/Cloudflare przez nitro, czego
 * telefon nie odpali) — tylko zwykły Vite + React + Tailwind + alias `@/*`,
 * wskazany na `mobile/index.html` jako jedyny wpis.
 *
 * Użycie: `npm run build:mobile` (patrz package.json), wynik w `dist-mobile/`,
 * na który wskazuje `webDir` w `capacitor.config.ts`.
 */
export default defineConfig({
  root: "mobile",
  resolve: {
    alias: { "/src": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  plugins: [react(), tailwindcss(), tsconfigPaths({ root: ".." })],
  build: {
    outDir: "../dist-mobile",
    emptyOutDir: true,
  },
});
