import { createFileRoute } from "@tanstack/react-router";
import { AiPanel } from "@/components/ai-panel";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "PUSH — AI" },
      {
        name: "description",
        content: "Lokalny doradca AI: podłącz model (np. Ollama) i przeanalizuj ostatni tydzień.",
      },
      { property: "og:title", content: "PUSH — AI" },
      { property: "og:description", content: "Analiza treningu przez lokalny model." },
    ],
  }),
  component: InsightsPage,
});

function InsightsPage() {
  return (
    <main className="flex-1 px-8 py-12">
      <h2 className="text-3xl font-extrabold mb-10">AI</h2>
      <AiPanel />
    </main>
  );
}
