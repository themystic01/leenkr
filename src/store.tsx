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
export type Product = { id: string; title: string; blurb: string; price: string; url: string }
export type LinkItem = { id: string; title: string; url: string }
export type ConnectKind = 'email' | 'call' | 'newsletter' | 'collab'
export type ConnectItem = { id: string; kind: ConnectKind; label: string; value: string }

export type ToolKind = 'event' | 'contact' | 'newsletter'
export type ToolEntry = { id: string; kind: ToolKind; values: Record<string, string> }

export type Profile = {
  name: string
  username: string
  bio: string
  photo: string | null
  socials: Social[]
  products: Product[]
  links: LinkItem[]
  connects: ConnectItem[]
  tools: ToolEntry[]
  verified: boolean
  published: boolean
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
      blurb: 'A Notion system for planning launches without the chaos.',
      price: '$29',
      url: 'https://example.com/creator-os',
    },
    {
      id: 'p2',
      title: 'Type Pairings Vol. 1',
      blurb: '42 heading and body combos that actually hold up.',
      price: '$12',
      url: 'https://example.com/type-pairings',
    },
    {
      id: 'p3',
      title: 'Portfolio Teardown',
      blurb: 'A 40-minute video walkthrough of six real portfolios.',
      price: '$18',
      url: 'https://example.com/teardown',
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
}

const STORAGE_KEY = 'leenkr.profile.v1'

function load(): Profile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seed
    const parsed = JSON.parse(raw) as Partial<Profile>
    return { ...seed, ...parsed }
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
