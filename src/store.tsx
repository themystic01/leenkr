import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type PlatformKey =
  | 'x'
  | 'instagram'
  | 'linkedin'
  | 'youtube'
  | 'github'
  | 'tiktok'
  | 'dribbble'

export type Social = { id: string; platform: PlatformKey; handle: string }

export type Currency = 'USD' | 'EUR' | 'GBP' | 'NGN'

export const CURRENCIES: { code: Currency; symbol: string; label: string }[] = [
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
  { code: 'NGN', symbol: '₦', label: 'NGN (₦)' },
]

export const PRODUCT_CATEGORIES = [
  'Design Assets',
  'Templates',
  'Ebooks',
  'Courses',
  'Presets',
  'Plugins',
  'Other',
]

export type Product = {
  id: string
  title: string
  category: string
  price: number
  currency: Currency
  isFree: boolean
  ctaText: string
  url: string
  description: string
  image: string | null
}

const amountFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

// Grouped digits so a price reads 1,000 rather than 1000.
export function formatAmount(amount: number) {
  return amountFormat.format(Number.isFinite(amount) ? amount : 0)
}

export function priceLabel(product: Product) {
  if (product.isFree) return 'Free'
  const symbol = CURRENCIES.find((currency) => currency.code === product.currency)?.symbol ?? '$'
  return `${symbol}${formatAmount(product.price)}`
}

export type PageTheme = 'light' | 'paper' | 'midnight'
export type PageAccent = 'electric' | 'butter' | 'sky' | 'blush'
export type PageMotion = 'still' | 'gentle' | 'lively'
export type Appearance = { theme: PageTheme; accent: PageAccent; motion: PageMotion }
export type Security = { twoFactor: boolean }
export type DomainStatus = 'none' | 'pending' | 'connected'

export const PAGE_THEMES: { key: PageTheme; label: string; note: string; swatch: string; ink: string }[] = [
  { key: 'light', label: 'Light', note: 'White page, ink text.', swatch: '#ffffff', ink: '#0c0404' },
  { key: 'paper', label: 'Paper', note: 'Warm off-white.', swatch: '#faf6ea', ink: '#0c0404' },
  { key: 'midnight', label: 'Midnight', note: 'Asphalt with light text.', swatch: '#0c0404', ink: '#fdfaf3' },
]

export const PAGE_ACCENTS: { key: PageAccent; label: string; color: string }[] = [
  { key: 'electric', label: 'Electric yellow', color: '#dfff00' },
  { key: 'butter', label: 'Butter', color: '#ffe45c' },
  { key: 'sky', label: 'Sky', color: '#b8e3ff' },
  { key: 'blush', label: 'Blush', color: '#ffc9d8' },
]

export const PAGE_MOTIONS: { key: PageMotion; label: string; note: string }[] = [
  { key: 'still', label: 'Still', note: 'No movement at all.' },
  { key: 'gentle', label: 'Gentle', note: 'Quiet fade and rise as the page loads.' },
  { key: 'lively', label: 'Lively', note: 'Bigger lift and staggered cards.' },
]

export type LinkItem = { id: string; title: string; url: string }
export type ConnectKind = 'email' | 'call' | 'newsletter' | 'collab'
export type ConnectItem = { id: string; kind: ConnectKind; label: string; value: string }

export type ToolKind = 'event' | 'contact' | 'newsletter'
export type ToolEntry = { id: string; kind: ToolKind; values: Record<string, string> }

export type Profile = {
  name: string
  username: string
  email: string
  bio: string
  photo: string | null
  socials: Social[]
  products: Product[]
  links: LinkItem[]
  connects: ConnectItem[]
  tools: ToolEntry[]
  verified: boolean
  published: boolean
  security: Security
  domain: string
  domainStatus: DomainStatus
  appearance: Appearance
}

export const PLATFORMS: { key: PlatformKey; label: string; base: string }[] = [
  { key: 'x', label: 'X', base: 'https://x.com/' },
  { key: 'instagram', label: 'Instagram', base: 'https://instagram.com/' },
  { key: 'linkedin', label: 'LinkedIn', base: 'https://linkedin.com/in/' },
  { key: 'youtube', label: 'YouTube', base: 'https://youtube.com/@' },
  { key: 'github', label: 'GitHub', base: 'https://github.com/' },
  { key: 'tiktok', label: 'TikTok', base: 'https://tiktok.com/@' },
  { key: 'dribbble', label: 'Dribbble', base: 'https://dribbble.com/' },
]

export const CONNECT_KINDS: { key: ConnectKind; label: string }[] = [
  { key: 'email', label: 'Email' },
  { key: 'call', label: 'Call' },
  { key: 'newsletter', label: 'Newsletter' },
  { key: 'collab', label: 'Collab' },
]

export function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

export function socialUrl(social: Social) {
  if (/^https?:\/\//i.test(social.handle)) return social.handle
  const platform = PLATFORMS.find((p) => p.key === social.platform)
  return `${platform?.base ?? ''}${social.handle.replace(/^@/, '')}`
}

export function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

const seed: Profile = {
  name: 'Lein Karr',
  username: 'lein',
  email: 'hey@leinkarr.com',
  bio: 'Product designer building calm tools for loud ideas. I ship small software, write about craft, and help founders find their edge.',
  photo: null,
  socials: [
    { id: 's1', platform: 'x', handle: 'leinkarr' },
    { id: 's2', platform: 'instagram', handle: 'lein.builds' },
    { id: 's3', platform: 'linkedin', handle: 'lein-karr' },
    { id: 's4', platform: 'github', handle: 'leinkarr' },
  ],
  products: [
    {
      id: 'p1',
      title: 'Creator OS Kit',
      category: 'Templates',
      price: 29,
      currency: 'USD',
      isFree: false,
      ctaText: 'Get the kit',
      url: 'https://example.com/creator-os',
      description: 'A Notion system for planning launches without the chaos.',
      image: null,
    },
    {
      id: 'p2',
      title: 'Type Pairings Vol. 1',
      category: 'Design Assets',
      price: 12,
      currency: 'USD',
      isFree: false,
      ctaText: 'Download',
      url: 'https://example.com/type-pairings',
      description: '42 heading and body combos that actually hold up.',
      image: null,
    },
    {
      id: 'p3',
      title: 'Portfolio Teardown',
      category: 'Courses',
      price: 0,
      currency: 'USD',
      isFree: true,
      ctaText: 'Watch free',
      url: 'https://example.com/teardown',
      description: 'A 40-minute video walkthrough of six real portfolios.',
      image: null,
    },
  ],
  links: [
    { id: 'l1', title: 'Why your onboarding loses people', url: 'https://example.com/onboarding' },
    { id: 'l2', title: 'The tools I actually use', url: 'https://example.com/stack' },
    { id: 'l3', title: 'Book a portfolio review', url: 'https://example.com/review' },
  ],
  connects: [
    { id: 'c1', kind: 'email', label: 'Email me', value: 'hi@leinkarr.com' },
    { id: 'c2', kind: 'call', label: 'Book a 20-min intro', value: 'https://cal.com/leinkarr' },
    { id: 'c3', kind: 'newsletter', label: 'Weekly craft notes', value: 'https://example.com/newsletter' },
  ],
  tools: [],
  verified: false,
  published: true,
  security: { twoFactor: false },
  domain: '',
  domainStatus: 'none',
  appearance: { theme: 'light', accent: 'electric', motion: 'gentle' },
}

const STORAGE_KEY = 'leenkr.profile.v1'

// Products saved before the editor existed had a plain price string and a
// `blurb`; bring them into the current shape instead of showing blanks.
function toProduct(raw: Record<string, unknown>, index: number): Product {
  const legacyPrice = raw.price
  const numeric =
    typeof legacyPrice === 'number'
      ? legacyPrice
      : Number(String(legacyPrice ?? '').replace(/[^0-9.]/g, ''))
  const currency = CURRENCIES.some((c) => c.code === raw.currency)
    ? (raw.currency as Currency)
    : 'USD'

  return {
    id: typeof raw.id === 'string' ? raw.id : `p-legacy-${index}`,
    title: typeof raw.title === 'string' ? raw.title : 'Untitled product',
    category: PRODUCT_CATEGORIES.includes(String(raw.category))
      ? String(raw.category)
      : 'Design Assets',
    price: Number.isFinite(numeric) ? numeric : 0,
    currency,
    isFree:
      typeof raw.isFree === 'boolean'
        ? raw.isFree
        : String(legacyPrice ?? '').toLowerCase() === 'free',
    ctaText: typeof raw.ctaText === 'string' ? raw.ctaText : 'Get it',
    url: typeof raw.url === 'string' ? raw.url : 'https://example.com',
    description:
      typeof raw.description === 'string'
        ? raw.description
        : typeof raw.blurb === 'string'
          ? raw.blurb
          : '',
    image: typeof raw.image === 'string' ? raw.image : null,
  }
}

function load(): Profile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seed
    const parsed = JSON.parse(raw) as Partial<Profile>
    const merged = { ...seed, ...parsed } as Profile
    const appearance = (parsed.appearance ?? {}) as Partial<Appearance>
    return {
      ...merged,
      products: ((merged.products ?? []) as unknown[]).map((item, index) =>
        toProduct((item ?? {}) as Record<string, unknown>, index),
      ),
      // Profiles saved before Settings existed have no appearance or security.
      appearance: {
        theme: PAGE_THEMES.some((t) => t.key === appearance.theme)
          ? (appearance.theme as PageTheme)
          : seed.appearance.theme,
        accent: PAGE_ACCENTS.some((a) => a.key === appearance.accent)
          ? (appearance.accent as PageAccent)
          : seed.appearance.accent,
        motion: PAGE_MOTIONS.some((m) => m.key === appearance.motion)
          ? (appearance.motion as PageMotion)
          : seed.appearance.motion,
      },
      security: { twoFactor: Boolean(parsed.security?.twoFactor) },
      domain: typeof parsed.domain === 'string' ? parsed.domain : '',
      domainStatus:
        parsed.domainStatus === 'pending' || parsed.domainStatus === 'connected'
          ? parsed.domainStatus
          : 'none',
    }
  } catch {
    return seed
  }
}

type Store = {
  profile: Profile
  save: (next: Profile) => void
  reset: () => void
}

const ProfileContext = createContext<Store | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(() => load())

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
    } catch {
      // Storage full or blocked — the app still works for this session.
    }
  }, [profile])

  const save = useCallback((next: Profile) => setProfile(next), [])
  const reset = useCallback(() => setProfile(seed), [])

  const value = useMemo(() => ({ profile, save, reset }), [profile, save, reset])
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  const store = useContext(ProfileContext)
  if (!store) throw new Error('useProfile must be used inside ProfileProvider')
  return store
}

export function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

// Deterministic mock metrics so the dashboard reads like a real account.
export function statsFor(profile: Profile) {
  let hash = 0
  for (const char of `${profile.username}:${profile.products.length}:${profile.links.length}`) {
    hash = (hash * 31 + char.charCodeAt(0)) % 100000
  }
  const views = profile.published ? 480 + (hash % 900) : 0
  const clicks = Math.round(views * 0.34)
  return { views, clicks }
}
