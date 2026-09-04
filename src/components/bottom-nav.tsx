import { Link, useRouterState } from "@tanstack/react-router";

const ITEMS = [
  { to: "/", label: "Dziś" },
  { to: "/plan", label: "Plan" },
  { to: "/insights", label: "AI" },
] as const;

/** Dolna nawigacja tekstowa — ukryta w trybie sesji (pełny ekran, bez rozpraszaczy). */
export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname === "/session") return null;

  return (
    <nav className="shrink-0 grid grid-cols-3 items-center py-6 px-4">
      {ITEMS.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="text-center text-base tracking-wide text-muted-foreground transition-colors"
          activeOptions={{ exact: item.to === "/" }}
          activeProps={{ className: "text-foreground font-semibold" }}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
