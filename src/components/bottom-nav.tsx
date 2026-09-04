import { Link } from "@tanstack/react-router";

const ITEMS = [
  { to: "/", label: "Dziś" },
  { to: "/archive", label: "Historia" },
  { to: "/config", label: "Plan" },
] as const;

export function BottomNav() {
  return (
    <nav className="shrink-0 grid grid-cols-3 items-center py-6 px-4">
      {ITEMS.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="text-center text-base text-muted-foreground transition-colors"
          activeOptions={{ exact: item.to === "/" }}
          activeProps={{ className: "text-foreground font-semibold" }}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
