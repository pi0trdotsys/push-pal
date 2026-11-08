import { createFileRoute } from "@tanstack/react-router";
import { AiPanel } from "@/components/ai-panel";
export const Route = createFileRoute("/insights")({ component: InsightsPage });
function InsightsPage() {
  return (
    <main className="page space-y-7">
      <header>
        <p className="eyebrow text-accent">PUSH / Twoje dane</p>
        <h1 className="text-3xl font-extrabold mt-3">Postępy</h1>
        <p className="text-muted-foreground text-sm mt-2">
          Każdy trening buduje Twój kolejny plan.
        </p>
      </header>
      <AiPanel />
    </main>
  );
}
