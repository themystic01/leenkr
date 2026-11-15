import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AppWindowIcon,
  ChartBarIcon,
  ChartLineUpIcon,
  CloudCheckIcon,
  CubeIcon,
  FileArrowDownIcon,
  FlaskIcon,
  GlobeIcon,
  LifebuoyIcon,
  LinkIcon,
  SignatureIcon,
  SparkleIcon,
  SquaresFourIcon,
  UserIcon,
} from '@phosphor-icons/react'
import { ArrowRight, Check, Link2, Package, Send } from 'lucide-react'
import PricingTiers, { type PricingTier } from '@/components/ui/pricing-tiers'
import { DEMO_PROFILE } from '../auth'
import { MarketingLayout } from '../components/marketing/SiteChrome'
import { usePageTitle } from '../lib/title'
import { useProfile } from '../store'

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

// Side by side needs roughly three 300px cards plus gutters; below that the
// plans collapse into the one-at-a-time switch.
const WIDE_PRICING = '(min-width: 1024px)'

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )

  useEffect(() => {
    const list = window.matchMedia(query)
    const onChange = () => setMatches(list.matches)
    onChange()
    list.addEventListener('change', onChange)
    // Older Safari only supports the deprecated listener, so resize covers it.
    window.addEventListener('resize', onChange)
    return () => {
      list.removeEventListener('change', onChange)
      window.removeEventListener('resize', onChange)
    }
  }, [query])

  return matches
}

type PlanKey = 'free' | 'pro' | 'creator'

const PLAN_ORDER: PlanKey[] = ['free', 'pro', 'creator']

const PLAN_LABELS: Record<PlanKey, string> = {
  free: 'Free',
  pro: 'Pro',
  creator: 'Creator',
}

export default function Marketing() {
  usePageTitle('Leenkr — one link for everything you make')
  const { profile } = useProfile()
  const navigate = useNavigate()

  // Wide screens show all three plans; narrow ones show the selected plan.
  const widePricing = useMediaQuery(WIDE_PRICING)
  const [plan, setPlan] = useState<PlanKey>('pro')
  const planRefs = useRef<Array<HTMLButtonElement | null>>([])

  const onPlanKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = PLAN_ORDER.length - 1
    let next = -1
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = index === last ? 0 : index + 1
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = index === 0 ? last : index - 1
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = last
    if (next === -1) return

    event.preventDefault()
    setPlan(PLAN_ORDER[next])
    planRefs.current[next]?.focus()
  }

  // Every plan gets the component's highlighted treatment — lifted dark card,
  // yellow primary CTA — so the cards match whether one or all three show.
  const tiers: PricingTier[] = [
    {
      id: 'free',
      name: 'Free',
      description: 'One page with everything you make on it.',
      price: { monthly: 0, yearly: 0 },
      featured: true,
      cta: { label: 'Start free', onClick: () => navigate('/signup') },
      featuresLabel: 'What you get',
      features: [
        { label: 'Your own leenkr.com handle', icon: <UserIcon weight="fill" /> },
        { label: 'Unlimited links and social handles', icon: <LinkIcon weight="fill" /> },
        { label: 'Up to 3 products', icon: <CubeIcon weight="fill" /> },
        { label: 'Connect section for email and bookings', icon: <SignatureIcon weight="fill" /> },
        { label: 'Basic page views', icon: <ChartBarIcon weight="fill" /> },
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'For creators selling every week, who want the page to look like their own work.',
      price: { monthly: 9, yearly: 7 },
      featured: true,
      cta: { label: 'Choose Pro', onClick: () => navigate('/signup') },
      featuresLabel: 'Everything in Free, plus:',
      features: [
        { label: 'Unlimited products', icon: <CubeIcon weight="fill" /> },
        { label: 'Custom domain', icon: <GlobeIcon weight="fill" /> },
        { label: 'Every theme, accent and motion setting', icon: <SquaresFourIcon weight="fill" /> },
        { label: 'Click tracking on products and links', icon: <ChartLineUpIcon weight="fill" /> },
        { label: 'Verified badge review', icon: <CloudCheckIcon weight="fill" /> },
      ],
    },
    {
      id: 'creator',
      name: 'Creator',
      description: 'For studios and small businesses running several pages under one brand.',
      price: { monthly: 24, yearly: 19 },
      featured: true,
      cta: { label: 'Choose Creator', onClick: () => navigate('/signup') },
      featuresLabel: 'Everything in Pro, plus:',
      features: [
        { label: 'Up to 5 pages on one login', icon: <AppWindowIcon weight="fill" /> },
        { label: 'Shared brand appearance presets', icon: <SquaresFourIcon weight="fill" /> },
        { label: 'Lead export to CSV', icon: <FileArrowDownIcon weight="fill" /> },
        { label: 'Priority support', icon: <LifebuoyIcon weight="fill" /> },
        { label: 'Early access to new tools', icon: <FlaskIcon weight="fill" /> },
      ],
    },
  ]

  return (
    <MarketingLayout>
        <section className="mk-hero">
          <div className="mk-hero-inner">
            <div className="mk-hero-title">
              <span className="mk-hero-chip mk-hero-chip--one" aria-hidden="true">
                Amara
              </span>
              <h1 className="mk-h1">
                Everything you make,
                <br />
                behind <span className="mk-hl">one link</span>
              </h1>
              <span className="mk-hero-chip mk-hero-chip--two" aria-hidden="true">
                Collins
              </span>
              <span className="mk-hero-chip mk-hero-chip--three" aria-hidden="true">
                Tobi
              </span>
            </div>

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

          <div className="mk-dash" aria-hidden="true">
            <div className="mk-dash-bar">
              <span className="mk-dash-brand">
                <span className="mk-mark">L</span>
                Leenkr
              </span>
              <span className="mk-dash-crumb">Page setup</span>
              <span className="mk-dash-status">
                <span className="mk-dash-dot" />
                Published
              </span>
              <span className="mk-dash-people">
                <span>C</span>
                <span>A</span>
              </span>
            </div>

            <div className="mk-dash-body">
              <div className="mk-dash-form">
                <h2>Set your page up</h2>

                <label className="mk-dash-field">
                  <span>Display name</span>
                  <span className="mk-dash-input">{DEMO_PROFILE.name}</span>
                </label>

                <label className="mk-dash-field">
                  <span>Handle</span>
                  <span className="mk-dash-input muted">leenkr.com/{DEMO_PROFILE.username}</span>
                </label>

                <label className="mk-dash-field">
                  <span>Bio</span>
                  <span className="mk-dash-input muted">
                    Designer and builder. I sell the kits that come out of the work.
                  </span>
                </label>

                <div className="mk-dash-accent">
                  Accent
                  <span className="mk-dash-swatch on" style={{ background: '#dfff00' }} />
                  <span className="mk-dash-swatch" style={{ background: '#8fb4ff' }} />
                  <span className="mk-dash-swatch" style={{ background: '#f7b2a0' }} />
                  <span className="mk-dash-swatch" style={{ background: '#0c0404' }} />
                </div>
              </div>

              <div className="mk-dash-preview">
                <div className="mk-dash-preview-head">
                  <span className="mk-dash-avatar">C</span>
                  <h3>{DEMO_PROFILE.name}</h3>
                  <p className="mk-dash-handle">leenkr.com/{DEMO_PROFILE.username}</p>
                </div>

                <div className="mk-dash-tabs">
                  <span className="on">Products</span>
                  <span>Links</span>
                  <span>Connect</span>
                </div>

                <div className="mk-dash-product">
                  <span className="mk-dash-thumb" />
                  <span className="mk-dash-product-body">
                    <span className="mk-dash-product-title">Creator OS Kit</span>
                    <span className="mk-dash-product-meta">Templates · 42 sales</span>
                  </span>
                  <span className="mk-dash-price">$29</span>
                </div>

                <div className="mk-dash-product">
                  <span className="mk-dash-thumb" />
                  <span className="mk-dash-product-body">
                    <span className="mk-dash-product-title">Type Pairings Vol. 1</span>
                    <span className="mk-dash-product-meta">Design assets · 18 sales</span>
                  </span>
                  <span className="mk-dash-price">$12</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mk-section mk-yellow" id="what">
          <div className="mk-yellow-inner">
            <p className="mk-kicker">What Leenkr is</p>
            <h2 className="mk-h2">A page that answers “what do you sell?”</h2>
            <p className="mk-section-lede">
              Most link pages are a stack of buttons that all leave the page. Leenkr keeps the work itself
              on the page, sorted into the three things visitors actually came for.
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

        <section className="mk-pricing" id="pricing">
          <div className="mk-pricing-head">
            <p className="mk-kicker">Pricing</p>
            <h2 className="mk-h2">Pick the size that fits</h2>
            <p className="mk-section-lede">
              Start free. Upgrade when the page starts earning — cancel or switch any time.
            </p>

            {widePricing ? null : (
              <div className="mk-plan-switch" role="tablist" aria-label="Pricing plans">
                {PLAN_ORDER.map((key, index) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    id={`plan-tab-${key}`}
                    ref={(node) => {
                      planRefs.current[index] = node
                    }}
                    aria-selected={plan === key}
                    aria-controls="plan-panel"
                    tabIndex={plan === key ? 0 : -1}
                    onClick={() => setPlan(key)}
                    onKeyDown={(event) => onPlanKeyDown(event, index)}
                  >
                    {PLAN_LABELS[key]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <PricingTiers
            key={widePricing ? 'all-plans' : plan}
            badge={null}
            title={null}
            description={null}
            tiers={widePricing ? tiers : [tiers[PLAN_ORDER.indexOf(plan)]]}
            enterprise={null}
            billing="monthly"
            className="mk-pricing-inner"
            role={widePricing ? undefined : 'tabpanel'}
            id={widePricing ? undefined : 'plan-panel'}
            aria-labelledby={widePricing ? undefined : `plan-tab-${plan}`}
          />
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
    </MarketingLayout>
  )
}
