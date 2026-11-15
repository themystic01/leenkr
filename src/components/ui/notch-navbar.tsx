import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface NotchNavItem {
  label: string
  to: string
  icon: React.ComponentType<{ className?: string }>
}

interface NotchNavbarProps {
  /** Left half of the notch; the rest sits on the right. */
  links: NotchNavItem[]
  /** Sign-in buttons, rendered after the right-hand links on desktop. */
  actions?: ReactNode
  /** Rendered in the centre of the notch. */
  logo?: ReactNode
  className?: string
}

const NavLink = ({ item }: { item: NotchNavItem }) => (
  <Link
    to={item.to}
    className="text-sm font-medium whitespace-nowrap text-[#fdfaf3]/70 transition-colors hover:text-[#fdfaf3]"
  >
    {item.label}
  </Link>
)

export function NotchNavbar({ links, actions, logo, className }: NotchNavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { pathname } = useLocation()

  // Any navigation closes the sheet, including the browser's back button.
  useEffect(() => setIsMobileMenuOpen(false), [pathname])

  // Widening past the desktop breakpoint drops the sheet, so it cannot come
  // back open later after the window shrinks again.
  useEffect(() => {
    const wide = window.matchMedia('(min-width: 1280px)')
    const onChange = () => {
      if (wide.matches) setIsMobileMenuOpen(false)
    }
    onChange()
    wide.addEventListener('change', onChange)
    window.addEventListener('resize', onChange)
    return () => {
      wide.removeEventListener('change', onChange)
      window.removeEventListener('resize', onChange)
    }
  }, [])

  const left = links.slice(0, 4)
  const right = links.slice(4)

  return (
    <>
      <header className={cn('fixed inset-x-0 top-0 z-50 flex h-16 px-0', className)}>
        {/* Left Side Bar - Flexible width */}
        <div className="relative z-20 h-10 flex-1 min-w-0 bg-[#0c0404]">
          <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
            <line x1="0" y1="39.5" x2="100%" y2="39.5" stroke="currentColor" strokeOpacity={0.12} strokeWidth={0.5} className="text-[#fdfaf3]" />
            <line x1="0" y1="36.5" x2="100%" y2="36.5" stroke="currentColor" strokeOpacity={0.12} strokeWidth={0.5} className="text-[#fdfaf3]" />
          </svg>
        </div>

        {/* Responsive Notch Container - 3 Slices */}
        <div className="relative z-10 -ml-px flex h-16 shrink-0">
          {/* Left Slice (Corner) */}
          <div className="relative h-full w-[50px] shrink-0">
            {/* Glass Background */}
            <div
              className="absolute inset-0 bg-[#0c0404]"
              style={{ clipPath: "path('M0 0 H50 V64 C25 64 25 40 0 40 Z')" }}
            />
            {/* Outlines */}
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 50 64">
              <path d="M0 39.5 C25 39.5 25 63.5 50 63.5" fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth={0.5} className="text-[#fdfaf3]" />
              <path d="M0 36.5 C25 36.5 25 60.5 50 60.5" fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth={0.5} className="text-[#fdfaf3]" />
            </svg>
          </div>

          {/* Center Slice (Flexible Content Area) */}
          <div className="relative -ml-px h-full flex-1 min-w-0">
            {/* Background & Lines Layer */}
            <div className="absolute inset-0 bg-[#0c0404]">
              <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none">
                <line x1="0" y1="63.5" x2="100%" y2="63.5" stroke="currentColor" strokeOpacity={0.12} strokeWidth={0.5} className="text-[#fdfaf3]" />
                <line x1="0" y1="60.5" x2="100%" y2="60.5" stroke="currentColor" strokeOpacity={0.12} strokeWidth={0.5} className="text-[#fdfaf3]" />
              </svg>
            </div>

            {/* Content Layer */}
            <div className="relative flex h-full w-full items-end justify-center px-3 pb-2 md:px-6 lg:justify-between">
              {/* Desktop Left Nav */}
              <nav className="mb-1 hidden shrink-0 gap-4 lg:flex xl:gap-5">
                {left.map((item) => (
                  <NavLink key={item.label} item={item} />
                ))}
              </nav>

              {/* Logo (Center) */}
              <div className="mx-2 mt-1 flex shrink-0 justify-center md:mx-4">
                {logo || (
                  <Link to="/" className="flex items-center justify-center gap-2" aria-label="Leenkr home">
                    <span className="mk-mark">L</span>
                    <span className="mk-notch-word">Leenkr</span>
                  </Link>
                )}
              </div>

              {/* Desktop Right Nav */}
              <nav className="mb-1 hidden shrink-0 items-center gap-4 lg:flex xl:gap-5">
                {right.map((item) => (
                  <NavLink key={item.label} item={item} />
                ))}

              </nav>

            </div>
          </div>

          {/* Right Slice (Corner) */}
          <div className="relative -ml-px h-full w-[50px] shrink-0">
            {/* Glass Background */}
            <div
              className="absolute inset-0 bg-[#0c0404]"
              style={{ clipPath: "path('M0 0 H50 V40 C25 40 25 64 0 64 Z')" }}
            />
            {/* Outlines */}
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 50 64">
              <path d="M0 63.5 C25 63.5 25 39.5 50 39.5" fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth={0.5} className="text-[#fdfaf3]" />
              <path d="M0 60.5 C25 60.5 25 36.5 50 36.5" fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth={0.5} className="text-[#fdfaf3]" />
            </svg>
          </div>
        </div>

        {/* Right Side Bar - Flexible width */}
        <div className="relative z-20 -ml-px h-10 flex-1 min-w-0 bg-[#0c0404]">
          <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
            <line x1="0" y1="39.5" x2="100%" y2="39.5" stroke="currentColor" strokeOpacity={0.12} strokeWidth={0.5} className="text-[#fdfaf3]" />
            <line x1="0" y1="36.5" x2="100%" y2="36.5" stroke="currentColor" strokeOpacity={0.12} strokeWidth={0.5} className="text-[#fdfaf3]" />
          </svg>
        </div>

        {/* Account actions and the mobile menu button, pinned top right */}
        <div className="absolute inset-y-0 right-4 z-30 flex items-center gap-4">
          <div className="hidden items-center gap-4 xl:flex">{actions}</div>
          <button
            type="button"
            className="p-1 text-[#fdfaf3]/70 transition-colors hover:text-[#fdfaf3] xl:hidden"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="notch-mobile-menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="notch-mobile-menu"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 border-b border-[#fdfaf3]/10 bg-[#0c0404] p-4 shadow-lg xl:hidden"
          >
            <nav className="flex flex-col gap-1" aria-label="Site">
              {links.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="flex items-center gap-3 rounded-lg p-3 text-[#fdfaf3]/90 transition-colors hover:bg-[#fdfaf3]/5"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5 opacity-70" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
              <div className="my-2 h-px bg-[#fdfaf3]/10" />
              <div className="flex flex-col gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                {actions}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
