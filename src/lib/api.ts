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
  slug: string | null
  title: string
  category: string
  price: number | string
  currency: Currency
  is_free: boolean
  cta_text: string
  description: string
  image_url: string | null
  images: string[] | null
  fulfilment: string | null
  external_url: string | null
  file_name: string | null
  file_size: number | string | null
  file_type: string | null
  purchase_count: number
}
type FileRow = { product_id: string; file_key: string }
type LinkRow = { id: string; title: string; url: string }
type ConnectRow = { id: string; kind: ConnectKind; label: string; value: string }

export type EventTarget = 'link' | 'product' | 'connect' | 'social'

// Public reads must never ask for the private storage key, so both paths select
// this list and the owner's key comes from product_files separately.
const PRODUCT_COLUMNS =
  'id, slug, title, category, price, currency, is_free, cta_text, description, image_url, images, fulfilment, external_url, file_name, file_size, file_type, purchase_count'

function toProduct(row: ProductRow, fileKey: string | null = null): Product {
  return {
    id: row.id,
    slug: row.slug || row.id,
    title: row.title,
    category: row.category,
    price: Number(row.price),
    currency: row.currency,
    isFree: row.is_free,
    ctaText: row.cta_text,
    description: row.description,
    image: row.image_url,
    images: row.images ?? [],
    fulfilment: row.fulfilment === 'external' ? 'external' : 'default',
    externalUrl: row.external_url,
    fileName: row.file_name,
    fileSize: row.file_size === null ? null : Number(row.file_size),
    fileType: row.file_type,
    fileKey,
    purchases: row.purchase_count ?? 0,
  }
}

function toProfile(
  page: PageRow,
  socials: SocialRow[],
  products: ProductRow[],
  links: LinkRow[],
  connects: ConnectRow[],
  files: FileRow[] = [],
): Profile {
  const keys = new Map(files.map((file) => [file.product_id, file.file_key]))
  return {
    name: page.name,
    username: page.username,
    email: '',
    bio: page.bio,
    photo: page.photo_url,
    socials: socials.map((row) => ({ id: row.id, platform: row.platform, handle: row.handle })),
    products: products.map((row) => toProduct(row, keys.get(row.id) ?? null)),
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

async function hydrate(page: PageRow, withFiles: boolean): Promise<PublicPage> {
  const db = backend!
  const [socials, products, links, connects, files] = await Promise.all([
    db.from('page_socials').select('id, platform, handle').eq('page_id', page.id).order('position'),
    db.from('page_products').select(PRODUCT_COLUMNS).eq('page_id', page.id).order('position'),
    db.from('page_links').select('id, title, url').eq('page_id', page.id).order('position'),
    db.from('page_connects').select('id, kind, label, value').eq('page_id', page.id).order('position'),
    withFiles
      ? db.from('product_files').select('product_id, file_key').eq('page_id', page.id)
      : Promise.resolve({ data: [] }),
  ])

  return {
    id: page.id,
    profile: toProfile(
      page,
      (socials.data ?? []) as SocialRow[],
      (products.data ?? []) as ProductRow[],
      (links.data ?? []) as LinkRow[],
      (connects.data ?? []) as ConnectRow[],
      (files.data ?? []) as FileRow[],
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
  return hydrate(data as PageRow, false)
}

/** Reads the signed-in creator's own page, draft included. */
export async function fetchMyPage(userId: string): Promise<PublicPage | null> {
  const db = backend
  if (!db) return null

  const { data, error } = await db.from('pages').select('*').eq('owner_id', userId).maybeSingle()
  if (error || !data) return null
  return hydrate(data as PageRow, true)
}

/** One product on a published page, found by its handle and slug. */
export async function fetchProduct(
  username: string,
  slug: string,
): Promise<{ pageId: string; product: Product } | null> {
  const db = backend
  if (!db) return null

  const { data: page } = await db
    .from('pages')
    .select('id, published')
    .eq('username', username.trim().toLowerCase())
    .maybeSingle()

  if (!page) return null

  const pageId = (page as { id: string }).id
  // Slug is the public address; an older product may only have its id.
  const { data, error } = await db
    .from('page_products')
    .select(PRODUCT_COLUMNS)
    .eq('page_id', pageId)
    .eq(UUID.test(slug) ? 'id' : 'slug', slug)
    .maybeSingle()

  if (error || !data) return null
  return { pageId: (page as { id: string }).id, product: toProduct(data as ProductRow) }
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
    verified: profile.verified,
    domain: profile.domain,
    domain_status: profile.domainStatus,
    theme: profile.appearance.theme,
    accent: profile.appearance.accent,
    motion: profile.appearance.motion,
    two_factor: profile.security.twoFactor,
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function productFields(pageId: string, product: Product, position: number) {
  return {
    id: product.id,
    page_id: pageId,
    slug: product.slug,
    title: product.title,
    category: product.category,
    price: product.isFree ? 0 : product.price,
    currency: product.currency,
    is_free: product.isFree,
    cta_text: product.ctaText,
    description: product.description,
    image_url: product.image,
    images: product.images,
    fulfilment: product.fulfilment,
    external_url: product.externalUrl,
    file_name: product.fileName,
    file_size: product.fileSize,
    file_type: product.fileType,
    position,
  }
}

// The studio edits whole lists at once. Products are upserted by id instead of
// recreated, because orders and stored files point at those ids.
async function writeContent(pageId: string, profile: Profile): Promise<string | null> {
  const db = backend!

  const replaceSimple = async <T>(
    table: 'page_socials' | 'page_links' | 'page_connects',
    rows: T[],
  ): Promise<string | null> => {
    const { error } = await db.from(table).delete().eq('page_id', pageId)
    if (error) return error.message
    if (rows.length === 0) return null
    const { error: insertError } = await db.from(table).insert(rows as never)
    return insertError?.message ?? null
  }

  const socialError = await replaceSimple(
    'page_socials',
    profile.socials.map((social, index) => ({
      page_id: pageId,
      platform: social.platform,
      handle: social.handle,
      position: index,
    })),
  )
  if (socialError) return socialError

  const linkError = await replaceSimple(
    'page_links',
    profile.links.map((link, index) => ({
      page_id: pageId,
      title: link.title,
      url: link.url,
      position: index,
    })),
  )
  if (linkError) return linkError

  const connectError = await replaceSimple(
    'page_connects',
    profile.connects.map((connect, index) => ({
      page_id: pageId,
      kind: connect.kind,
      label: connect.label,
      value: connect.value,
      position: index,
    })),
  )
  if (connectError) return connectError

  // Products: remove the ones that are gone, upsert the rest.
  const kept = profile.products.filter((product) => UUID.test(product.id)).map((product) => product.id)
  let removal = db.from('page_products').delete().eq('page_id', pageId)
  if (kept.length > 0) removal = removal.not('id', 'in', `(${kept.join(',')})`)
  const { error: removeError } = await removal
  if (removeError) return removeError.message

  if (profile.products.length > 0) {
    const rows = profile.products.map((product, index) => productFields(pageId, product, index))
    const { error } = await db.from('page_products').upsert(rows, { onConflict: 'id' })
    if (error) return error.message
  }

  // The private storage keys live in their own table so public reads never see them.
  const { error: fileClearError } = await db.from('product_files').delete().eq('page_id', pageId)
  if (fileClearError) return fileClearError.message

  const fileRows = profile.products
    .filter((product) => product.fileKey && UUID.test(product.id))
    .map((product) => ({
      product_id: product.id,
      page_id: pageId,
      file_key: product.fileKey as string,
      file_name: product.fileName ?? 'download',
      file_size: product.fileSize ?? 0,
      file_type: product.fileType,
    }))

  if (fileRows.length > 0) {
    const { error } = await db.from('product_files').insert(fileRows)
    if (error) return error.message
  }

  return null
}

/** A handle two people want is the one write error worth naming out loud. */
function writeError(error: { message: string; code?: string }): string {
  if (error.code === '23505' && /username/i.test(error.message)) {
    return 'That handle is already taken. Try another.'
  }
  return error.message
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

  if (error || !data) return { error: error ? writeError(error) : 'Could not create the page.' }

  const id = (data as { id: string }).id
  const contentError = await writeContent(id, profile)
  return contentError ? { id, error: contentError } : { id }
}

/** Writes the whole page back. Returns an error message, or null on success. */
export async function savePage(pageId: string, profile: Profile): Promise<string | null> {
  const db = backend
  if (!db) return null

  const { error } = await db.from('pages').update(pageFields(profile)).eq('id', pageId)
  if (error) return writeError(error)
  return writeContent(pageId, profile)
}

/* ------------------------------- checkout -------------------------------- */

export type Purchase =
  | {
      ok: true
      orderId: string
      reference: string
      token: string
      amount: number
      currency: Currency
    }
  | { ok: false; error: string }

/**
 * Records a completed payment. The database computes the fees from the product
 * price, so the browser can never name its own total, and it hands back the
 * download token that unlocks the file.
 */
export async function purchaseProduct(
  productId: string,
  email: string,
  name: string,
  provider: string,
): Promise<Purchase> {
  const db = backend
  if (!db) return { ok: false, error: 'No backend configured.' }

  const { data, error } = await db.rpc('purchase_product', {
    p_product: productId,
    p_email: email.trim(),
    p_name: name.trim() || null,
    p_provider: provider,
  })
  if (error) return { ok: false, error: error.message }

  const result = data as {
    error?: string
    order_id?: string
    reference?: string
    download_token?: string
    amount?: number
    currency?: Currency
  }
  if (result.error || !result.order_id || !result.download_token) {
    return { ok: false, error: result.error ?? 'Could not complete the purchase.' }
  }

  return {
    ok: true,
    orderId: result.order_id,
    reference: result.reference ?? '',
    token: result.download_token,
    amount: Number(result.amount ?? 0),
    currency: (result.currency ?? 'NGN') as Currency,
  }
}

/** Counts a download and confirms the caller is allowed to have the file. */
export async function recordDownload(
  productId: string,
  token: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = backend
  if (!db) return { ok: false, error: 'No backend configured.' }

  const { data, error } = await db.rpc('record_download', {
    p_product: productId,
    p_token: token,
  })
  if (error) return { ok: false, error: error.message }
  const result = data as { ok?: boolean; error?: string }
  if (result.error) return { ok: false, error: result.error }
  return { ok: true }
}

/* -------------------------------- earnings -------------------------------- */

export type OrderRow = {
  id: string
  productId: string
  productTitle: string
  buyerEmail: string
  amount: number
  currency: Currency
  platformFee: number
  gatewayFee: number
  creatorNet: number
  status: string
  reference: string
  createdAt: string
}

export type PayoutRow = {
  id: string
  amount: number
  currency: Currency
  status: string
  reference: string
  note: string | null
  requestedAt: string
  processedAt: string | null
}

export type PayoutAccount = {
  id: string
  bankCode: string
  bankName: string
  accountNumber: string
  accountName: string
}

export type Earnings = {
  orders: OrderRow[]
  payouts: PayoutRow[]
  account: PayoutAccount | null
}

/** Everything the earnings screen needs: sales, withdrawals and where money lands. */
export async function fetchEarnings(userId: string): Promise<Earnings | null> {
  const db = backend
  if (!db) return null

  const [orders, payouts, accounts] = await Promise.all([
    db
      .from('page_orders')
      .select(
        'id, product_id, buyer_email, amount, currency, platform_fee, gateway_fee, creator_net, status, reference, created_at, page_products(title)',
      )
      .order('created_at', { ascending: false })
      .limit(200),
    db
      .from('payouts')
      .select('id, amount, currency, status, reference, note, requested_at, processed_at')
      .order('requested_at', { ascending: false })
      .limit(50),
    db
      .from('payout_accounts')
      .select('id, bank_code, bank_name, account_number, account_name')
      .eq('owner_id', userId)
      .limit(1),
  ])

  const orderRows = (orders.data ?? []) as unknown as Array<{
    id: string
    product_id: string
    buyer_email: string
    amount: number | string
    currency: Currency
    platform_fee: number | string
    gateway_fee: number | string
    creator_net: number | string
    status: string
    reference: string
    created_at: string
    page_products: { title: string } | { title: string }[] | null
  }>

  const payoutRows = (payouts.data ?? []) as Array<{
    id: string
    amount: number | string
    currency: Currency
    status: string
    reference: string
    note: string | null
    requested_at: string
    processed_at: string | null
  }>

  const accountRow = (accounts.data ?? [])[0] as
    | {
        id: string
        bank_code: string
        bank_name: string
        account_number: string
        account_name: string
      }
    | undefined

  return {
    orders: orderRows.map((row) => {
      const product = Array.isArray(row.page_products) ? row.page_products[0] : row.page_products
      return {
        id: row.id,
        productId: row.product_id,
        productTitle: product?.title ?? 'Product',
        buyerEmail: row.buyer_email,
        amount: Number(row.amount),
        currency: row.currency,
        platformFee: Number(row.platform_fee),
        gatewayFee: Number(row.gateway_fee),
        creatorNet: Number(row.creator_net),
        status: row.status,
        reference: row.reference,
        createdAt: row.created_at,
      }
    }),
    payouts: payoutRows.map((row) => ({
      id: row.id,
      amount: Number(row.amount),
      currency: row.currency,
      status: row.status,
      reference: row.reference,
      note: row.note,
      requestedAt: row.requested_at,
      processedAt: row.processed_at,
    })),
    account: accountRow
      ? {
          id: accountRow.id,
          bankCode: accountRow.bank_code,
          bankName: accountRow.bank_name,
          accountNumber: accountRow.account_number,
          accountName: accountRow.account_name,
        }
      : null,
  }
}

export async function savePayoutAccount(
  userId: string,
  input: { bankCode: string; bankName: string; accountNumber: string; accountName: string },
): Promise<string | null> {
  const db = backend
  if (!db) return 'No backend configured.'

  const { error } = await db.from('payout_accounts').upsert(
    {
      owner_id: userId,
      bank_code: input.bankCode,
      bank_name: input.bankName,
      account_number: input.accountNumber.replace(/\s+/g, ''),
      account_name: input.accountName,
      is_default: true,
    },
    { onConflict: 'id' },
  )
  return error?.message ?? null
}

export async function requestPayout(
  accountId: string | null,
  amount: number,
  note: string,
): Promise<{ ok: true; reference: string } | { ok: false; error: string }> {
  const db = backend
  if (!db) return { ok: false, error: 'No backend configured.' }

  const { data, error } = await db.rpc('request_payout', {
    p_account: accountId,
    p_amount: amount,
    p_note: note,
  })
  if (error) return { ok: false, error: error.message }
  const result = data as { error?: string; reference?: string }
  if (result.error) return { ok: false, error: result.error }
  return { ok: true, reference: result.reference ?? '' }
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
