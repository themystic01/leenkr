import type {
  ConnectItem,
  ConnectKind,
  Currency,
  LinkItem,
  PlatformKey,
  Product,
  Profile,
} from '../store'
import { backend } from './supabase'

/** A page as the database holds it, shaped like the studio's Profile. */
export type PublicPage = { id: string; profile: Profile }

type PageRow = {
  id: string
  username: string
  name: string
  bio: string
  photo_url: string | null
  published: boolean
  verified: boolean
  domain: string
  domain_status: 'none' | 'pending' | 'connected'
  theme: Profile['appearance']['theme']
  accent: Profile['appearance']['accent']
  motion: Profile['appearance']['motion']
  two_factor: boolean
}

type SocialRow = { id: string; platform: PlatformKey; handle: string }
type ProductRow = {
  id: string
  title: string
  category: string
  price: number | string
  currency: Currency
  is_free: boolean
  cta_text: string
  url: string
  description: string
  image_url: string | null
}
type LinkRow = { id: string; title: string; url: string }
type ConnectRow = { id: string; kind: ConnectKind; label: string; value: string }

export type EventTarget = 'link' | 'product' | 'connect' | 'social'

function toProfile(
  page: PageRow,
  socials: SocialRow[],
  products: ProductRow[],
  links: LinkRow[],
  connects: ConnectRow[],
): Profile {
  return {
    name: page.name,
    username: page.username,
    email: '',
    bio: page.bio,
    photo: page.photo_url,
    socials: socials.map((row) => ({ id: row.id, platform: row.platform, handle: row.handle })),
    products: products.map<Product>((row) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      price: Number(row.price),
      currency: row.currency,
      isFree: row.is_free,
      ctaText: row.cta_text,
      url: row.url,
      description: row.description,
      image: row.image_url,
    })),
    links: links.map<LinkItem>((row) => ({ id: row.id, title: row.title, url: row.url })),
    connects: connects.map<ConnectItem>((row) => ({
      id: row.id,
      kind: row.kind,
      label: row.label,
      value: row.value,
    })),
    tools: [],
    verified: page.verified,
    published: page.published,
    security: { twoFactor: page.two_factor },
    domain: page.domain,
    domainStatus: page.domain_status,
    appearance: { theme: page.theme, accent: page.accent, motion: page.motion },
  }
}

async function hydrate(page: PageRow): Promise<PublicPage> {
  const db = backend!
  const [socials, products, links, connects] = await Promise.all([
    db.from('page_socials').select('id, platform, handle').eq('page_id', page.id).order('position'),
    db
      .from('page_products')
      .select('id, title, category, price, currency, is_free, cta_text, url, description, image_url')
      .eq('page_id', page.id)
      .order('position'),
    db.from('page_links').select('id, title, url').eq('page_id', page.id).order('position'),
    db.from('page_connects').select('id, kind, label, value').eq('page_id', page.id).order('position'),
  ])

  return {
    id: page.id,
    profile: toProfile(
      page,
      (socials.data ?? []) as SocialRow[],
      (products.data ?? []) as ProductRow[],
      (links.data ?? []) as LinkRow[],
      (connects.data ?? []) as ConnectRow[],
    ),
  }
}

/** Reads one published page and its content. Returns null when the handle is unknown. */
export async function fetchPublicPage(username: string): Promise<PublicPage | null> {
  const db = backend
  if (!db) return null

  const { data, error } = await db
    .from('pages')
    .select('*')
    .eq('username', username.trim().toLowerCase())
    .maybeSingle()

  if (error || !data) return null
  return hydrate(data as PageRow)
}

/** Reads the signed-in creator's own page, draft included. */
export async function fetchMyPage(userId: string): Promise<PublicPage | null> {
  const db = backend
  if (!db) return null

  const { data, error } = await db.from('pages').select('*').eq('owner_id', userId).maybeSingle()
  if (error || !data) return null
  return hydrate(data as PageRow)
}

export async function isHandleAvailable(handle: string): Promise<boolean> {
  const db = backend
  if (!db) return true
  const { data, error } = await db.rpc('handle_taken', { candidate: handle })
  if (error) return false
  return data !== true
}

function pageFields(profile: Profile) {
  return {
    username: profile.username.trim().toLowerCase(),
    name: profile.name,
    bio: profile.bio,
    photo_url: profile.photo,
    published: profile.published,
    domain: profile.domain,
    domain_status: profile.domainStatus,
    theme: profile.appearance.theme,
    accent: profile.appearance.accent,
    motion: profile.appearance.motion,
    two_factor: profile.security.twoFactor,
  }
}

// The studio edits whole lists at once, so the simplest correct write is to
// replace a page's children rather than diff them.
async function writeContent(pageId: string, profile: Profile): Promise<string | null> {
  const db = backend!
  const tables = ['page_socials', 'page_products', 'page_links', 'page_connects'] as const

  for (const table of tables) {
    const { error } = await db.from(table).delete().eq('page_id', pageId)
    if (error) return error.message
  }

  const writes = [
    profile.socials.length > 0
      ? db.from('page_socials').insert(
          profile.socials.map((social, index) => ({
            page_id: pageId,
            platform: social.platform,
            handle: social.handle,
            position: index,
          })),
        )
      : null,
    profile.products.length > 0
      ? db.from('page_products').insert(
          profile.products.map((product, index) => ({
            page_id: pageId,
            title: product.title,
            category: product.category,
            price: product.isFree ? 0 : product.price,
            currency: product.currency,
            is_free: product.isFree,
            cta_text: product.ctaText,
            url: product.url,
            description: product.description,
            image_url: product.image,
            position: index,
          })),
        )
      : null,
    profile.links.length > 0
      ? db.from('page_links').insert(
          profile.links.map((link, index) => ({
            page_id: pageId,
            title: link.title,
            url: link.url,
            position: index,
          })),
        )
      : null,
    profile.connects.length > 0
      ? db.from('page_connects').insert(
          profile.connects.map((connect, index) => ({
            page_id: pageId,
            kind: connect.kind,
            label: connect.label,
            value: connect.value,
            position: index,
          })),
        )
      : null,
  ].filter((request) => request !== null)

  const results = await Promise.all(writes.map((request) => request!))
  const failed = results.find((result) => result.error)
  return failed?.error?.message ?? null
}

/** Creates a page for a new creator. Returns its id, or the reason it failed. */
export async function createPage(
  profile: Profile,
  userId: string,
): Promise<{ id?: string; error?: string }> {
  const db = backend
  if (!db) return { error: 'No backend configured.' }

  const { data, error } = await db
    .from('pages')
    .insert({ ...pageFields(profile), owner_id: userId })
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'Could not create the page.' }

  const id = (data as { id: string }).id
  const contentError = await writeContent(id, profile)
  return contentError ? { id, error: contentError } : { id }
}

/** Writes the whole page back. Returns an error message, or null on success. */
export async function savePage(pageId: string, profile: Profile): Promise<string | null> {
  const db = backend
  if (!db) return null

  const { error } = await db.from('pages').update(pageFields(profile)).eq('id', pageId)
  if (error) return error.message
  return writeContent(pageId, profile)
}

function device(): 'mobile' | 'desktop' | 'tablet' {
  const width = typeof window === 'undefined' ? 1200 : window.innerWidth
  if (width < 640) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

function source(): string {
  if (typeof document === 'undefined' || !document.referrer) return 'direct'
  try {
    return new URL(document.referrer).hostname.replace(/^www\./, '') || 'direct'
  } catch {
    return 'direct'
  }
}

/**
 * Writes one view or click for a page. Fire and forget: a visitor should never
 * notice analytics failing, and anonymous visitors are allowed to insert here.
 */
export function recordPageEvent(
  pageId: string,
  kind: 'view' | 'click',
  target?: { kind: EventTarget; id: string },
): void {
  if (!backend) return
  void backend
    .from('page_events')
    .insert({
      page_id: pageId,
      kind,
      target_kind: target?.kind ?? null,
      target_id: target?.id ?? null,
      source: source(),
      device: device(),
    })
    .then(({ error }) => {
      if (error && import.meta.env.DEV) console.warn('[leenkr] event dropped:', error.message)
    })
}
