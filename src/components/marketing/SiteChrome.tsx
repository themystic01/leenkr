import { useEffect, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { MARKETING_NAV, SiteNavbar } from '@/components/ui/site-navbar'
import { useSession } from '../../auth'

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

  return (
    <div className="mk">
      <SiteNavbar signedIn={Boolean(session)} />

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
          {MARKETING_NAV.map((item) => (
            <Link key={item.label} to={item.to}>
              {item.label}
            </Link>
          ))}
          <a href="mailto:hey@leenkr.app">
            <Mail size={13} />
            hey@leenkr.app
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
