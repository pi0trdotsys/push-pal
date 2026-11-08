import { Link, useRouterState } from "@tanstack/react-router";
import { House, ChartNoAxesCombined, CalendarDays } from "lucide-react";
const ITEMS = [
  { to: "/", label: "Dziś", Icon: House },
  { to: "/insights", label: "Postępy", Icon: ChartNoAxesCombined },
  { to: "/plan", label: "Plan", Icon: CalendarDays },
] as const;
export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname === "/session") return null;
  return (
    <nav aria-label="Nawigacja główna" className="bottom-nav">
      {ITEMS.map(({ to, label, Icon }) => (
        <Link
          key={to}
          to={to}
          className="nav-item"
          activeOptions={{ exact: to === "/" }}
          activeProps={{ className: "nav-item nav-active" }}
        >
          <Icon size={21} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
