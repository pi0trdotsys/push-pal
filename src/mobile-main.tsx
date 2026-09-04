/**
 * PUSH — punkt wejścia dla powłoki mobilnej (Capacitor / Android).
 *
 * Aplikacja webowa (`src/start.ts` + `src/server.ts`) jest SSR pod Cloudflare
 * i tego telefon nie odpali. Ten plik renderuje dokładnie to samo drzewo tras
 * (`routeTree.gen.ts`, wspólne z web) czysto po stronie klienta — bez SSR,
 * bez serwera — w statycznym `mobile/index.html` budowanym przez
 * `vite.mobile.config.ts` (skrypt `npm run build:mobile`). Żadna trasa nie ma
 * loadera/server function, więc różnica jest wyłącznie w tym pliku.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import "./styles.css";

const router = getRouter();

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("#root element missing in mobile/index.html");

createRoot(rootEl).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
