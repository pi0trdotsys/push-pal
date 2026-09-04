import { useState } from "react";
import {
  DEFAULT_AI_CONFIG,
  mockAdvisor,
  type AiConfig,
  type AiHint,
  type AiStatus,
} from "@/lib/ai-client";
import { useAppState } from "@/lib/session-store";

/** Panel lokalnego doradcy AI — w makiecie napędzany `mockAdvisor`. */
export function AiPanel() {
  const app = useAppState();
  const [config, setConfig] = useState<AiConfig>(DEFAULT_AI_CONFIG);
  const [status, setStatus] = useState<AiStatus>("unknown");
  const [hints, setHints] = useState<AiHint[]>([]);
  const [busy, setBusy] = useState(false);

  const ping = async () => {
    setStatus("checking");
    setStatus(await mockAdvisor.ping(config));
  };

  const analyze = async () => {
    setBusy(true);
    const result = await mockAdvisor.analyze(config, {
      plan: app.plan,
      history: app.history,
      today: app.today,
    });
    setHints(result);
    setBusy(false);
  };

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h2 className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground">
          Model lokalny
        </h2>

        <label className="block space-y-1">
          <span className="text-[10px] tracking-widest uppercase text-muted-foreground">
            Endpoint
          </span>
          <input
            type="text"
            name="ai-endpoint"
            autoComplete="off"
            spellCheck={false}
            value={config.endpoint}
            onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
            className="w-full bg-transparent border-b border-border py-2 font-mono text-sm outline-none focus:border-foreground"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-[10px] tracking-widest uppercase text-muted-foreground">
            Model
          </span>
          <input
            type="text"
            name="ai-model"
            autoComplete="off"
            spellCheck={false}
            value={config.model}
            onChange={(e) => setConfig({ ...config, model: e.target.value })}
            className="w-full bg-transparent border-b border-border py-2 font-mono text-sm outline-none focus:border-foreground"
          />
        </label>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={ping}
            className="text-[11px] tracking-widest uppercase text-muted-foreground hover:text-foreground"
          >
            Sprawdź połączenie
          </button>
          <span className="text-[11px] tracking-widest uppercase text-muted-foreground">
            {status === "unknown"
              ? "—"
              : status === "checking"
                ? "sprawdzam…"
                : status === "online"
                  ? "online"
                  : "offline"}
          </span>
        </div>
      </section>

      <section className="space-y-5">
        <button
          onClick={analyze}
          disabled={busy}
          className="w-full py-4 border border-foreground/30 text-[11px] tracking-[0.3em] uppercase disabled:opacity-40"
        >
          {busy ? "Analizuję…" : "Analizuj ostatnie 7 dni"}
        </button>

        <ul className="space-y-4">
          {hints.map((h) => (
            <li key={h.id} className="flex gap-3">
              <span
                className={`mt-2 size-1 rounded-full shrink-0 ${
                  h.kind === "suggestion" ? "bg-accent" : "bg-foreground/30"
                }`}
              />
              <p className="text-sm leading-relaxed text-foreground/85">{h.text}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
