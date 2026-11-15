import { useRef, useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Link2, Mail, Package, Send, Sparkles } from 'lucide-react'
import { DEMO_PROFILE, useSession } from '../auth'
import { usePageTitle } from '../lib/title'
import { useProfile } from '../store'

type TierKey = 'free' | 'pro' | 'creator'

const TIERS: {
  key: TierKey
  label: string
  price: string
  cadence: string
  pitch: string
  features: string[]
  cta: string
}[] = [
  {
    key: 'free',
    label: 'Free',
    price: '$0',
    cadence: 'forever',
    pitch: 'One page with everything you make on it. Enough to find out whether people bite.',
    features: [
      'Your own leenkr.com handle',
      'Unlimited links and social handles',
      'Up to 3 products',
      'Connect section for email and bookings',
      'Basic page views',
    ],
    cta: 'Start free',
  },
  {
    key: 'pro',
    label: 'Pro',
    price: '$9',
    cadence: 'per month',
    pitch: 'For creators selling every week, who want the page to look like their own work.',
    features: [
      'Everything in Free',
      'Unlimited products',
      'Custom domain',
      'Every theme, accent and motion setting',
      'Click tracking on products and links',
      'Verified badge review',
    ],
    cta: 'Choose Pro',
  },
  {
    key: 'creator',
    label: 'Creator',
    price: '$24',
    cadence: 'per month',
    pitch: 'For studios and small businesses running several pages under one brand.',
    features: [
      'Everything in Pro',
      'Up to 5 pages on one login',
      'Shared brand appearance presets',
      'Lead export to CSV',
      'Priority support',
      'Early access to new tools',
    ],
    cta: 'Choose Creator',
  },
]

const BENEFITS = [
  {
    icon: Package,
    title: 'A shop, not a list',
    copy: 'Products get an image, a price and a button that goes wherever you sell. Visitors see what it costs before they tap.',
  },
  {
    icon: Link2,
    title: 'Links that stay readable',
    copy: 'Written work, videos and press live in their own tab instead of pushing your products off the screen.',
  },
  {
    icon: Send,
    title: 'An inbox built in',
    copy: 'Email, bookings, newsletter and collab requests sit next to the work, so interest turns into a conversation.',
  },
]

const CREATOR_POINTS = [
  'Sell kits, templates and courses without a storefront',
  'One link that works in every bio field',
  'Keep your personality — themes, accents and motion',
]

const BUSINESS_POINTS = [
  'Put a product catalogue behind one short URL',
  'Collect leads without a separate form tool',
  'Run a handful of creator pages under one brand',
]

export default function Marketing() {
  usePageTitle('Leenkr — one link for everything you make')
  const [tier, setTier] = useState<TierKey>('pro')
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const { session } = useSession()
  const { profile } = useProfile()
  const active = TIERS.find((item) => item.key === tier) ?? TIERS[0]

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = TIERS.length - 1
    let next = -1
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = index === last ? 0 : index + 1
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = index === 0 ? last : index - 1
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = last
    if (next === -1) return

    event.preventDefault()
    setTier(TIERS[next].key)
    tabRefs.current[next]?.focus()
  }

  return (
    <div className="mk">
      <header className="mk-head">
        <Link to="/" className="mk-brand">
          <span className="mk-mark">L</span>
          Leenkr
        </Link>
        <nav className="mk-nav" aria-label="Site">
          <a href="#what">What it is</a>
          <a href="#why">Why Leenkr</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <div className="mk-head-actions">
          {session ? (
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
          )}
        </div>
      </header>

      <main>
        <section className="mk-hero">
          <div className="mk-hero-copy">
            <p className="mk-eyebrow">
              <Sparkles size={13} />
              Link in bio, for people who sell things
            </p>
            <h1 className="mk-h1">
              Everything you make,
              <br />
              behind <span className="mk-hl">one link</span>.
            </h1>
            <p className="mk-lede">
              Leenkr turns a long bio link into a page that sells: your products with real prices, your
              writing and videos, and a way to reach you — one section at a time.
            </p>
            <div className="mk-cta-row">
              <Link className="btn" to="/signup">
                Create your page — free
                <ArrowRight size={16} />
              </Link>
              <Link className="btn ghost" to={`/${profile.username}`}>
                See a live page
              </Link>
            </div>
            <p className="mk-trust">Free to start · No card · Your handle is yours in under a minute</p>
          </div>

          <div className="mk-stage" aria-hidden="true">
            <div className="mk-phone">
              <div className="mk-phone-top">
                <span className="mk-avatar">C</span>
                <p className="mk-phone-name">{DEMO_PROFILE.name}</p>
                <p className="mk-phone-handle">@{DEMO_PROFILE.username}</p>
                <p className="mk-phone-bio">Designer and builder. I sell the kits that come out of the work.</p>
              </div>
              <div className="mk-phone-tabs">
                <span className="on">Products</span>
                <span>Links</span>
                <span>Connect</span>
              </div>
              <div className="mk-phone-card">
                <span className="mk-phone-thumb" />
                <span className="mk-phone-body">
                  <span className="mk-phone-title">Creator OS Kit</span>
                  <span className="mk-phone-meta">Templates · $29</span>
                </span>
                <span className="mk-phone-price">$29</span>
              </div>
              <div className="mk-phone-card">
                <span className="mk-phone-thumb" />
                <span className="mk-phone-body">
                  <span className="mk-phone-title">Type Pairings Vol. 1</span>
                  <span className="mk-phone-meta">Design assets · $12</span>
                </span>
                <span className="mk-phone-price">$12</span>
              </div>
            </div>
            <div className="mk-stage-chip">leenkr.com/{DEMO_PROFILE.username}</div>
          </div>
        </section>

        <section className="mk-section" id="what">
          <p className="mk-kicker">What Leenkr is</p>
          <h2 className="mk-h2">A page that answers “what do you sell?”</h2>
          <p className="mk-section-lede">
            Most link pages are a stack of buttons that all leave the page. Leenkr keeps the work itself on
            the page, sorted into the three things visitors actually came for.
          </p>

          <div className="mk-benefits">
            {BENEFITS.map((item) => {
              const Icon = item.icon
              return (
                <article className="mk-benefit" key={item.title}>
                  <span className="mk-benefit-icon">
                    <Icon size={18} />
                  </span>
                  <h3 className="mk-h3">{item.title}</h3>
                  <p className="mk-copy">{item.copy}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section className="mk-section" id="why">
          <p className="mk-kicker">Why switch</p>
          <h2 className="mk-h2">One link, doing the work of four</h2>
          <div className="mk-split">
            <article className="mk-audience">
              <h3 className="mk-h3">Creators</h3>
              <p className="mk-copy">
                You already have an audience. What you need is a place for them to buy without leaving a
                comment thread.
              </p>
              <ul className="mk-points">
                {CREATOR_POINTS.map((point) => (
                  <li key={point}>
                    <Check size={14} strokeWidth={3} />
                    {point}
                  </li>
                ))}
              </ul>
            </article>

            <article className="mk-audience">
              <h3 className="mk-h3">Businesses</h3>
              <p className="mk-copy">
                A short URL that carries a catalogue and a contact route beats a landing page nobody
                maintains.
              </p>
              <ul className="mk-points">
                {BUSINESS_POINTS.map((point) => (
                  <li key={point}>
                    <Check size={14} strokeWidth={3} />
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className="mk-section mk-how">
          <p className="mk-kicker">How it works</p>
          <h2 className="mk-h2">Live in three steps</h2>
          <ol className="mk-steps">
            <li>
              <span className="mk-step-num">1</span>
              <h3 className="mk-h3">Claim your handle</h3>
              <p className="mk-copy">leenkr.com/yourname. Lowercase, dashes allowed, free forever.</p>
            </li>
            <li>
              <span className="mk-step-num">2</span>
              <h3 className="mk-h3">Add what you sell</h3>
              <p className="mk-copy">Image, price and a button. Or a link, or an inbox — pick your sections.</p>
            </li>
            <li>
              <span className="mk-step-num">3</span>
              <h3 className="mk-h3">Share one link</h3>
              <p className="mk-copy">Every bio, caption and email signature points at the same page.</p>
            </li>
          </ol>
        </section>

        <section className="mk-section mk-pricing" id="pricing">
          <p className="mk-kicker">Pricing</p>
          <h2 className="mk-h2">Pick the size that fits</h2>
          <p className="mk-section-lede">
            Start free. Upgrade when the page starts earning. Cancel or switch at any time.
          </p>

          <div className="mk-switch" role="tablist" aria-label="Pricing plans">
            {TIERS.map((item, index) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                id={`plan-tab-${item.key}`}
                ref={(node) => {
                  tabRefs.current[index] = node
                }}
                aria-selected={tier === item.key}
                aria-controls="plan-panel"
                tabIndex={tier === item.key ? 0 : -1}
                className={tier === item.key ? 'mk-switch-item on' : 'mk-switch-item'}
                onClick={() => setTier(item.key)}
                onKeyDown={(event) => onTabKeyDown(event, index)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <article
            className="mk-plan"
            role="tabpanel"
            id="plan-panel"
            aria-labelledby={`plan-tab-${active.key}`}
            key={active.key}
          >
            <div className="mk-plan-head">
              <div>
                <h3 className="mk-plan-name">{active.label}</h3>
                <p className="mk-copy">{active.pitch}</p>
              </div>
              <p className="mk-plan-price">
                {active.price}
                <span>{active.cadence}</span>
              </p>
            </div>

            <ul className="mk-plan-features">
              {active.features.map((feature) => (
                <li key={feature}>
                  <Check size={14} strokeWidth={3} />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="mk-plan-foot">
              <Link className="btn" to="/signup">
                {active.cta}
                <ArrowRight size={16} />
              </Link>
              <p className="mk-plan-note">
                {active.key === 'free' ? 'No card needed.' : 'Billing arrives when the backend does.'}
              </p>
            </div>
          </article>

          <p className="mk-plan-hint">One plan shown at a time — switch above to compare.</p>
        </section>

        <section className="mk-close">
          <div className="mk-close-inner">
            <h2 className="mk-h2">Your next customer is one link away</h2>
            <p className="mk-lede">
              Put your products, your links and your inbox on a page that looks like you made it.
            </p>
            <Link className="btn dark" to="/signup">
              Create your page — free
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="mk-foot">
        <div className="mk-foot-brand">
          <span className="mk-mark">L</span>
          <span>
            Leenkr
            <span className="mk-foot-sub">One link for everything you make.</span>
          </span>
        </div>
        <nav className="mk-foot-links" aria-label="Footer">
          <a href="#what">What it is</a>
          <a href="#pricing">Pricing</a>
          <Link to="/login">Log in</Link>
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
