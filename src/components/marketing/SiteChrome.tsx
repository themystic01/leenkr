import { useEffect, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Briefcase,
  Building2,
  CreditCard,
  GraduationCap,
  Mail,
  Sparkles,
  User,
  Zap,
} from 'lucide-react'
import { NotchNavbar, type NotchNavItem } from '@/components/ui/notch-navbar'
import { useSession } from '../../auth'

export const NAV_LINKS: NotchNavItem[] = [
  { label: 'About', to: '/about', icon: User },
  { label: 'Features', to: '/features', icon: Sparkles },
  { label: 'VibeUniversity', to: '/vibe-university', icon: GraduationCap },
  { label: 'Earn', to: '/earn', icon: Zap },
  { label: 'Career', to: '/career', icon: Briefcase },
  { label: 'Leenkr for Business', to: '/business', icon: Building2 },
  { label: 'Pricing', to: '/#pricing', icon: CreditCard },
]

const FOOTER_LINKS: { label: string; to: string }[] = [
  { label: 'About', to: '/about' },
  { label: 'Features', to: '/features' },
  { label: 'VibeUniversity', to: '/vibe-university' },
  { label: 'Earn', to: '/earn' },
  { label: 'Career', to: '/career' },
  { label: 'Leenkr for Business', to: '/business' },
  { label: 'Pricing', to: '/#pricing' },
]

/** Nav, page and footer shared by every public marketing page. */
export function MarketingLayout({ children }: { children: ReactNode }) {
  const { session } = useSession()
  const location = useLocation()

  // "/#pricing" from another page: the section arrives with the lazy route, so
  // wait for it before scrolling.
  useEffect(() => {
    if (!location.hash) return

    let cancelled = false
    let tries = 0
    let timer = 0

    const tick = () => {
      if (cancelled) return
      const target = document.querySelector(location.hash)
      if (target) {
        target.scrollIntoView({ block: 'start' })
        return
      }
      if (tries++ < 20) timer = window.setTimeout(tick, 120)
    }

    tick()
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [location.pathname, location.hash])

  const actions = session ? (
    <Link className="btn sm" to="/dashboard">
      Open studio
    </Link>
  ) : (
    <>
      <Link className="mk-login" to="/login">
        Log in
      </Link>
      <Link className="btn sm" to="/signup">
        Start free
      </Link>
    </>
  )

  return (
    <div className="mk">
      <NotchNavbar links={NAV_LINKS} actions={actions} />

      <main className="mk-main">{children}</main>

      <footer className="mk-foot">
        <div className="mk-foot-brand">
          <span className="mk-mark">L</span>
          <span>
            Leenkr
            <span className="mk-foot-sub">One link for everything you make.</span>
          </span>
        </div>
        <nav className="mk-foot-links" aria-label="Footer">
          {FOOTER_LINKS.map((item) => (
            <Link key={item.label} to={item.to}>
              {item.label}
            </Link>
          ))}
          <a href="mailto:hey@leenkr.com">
            <Mail size={13} />
            hey@leenkr.com
          </a>
        </nav>
        <p className="mk-foot-copy">© {new Date().getFullYear()} Leenkr</p>
      </footer>
    </div>
  )
}

interface PageHeroProps {
  kicker: string
  title: ReactNode
  lede: string
  children?: ReactNode
}

export function PageHero({ kicker, title, lede, children }: PageHeroProps) {
  return (
    <header className="mk-page-hero">
      <p className="mk-kicker">{kicker}</p>
      <h1 className="mk-page-title">{title}</h1>
      <p className="mk-page-lede">{lede}</p>
      {children}
    </header>
  )
}

export function PageSection({
  kicker,
  title,
  lede,
  children,
}: {
  kicker?: string
  title: string
  lede?: string
  children: ReactNode
}) {
  return (
    <section className="mk-page-section">
      {kicker ? <p className="mk-kicker">{kicker}</p> : null}
      <h2 className="mk-page-h2">{title}</h2>
      {lede ? <p className="mk-section-lede">{lede}</p> : null}
      {children}
    </section>
  )
}

export function CloseBand() {
  return (
    <section className="mk-close">
      <div className="mk-close-inner">
        <h2 className="mk-h2">Your next customer is one link away</h2>
        <p className="mk-lede">Put your products, your links and your inbox on a page that looks like you made it.</p>
        <Link className="btn dark" to="/signup">
          Create your page — free
        </Link>
      </div>
    </section>
  )
}
