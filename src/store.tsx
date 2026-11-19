import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useSession } from './auth'
import { createPage, fetchMyPage, savePage } from './lib/api'
import { backend, hasBackend } from './lib/supabase'

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

// Where a product is delivered. `default` sells the uploaded file on Leenkr;
// `external` sends buyers to a link the creator already hosts elsewhere.
export type Fulfilment = 'default' | 'external'

// A product is a real digital file, not a link to somewhere else. `fileKey` is
// the private bucket key and is only ever read by the owner, never by visitors.
export type Product = {
  id: string
  slug: string
  title: string
  category: string
  price: number
  currency: Currency
  isFree: boolean
  ctaText: string
  description: string
  image: string | null
  images: string[]
  fulfilment: Fulfilment
  externalUrl: string | null
  fileName: string | null
  fileSize: number | null
  fileType: string | null
  fileKey: string | null
  downloads: number
  purchases: number
}

export const FULFILMENTS: { key: Fulfilment; label: string; note: string }[] = [
  {
    key: 'default',
    label: 'Sell on Leenkr',
    note: 'Upload the file. Buyers pay here and the download unlocks after payment.',
  },
  {
    key: 'external',
    label: 'External link',
    note: 'The product lives somewhere else. Visitors get a button to that link.',
  },
]

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

/** One stable slug per page: two products called "Kit" become kit and kit-2. */
export function uniqueSlug(base: string, taken: string[]) {
  const root = slugify(base) || 'product'
  if (!taken.includes(root)) return root
  let index = 2
  while (taken.includes(`${root}-${index}`)) index += 1
  return `${root}-${index}`
}

export function formatBytes(bytes: number | null) {
  if (!bytes || bytes <= 0) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value >= 10 || unit === 0 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`
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
      slug: 'creator-os-kit',
      title: 'Creator OS Kit',
      category: 'Templates',
      price: 18000,
      currency: 'NGN',
      isFree: false,
      ctaText: 'Buy the kit',
      description: 'A Notion system for planning launches without the chaos.',
      image: null,
      images: [],
      fulfilment: 'default',
      externalUrl: null,
      fileName: 'creator-os-kit.zip',
      fileSize: 4200000,
      fileType: 'application/zip',
      fileKey: null,
      downloads: 128,
      purchases: 34,
    },
    {
      id: 'p2',
      slug: 'type-pairings-vol-1',
      title: 'Type Pairings Vol. 1',
      category: 'Design Assets',
      price: 7500,
      currency: 'NGN',
      isFree: false,
      ctaText: 'Buy now',
      description: '42 heading and body combos that actually hold up.',
      image: null,
      images: [],
      fulfilment: 'default',
      externalUrl: null,
      fileName: 'type-pairings-vol-1.pdf',
      fileSize: 8200000,
      fileType: 'application/pdf',
      fileKey: null,
      downloads: 96,
      purchases: 21,
    },
    {
      id: 'p3',
      slug: 'portfolio-teardown',
      title: 'Portfolio Teardown',
      category: 'Courses',
      price: 0,
      currency: 'NGN',
      isFree: true,
      ctaText: 'Download free',
      description: 'A 40-minute video walkthrough of six real portfolios.',
      image: null,
      images: [],
      fulfilment: 'default',
      externalUrl: null,
      fileName: 'portfolio-teardown.mp4',
      fileSize: 142000000,
      fileType: 'video/mp4',
      fileKey: null,
      downloads: 244,
      purchases: 0,
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

// A real account starts from nothing. Everything in `seed` above is sample
// content for the offline demo store, and must never be written to a creator's
// page in the database.
function emptyProfile(email = ''): Profile {
  return {
    name: '',
    username: '',
    email,
    bio: '',
    photo: null,
    socials: [],
    products: [],
    links: [],
    connects: [],
    tools: [],
    verified: false,
    published: false,
    security: { twoFactor: false },
    domain: '',
    domainStatus: 'none',
    appearance: { theme: 'light', accent: 'electric', motion: 'gentle' },
  }
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
    ctaText: typeof raw.ctaText === 'string' ? raw.ctaText : 'Download',
    description:
      typeof raw.description === 'string'
        ? raw.description
        : typeof raw.blurb === 'string'
          ? raw.blurb
          : '',
    image: typeof raw.image === 'string' ? raw.image : null,
    slug:
      typeof raw.slug === 'string' && raw.slug
        ? raw.slug
        : slugify(typeof raw.title === 'string' ? raw.title : `product-${index}`),
    images: Array.isArray(raw.images) ? (raw.images.filter((v) => typeof v === 'string') as string[]) : [],
    fulfilment: raw.fulfilment === 'external' ? 'external' : 'default',
    externalUrl: typeof raw.externalUrl === 'string' && raw.externalUrl ? raw.externalUrl : null,
    fileName: typeof raw.fileName === 'string' ? raw.fileName : null,
    fileSize: typeof raw.fileSize === 'number' ? raw.fileSize : null,
    fileType: typeof raw.fileType === 'string' ? raw.fileType : null,
    fileKey: typeof raw.fileKey === 'string' ? raw.fileKey : null,
    downloads: typeof raw.downloads === 'number' ? raw.downloads : 0,
    purchases: typeof raw.purchases === 'number' ? raw.purchases : 0,
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
  /** The database id of this creator's page, once it exists. */
  pageId: string | null
  save: (next: Profile) => void
  reset: () => void
}

const ProfileContext = createContext<Store | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { session } = useSession()
  const userId = session && session.userId !== 'demo' ? session.userId : null
  const email = session?.email ?? ''
  // With a backend configured the studio starts blank; the demo profile is only
  // for the offline store.
  const [profile, setProfile] = useState<Profile>(() => (hasBackend ? emptyProfile() : load()))
  const [pageId, setPageId] = useState<string | null>(null)
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null)

  // The browser copy is the demo store's storage. Real profiles live in Postgres.
  useEffect(() => {
    if (hasBackend) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
    } catch {
      // Storage full or blocked — the app still works for this session.
    }
  }, [profile])

  // A signed-in creator reads their stored page; a new account starts empty and
  // writes only what its owner fills in.
  useEffect(() => {
    setPageId(null)
    if (!backend || !userId) {
      setProfile(hasBackend ? emptyProfile() : load())
      return
    }
    let alive = true
    setProfile(emptyProfile(email))
    fetchMyPage(userId).then((page) => {
      if (!alive || !page) return
      setPageId(page.id)
      setProfile(page.profile)
    })
    return () => {
      alive = false
    }
  }, [userId, email])

  const save = useCallback(
    (next: Profile) => {
      setProfile(next)
      if (!backend || !userId) return
      // Studio forms save on every keystroke, so writes are batched.
      if (pending.current) clearTimeout(pending.current)
      pending.current = setTimeout(() => {
        if (pageId) {
          void savePage(pageId, next)
          return
        }
        // A handle is the one thing a page cannot exist without, so a blank
        // studio never creates a row.
        if (!next.username.trim()) return
        void createPage(next, userId).then(({ id }) => {
          if (id) setPageId(id)
        })
      }, 600)
    },
    [pageId, userId],
  )

  const reset = useCallback(
    () => setProfile(hasBackend ? emptyProfile(email) : seed),
    [email],
  )

  const value = useMemo(() => ({ profile, pageId, save, reset }), [profile, pageId, save, reset])
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

/* ------------------------------ insight ------------------------ */
/* The dashboard has no server, so the numbers are derived from the profile:
   stable for a given handle, and they move when the page changes. */

export type InsightRange = 7 | 30

export type InsightDay = { key: string; label: string; value: number }

export type InsightSource = { key: string; label: string; clicks: number; share: number }

export type InsightDevice = {
  key: 'mobile' | 'desktop' | 'tablet'
  label: string
  visits: number
  share: number
}

export type InsightLink = {
  id: string
  title: string
  host: string
  clicks: number
  share: number
}

export type Insight = {
  range: InsightRange
  views: number
  clicks: number
  clickRate: number
  daily: InsightDay[]
  busiest: InsightDay | null
  sources: InsightSource[]
  devices: InsightDevice[]
  links: InsightLink[]
}

function hashOf(input: string) {
  let hash = 0
  for (const char of input) hash = (hash * 31 + char.charCodeAt(0)) % 100000
  return hash
}

// 0…1 from a seed and an index, so a chart is different from a list but the
// same every time the page renders.
function noiseAt(seed: number, index: number) {
  const raw = Math.sin((seed + index * 37) * 12.9898) * 43758.5453
  return raw - Math.floor(raw)
}

// Whole numbers that add up to the total, biggest slices first.
function splitTotal(total: number, weights: number[]) {
  const sum = weights.reduce((a, b) => a + b, 0) || 1
  const exact = weights.map((weight) => (total * weight) / sum)
  const out = exact.map(Math.floor)
  let remainder = total - out.reduce((a, b) => a + b, 0)
  const order = exact.map((_, index) => index).sort((a, b) => exact[b] - exact[a])
  for (let i = 0; remainder > 0; i += 1, remainder -= 1) out[order[i % order.length]] += 1
  return out
}

const SOURCE_POOL: { key: string; label: string; weight: number }[] = [
  { key: 'instagram', label: 'Instagram', weight: 32 },
  { key: 'x', label: 'X', weight: 21 },
  { key: 'direct', label: 'Direct or typed', weight: 17 },
  { key: 'linkedin', label: 'LinkedIn', weight: 12 },
  { key: 'newsletter', label: 'Newsletter', weight: 10 },
  { key: 'other', label: 'Other referrers', weight: 8 },
]

const DEVICE_POOL: { key: InsightDevice['key']; label: string; weight: number }[] = [
  { key: 'mobile', label: 'Mobile', weight: 68 },
  { key: 'desktop', label: 'Desktop', weight: 26 },
  { key: 'tablet', label: 'Tablet', weight: 6 },
]

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function insightFor(profile: Profile, range: InsightRange = 7): Insight {
  const base = statsFor(profile)
  const scale = range / 7
  const views = Math.round(base.views * scale)
  const clicks = Math.round(base.clicks * scale)
  const seed = hashOf(`${profile.username}:insight:${range}`)

  // Clicks per day, newest last, shaped like a week that builds towards the
  // weekend — recognisable rather than random-looking.
  const perDay = clicks / range
  const daily: InsightDay[] = []
  const today = new Date()
  for (let index = 0; index < range; index += 1) {
    const date = new Date(today)
    date.setDate(today.getDate() - (range - 1 - index))
    const weekday = date.getDay()
    const shape = weekday === 0 || weekday === 6 ? 1.18 : 0.92
    const value = Math.max(0, Math.round(perDay * shape * (0.62 + noiseAt(seed, index) * 0.76)))
    daily.push({
      key: date.toISOString().slice(0, 10),
      label: range <= 7 ? DAY_LABELS[weekday] : `${date.getDate()}/${date.getMonth() + 1}`,
      value,
    })
  }

  const sources = SOURCE_POOL.map((source, index) => ({
    key: source.key,
    label: source.label,
    weight: Math.max(1, source.weight * (0.82 + noiseAt(seed + 11, index) * 0.36)),
  }))
  const sourceClicks = splitTotal(
    clicks,
    sources.map((source) => source.weight),
  )
  const sourceRows: InsightSource[] = sources
    .map((source, index) => ({
      key: source.key,
      label: source.label,
      clicks: sourceClicks[index],
      share: clicks > 0 ? sourceClicks[index] / clicks : 0,
    }))
    .sort((a, b) => b.clicks - a.clicks)

  const deviceVisits = splitTotal(
    views,
    DEVICE_POOL.map((device, index) => device.weight * (0.9 + noiseAt(seed + 23, index) * 0.2)),
  )
  const devices: InsightDevice[] = DEVICE_POOL.map((device, index) => ({
    key: device.key,
    label: device.label,
    visits: deviceVisits[index],
    share: views > 0 ? deviceVisits[index] / views : 0,
  }))

  // Links keep their page order but not their traffic; the first one leads.
  const linkWeights = profile.links.map((_, index) => 100 / (index + 1.35) + noiseAt(seed + 41, index) * 12)
  const linkClicks = splitTotal(clicks, linkWeights.length > 0 ? linkWeights : [1])
  const links: InsightLink[] = profile.links
    .map((link, index) => ({
      id: link.id,
      title: link.title,
      host: hostOf(link.url),
      clicks: linkClicks[index] ?? 0,
      share: clicks > 0 ? (linkClicks[index] ?? 0) / clicks : 0,
    }))
    .sort((a, b) => b.clicks - a.clicks)

  const busiest = daily.reduce<InsightDay | null>(
    (best, day) => (best === null || day.value > best.value ? day : best),
    null,
  )

  return {
    range,
    views,
    clicks,
    clickRate: views > 0 ? clicks / views : 0,
    daily,
    busiest,
    sources: sourceRows,
    devices,
    links,
  }
}
