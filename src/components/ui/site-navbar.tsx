import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SiteNavItem {
  label: string;
  to: string;
}

export const SITE_NAV_ITEMS: SiteNavItem[] = [
  { label: "About", to: "/about" },
  { label: "Features", to: "/features" },
  { label: "Earn", to: "/earn" },
  { label: "Pricing", to: "/#pricing" },
];

export function SiteNavbar({
  className,
  signedIn = false,
}: {
  className?: string;
  signedIn?: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // close the drawer whenever the route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  const cta = signedIn
    ? { label: "Open studio", to: "/dashboard" }
    : { label: "Start free", to: "/signup" };

  return (
    <header
      className={cn(
        "mk-nav fixed inset-x-0 top-0 z-50 h-16 border-b border-[#fdfaf3]/10 bg-[#0c0404]/95 backdrop-blur-lg",
        className,
      )}
    >
      <div className="mx-auto flex h-full max-w-[1120px] items-center justify-between gap-6 px-5 sm:px-6">
        <Link to="/" className="mk-brand shrink-0" aria-label="Leenkr home">
          Leenkr
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
          {SITE_NAV_ITEMS.map((item) => (
            <Link key={item.label} to={item.to} className="mk-nav-link text-sm font-medium transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {signedIn ? null : (
            <Link to="/login" className="mk-nav-link text-sm font-medium transition-colors">
              Log in
            </Link>
          )}
          <Link
            to={cta.to}
            className="mk-nav-cta rounded-full px-4 py-2 text-sm font-semibold transition-colors"
          >
            {cta.label}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          className="flex size-9 items-center justify-center rounded-md text-[#fdfaf3]/80 transition-colors hover:text-[#fdfaf3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dfff00] md:hidden"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <div
        id="mobile-nav"
        aria-hidden={!mobileOpen}
        className={cn(
          "fixed inset-x-0 top-16 z-40 border-b border-[#fdfaf3]/10 bg-[#0c0404] p-4 shadow-2xl md:hidden",
          "transition-all duration-200 ease-out motion-reduce:transition-none",
          mobileOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-4 opacity-0",
        )}
      >
        <nav aria-label="Mobile" className="flex flex-col">
          {SITE_NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className="mk-nav-link border-b border-[#fdfaf3]/10 py-3 text-sm font-medium"
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-3 flex flex-col gap-2">
            {signedIn ? null : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="mk-nav-ghost flex h-10 items-center justify-center rounded-full text-sm font-medium"
              >
                Log in
              </Link>
            )}
            <Link
              to={cta.to}
              onClick={() => setMobileOpen(false)}
              className="mk-nav-cta flex h-10 items-center justify-center rounded-full text-sm font-semibold"
            >
              {cta.label}
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default SiteNavbar;
