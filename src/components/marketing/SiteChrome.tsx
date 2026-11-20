import { useEffect, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Mail } from 'lucide-react'
import {
  AwwwardsNav,
  type AwwwardsNavColumn,
  type AwwwardsNavLink,
} from '@/components/ui/awwwards-nav'
import { useSession } from '../../auth'

export const NAV_ITEMS: AwwwardsNavLink[] = [
  { label: 'Features', href: '/features' },
  { label: 'Earn', href: '/earn' },
  { label: 'Pricing', href: '/#pricing' },
]

const FOOTER_LINKS: { label: string; to: string }[] = [
  { label: 'About', to: '/about' },
  { label: 'Features', to: '/features' },
  { label: 'Earn', to: '/earn' },
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

  // Internal links go through the router so the page never reloads; the mail
  // link stays a plain anchor. `close` folds the mega-menu on the way out.
  const renderNavLink = (link: AwwwardsNavLink, className: string, close: () => void) => {
    if (/^(https?:|mailto:)/.test(link.href)) {
      return (
        <a className={className} href={link.href}>
          {link.label}
        </a>
      )
    }
    return (
      <Link className={className} to={link.href} onClick={close}>
        {link.label}
      </Link>
    )
  }

  const account: AwwwardsNavLink[] = session
    ? [{ label: 'Open studio', href: '/dashboard' }]
    : [
        { label: 'Log in', href: '/login' },
        { label: 'Start free', href: '/signup' },
      ]

  const columns: AwwwardsNavColumn[] = [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '/features' },
        { label: 'Earn', href: '/earn' },
        { label: 'Pricing', href: '/#pricing' },
      ],
    },
    { title: 'Account', links: account },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '/about' },
        { label: 'hey@leenkr.app', href: 'mailto:hey@leenkr.app' },
      ],
    },
  ]

  // Signing in is the whole point of the bar's right edge, so it lives there
  // rather than behind "More". On very narrow screens it folds into the panel.
  const actions = session ? (
    <Link className="btn sm" to="/dashboard">
      Open studio
    </Link>
  ) : (
    <div className="hidden items-center gap-1.5 min-[560px]:flex">
      <Link className="mk-login" to="/login">
        Log in
      </Link>
      <Link className="btn sm" to="/signup">
        Start free
      </Link>
    </div>
  )

  return (
    <div className="mk">
      <AwwwardsNav
        className="dark w-[min(800px,94vw)]"
        items={NAV_ITEMS}
        columns={columns}
        actions={actions}
        renderLink={renderNavLink}
      />

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
