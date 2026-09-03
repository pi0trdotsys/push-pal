/**
 * PUSH — kontrakt lokalnego doradcy AI.
 *
 * W makiecie działa wyłącznie implementacja `mockAdvisor`. Docelowo tę samą
 * sygnaturę wypełnia klient lokalnego modelu (np. Ollama pod
 * `http://localhost:11434/api/chat`). Zamiana = podmiana implementacji
 * `AiAdvisor`, UI nie wymaga zmian.
 */
import type { DayPlan } from "./plan-30";
import type { SessionResult } from "./session-store";

/** Konfiguracja połączenia z lokalnym modelem. */
export type AiConfig = {
  /** Bazowy URL serwera modelu. */
  endpoint: string;
  /** Nazwa modelu, np. `llama3.1:8b`. */
  model: string;
};

export const DEFAULT_AI_CONFIG: AiConfig = {
  endpoint: "http://localhost:11434",
  model: "llama3.1:8b",
};

/** Stan połączenia z modelem. */
export type AiStatus = "unknown" | "checking" | "online" | "offline";

/** Wejście analizy — wszystko, co model dostaje o użytkowniku. */
export type AiInput = {
  plan: DayPlan[];
  history: SessionResult[];
  /** Data ISO dnia, dla którego liczona jest porada. */
  today: string;
};

/** Pojedyncza podpowiedź. Jedno zdanie, bez formatowania. */
export type AiHint = {
  id: string;
  /** Treść podpowiedzi w języku użytkownika. */
  text: string;
  /** Skąd wynika: obserwacja z danych czy propozycja zmiany planu. */
  kind: "observation" | "suggestion";
};

/** Interfejs, który musi spełnić dowolna implementacja doradcy. */
export type AiAdvisor = {
  /** Sprawdza dostępność modelu. */
  ping: (config: AiConfig) => Promise<AiStatus>;
  /** Zwraca podpowiedzi na podstawie planu i historii. */
  analyze: (config: AiConfig, input: AiInput) => Promise<AiHint[]>;
};

/**
 * Prompt systemowy dla realnej implementacji. Trzymany tutaj, żeby kontrakt
 * wejścia/wyjścia był w jednym miejscu z typami.
 */
export const SYSTEM_PROMPT = [
  "Jesteś trenerem pompek. Dostajesz plan 30 dni i historię sesji w JSON.",
  "Odpowiadasz wyłącznie tablicą JSON obiektów {id, text, kind}.",
  "Maksymalnie 4 pozycje, każda to jedno zdanie po polsku, bez markdownu.",
  "kind = 'observation' dla faktu z danych, 'suggestion' dla zmiany planu.",
].join(" ");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Implementacja makietowa: zawsze offline, zwraca deterministyczne porady. */
export const mockAdvisor: AiAdvisor = {
  async ping() {
    await sleep(600);
    return "offline";
  },
  async analyze(_config, input) {
    await sleep(900);
    const done = input.history.length;
    const avg = done
      ? Math.round(input.history.reduce((a, s) => a + s.reps, 0) / done)
      : 0;
    return [
      {
        id: "h1",
        kind: "observation",
        text: done
          ? `Średnio ${avg} powtórzeń na sesję w ostatnich ${done} treningach.`
          : "Brak zapisanych sesji — pierwsze dane pojawią się po treningu.",
      },
      {
        id: "h2",
        kind: "observation",
        text: "Tempo spada w trzeciej serii o około 18% względem pierwszej.",
      },
      {
        id: "h3",
        kind: "suggestion",
        text: "Wydłuż przerwę przed trzecią serią o 15 sekund i utrzymaj wolumen.",
      },
      {
        id: "h4",
        kind: "suggestion",
        text: "W przyszłym tygodniu dodaj 8% powtórzeń zamiast kolejnej serii.",
      },
    ];
  },
};
