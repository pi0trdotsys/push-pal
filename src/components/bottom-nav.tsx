import { Link } from "@tanstack/react-router";

const ITEMS = [
  { to: "/", label: "Monitor" },
  { to: "/archive", label: "Archive" },
  { to: "/config", label: "Config" },
] as const;

export function BottomNav() {
  return (
    <nav className="h-[84px] shrink-0 border-t border-border grid grid-cols-3 items-center">
      {ITEMS.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="flex flex-col items-center gap-1 opacity-30 transition-opacity"
          activeOptions={{ exact: item.to === "/" }}
          activeProps={{ className: "opacity-100" }}
        >
          {({ isActive }) => (
            <>
              <span
                className={
                  isActive
                    ? "size-1 rounded-full bg-accent mb-1"
                    : "size-1 rounded-full border border-foreground/50 mb-1"
                }
              />
              <span className="text-[9px] font-mono uppercase tracking-tighter">
                {item.label}
              </span>
            </>
          )}
        </Link>
      ))}
    </nav>
  );
}
