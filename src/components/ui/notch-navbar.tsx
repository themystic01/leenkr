"use client"
import { useState, type ComponentType, type HTMLAttributes, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { CreditCard, Menu, Sparkles, User, X, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

// Helper component for navigation links
const NavLink = ({
  to,
  icon: Icon,
  label,
}: {
  to: string
  icon: ComponentType<{ className?: string }>
  label: string
}) => (
  <Link
    to={to}
    className="group flex items-center gap-1.5 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors whitespace-nowrap"
  >
    <Icon className="w-4 h-4 opacity-70 group-hover:opacity-100" />
    <span>{label}</span>
  </Link>
)

type NotchItem = { label: string; to: string; icon: ComponentType<{ className?: string }> }

const ITEMS: { left: NotchItem[]; right: NotchItem[] } = {
  left: [
    { label: "About", to: "/about", icon: User },
    { label: "Features", to: "/features", icon: Sparkles },
    { label: "Earn", to: "/earn", icon: Zap },
  ],
  right: [{ label: "Pricing", to: "/#pricing", icon: CreditCard }],
}

export function NotchNavbar({
  className,
  signedIn = false,
  logo,
  ...props
}: HTMLAttributes<HTMLElement> & { logo?: ReactNode; signedIn?: boolean }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      <header className={cn("fixed top-0 inset-x-0 z-50 h-16 flex px-0", className)} {...props}>
        {/* Left Side Bar - Flexible width */}
        <div className="flex-1 h-10 bg-background z-20 relative min-w-0">
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <line x1="0" y1="39.5" x2="100%" y2="39.5" stroke="currentColor" strokeOpacity={0.05} strokeWidth={0.5} className="text-foreground" />
            <line x1="0" y1="36.5" x2="100%" y2="36.5" stroke="currentColor" strokeOpacity={0.05} strokeWidth={0.5} className="text-foreground" />
          </svg>
        </div>

        {/* Responsive Notch Container - 3 Slices */}
        <div className="flex h-16 relative z-10 shrink-0 -ml-px">
          {/* Left Slice (Corner) */}
          <div className="w-[50px] h-full relative shrink-0">
            {/* Glass Background */}
            <div className="absolute inset-0 bg-background" style={{ clipPath: "path('M0 0 H50 V64 C25 64 25 40 0 40 Z')" }} />
            {/* Outlines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 50 64">
              <path d="M0 39.5 C25 39.5 25 63.5 50 63.5" fill="none" stroke="currentColor" strokeOpacity={0.05} strokeWidth={0.5} className="text-foreground" />
              <path d="M0 36.5 C25 36.5 25 60.5 50 60.5" fill="none" stroke="currentColor" strokeOpacity={0.05} strokeWidth={0.5} className="text-foreground" />
            </svg>
          </div>

          {/* Center Slice (Flexible Content Area) */}
          <div className="flex-1 h-full relative min-w-0 -ml-px">
            {/* Background & Lines Layer */}
            <div className="absolute inset-0 bg-background">
              <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                <line x1="0" y1="63.5" x2="100%" y2="63.5" stroke="currentColor" strokeOpacity={0.05} strokeWidth={0.5} className="text-foreground" />
                <line x1="0" y1="60.5" x2="100%" y2="60.5" stroke="currentColor" strokeOpacity={0.05} strokeWidth={0.5} className="text-foreground" />
              </svg>
            </div>

            {/* Content Layer */}
            <div className="relative w-full h-full flex items-end justify-between pb-2 px-4 md:px-8">
              {/* Desktop Left Nav */}
              <nav className="hidden md:flex gap-8 mb-1 shrink-0">
                {ITEMS.left.map((item) => (
                  <NavLink key={item.label} {...item} />
                ))}
              </nav>

              {/* Mobile Menu Button (Left) */}
              <button
                className="md:hidden mb-1 p-1 text-foreground/70 hover:text-foreground transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {/* Logo (Center) */}
              <div className="flex justify-center shrink-0 mx-2 md:mx-4 mt-1">
                {logo || (
                  <Link to="/" className="flex items-center justify-center relative group">
                    <span className="mk-brand relative z-10 text-[19px] leading-none transition-transform group-hover:scale-105">
                      Leenkr
                    </span>
                  </Link>
                )}
              </div>

              {/* Desktop Right Nav */}
              <nav className="hidden md:flex gap-6 items-center shrink-0">
                {ITEMS.right.map((item) => (
                  <NavLink key={item.label} {...item} />
                ))}

                <div className="flex gap-4 pl-4 border-l border-foreground/10 shrink-0 items-center">
                  {signedIn ? (
                    <Link to="/dashboard" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors whitespace-nowrap">
                      Open studio
                    </Link>
                  ) : (
                    <>
                      <Link to="/login" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors whitespace-nowrap">
                        Log in
                      </Link>
                      <Link
                        to="/signup"
                        className="px-3 py-1.5 text-sm font-medium text-background bg-foreground rounded-2xl hover:bg-foreground/90 transition-colors shadow-sm shadow-foreground/10 whitespace-nowrap"
                      >
                        Start free
                      </Link>
                    </>
                  )}
                </div>
              </nav>

              {/* Mobile Right Actions */}
              <div className="md:hidden flex items-center gap-2 mb-1">
                <Link to={signedIn ? "/dashboard" : "/signup"} className="p-1 text-foreground/70 hover:text-foreground transition-colors text-sm font-medium">
                  {signedIn ? "Studio" : "Start free"}
                </Link>
              </div>
            </div>
          </div>

          {/* Right Slice (Corner) */}
          <div className="w-[50px] h-full relative shrink-0 -ml-px">
            {/* Glass Background */}
            <div className="absolute inset-0 bg-background" style={{ clipPath: "path('M0 0 H50 V40 C25 40 25 64 0 64 Z')" }} />
            {/* Outlines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 50 64">
              <path d="M0 63.5 C25 63.5 25 39.5 50 39.5" fill="none" stroke="currentColor" strokeOpacity={0.05} strokeWidth={0.5} className="text-foreground" />
              <path d="M0 60.5 C25 60.5 25 36.5 50 36.5" fill="none" stroke="currentColor" strokeOpacity={0.05} strokeWidth={0.5} className="text-foreground" />
            </svg>
          </div>
        </div>

        {/* Right Side Bar - Flexible width */}
        <div className="flex-1 h-10 bg-background z-20 relative min-w-0 -ml-px">
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <line x1="0" y1="39.5" x2="100%" y2="39.5" stroke="currentColor" strokeOpacity={0.05} strokeWidth={0.5} className="text-foreground" />
            <line x1="0" y1="36.5" x2="100%" y2="36.5" stroke="currentColor" strokeOpacity={0.05} strokeWidth={0.5} className="text-foreground" />
          </svg>
        </div>
      </header>

      {/* Mobile Menu Overlay. It stays mounted so the closing transition can
          play; `invisible` keeps its links out of the tab order while shut. */}
      <div
        aria-hidden={!isMobileMenuOpen}
        className={cn(
          "fixed inset-x-0 top-16 z-40 bg-background border-b border-foreground/5 p-4 md:hidden shadow-lg",
          "transition-all duration-200 ease-out motion-reduce:transition-none",
          isMobileMenuOpen
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-5 opacity-0",
        )}
      >
            <nav className="flex flex-col gap-2">
              {/* Combine all items */}
              {[...ITEMS.left, ...ITEMS.right].map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-foreground/5 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5 opacity-70" />
                  <span className="font-medium text-foreground/90">{item.label}</span>
                </Link>
              ))}
              <div className="h-px bg-foreground/10 my-2" />
              <div className="flex flex-col gap-2">
                <Link
                  to={signedIn ? "/dashboard" : "/login"}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-foreground/5 transition-colors font-medium text-foreground/90"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {signedIn ? "Open studio" : "Log in"}
                </Link>
                {signedIn ? null : (
                  <Link
                    to="/signup"
                    className="flex items-center justify-center gap-2 p-3 rounded-lg bg-foreground text-background font-medium mt-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Start free
                  </Link>
                )}
              </div>
            </nav>
      </div>
    </>
  )
}
