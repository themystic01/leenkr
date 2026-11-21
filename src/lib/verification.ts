import type { PlatformKey } from '../store'
import { backend } from './supabase'

/**
 * Profile verification. Every call is a security-definer RPC: a creator can
 * only file their own request, and only an operator can review one.
 */

/** The bar a creator has to clear on one platform. */
export const FOLLOWER_MIN = 25000

export type VerificationStatus = 'none' | 'pending' | 'approved' | 'rejected'

export type VerificationSocial = {
  platform: PlatformKey
  handle: string
  followers: number
}

export type MyVerification = {
  id: string | null
  status: VerificationStatus
  email: string
  socials: VerificationSocial[]
  note: string | null
  submittedAt: string | null
  reviewedAt: string | null
}

export type AdminVerificationRow = {
  id: string
  pageId: string
  username: string
  name: string | null
  verified: boolean
  ownerEmail: string | null
  email: string
  socials: VerificationSocial[]
  status: 'pending' | 'approved' | 'rejected'
  note: string | null
  submittedAt: string
  reviewedAt: string | null
}

export type AdminVerificationList = { total: number; rows: AdminVerificationRow[] }

const STATUSES: VerificationStatus[] = ['none', 'pending', 'approved', 'rejected']

/** RPC payloads carry numbers as JSON numbers, but older rows may hold strings. */
export function toSocials(raw: unknown): VerificationSocial[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object')
    .map((entry) => ({
      platform: String(entry.platform ?? 'x') as PlatformKey,
      handle: String(entry.handle ?? '').replace(/^@/, ''),
      followers: Number(entry.followers) || 0,
    }))
    .filter((entry) => entry.handle.length > 0)
}

export function qualifies(socials: VerificationSocial[]) {
  return socials.some((social) => social.handle.trim().length > 0 && social.followers >= FOLLOWER_MIN)
}

function friendly(message: string) {
  if (/below_threshold/i.test(message)) {
    return `One account needs at least ${FOLLOWER_MIN.toLocaleString('en-US')} followers.`
  }
  if (/socials_required/i.test(message)) return 'Add at least one social profile.'
  if (/invalid_email/i.test(message)) return 'Enter a valid email address.'
  if (/no_page/i.test(message)) return 'Create and save your page before asking for the check.'
  if (/signed_out/i.test(message)) return 'Sign in again to continue.'
  if (/forbidden/i.test(message)) return 'You don’t have access.'
  if (/not_found/i.test(message)) return 'That request no longer exists.'
  if (/invalid_status/i.test(message)) return 'That decision isn’t allowed.'
  if (/no backend/i.test(message)) return 'Verification isn’t available in this build.'
  return message
}

async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const db = backend
  if (!db) throw new Error('No backend configured.')
  const { data, error } = await db.rpc(name, args)
  if (error) throw new Error(friendly(error.message))
  return data as T
}

export async function fetchMyVerification(): Promise<MyVerification> {
  const raw = await rpc<Record<string, unknown> | null>('verification_me')
  const status = STATUSES.includes(raw?.status as VerificationStatus)
    ? (raw?.status as VerificationStatus)
    : 'none'
  return {
    id: typeof raw?.id === 'string' ? raw.id : null,
    status,
    email: typeof raw?.email === 'string' ? raw.email : '',
    socials: toSocials(raw?.socials),
    note: typeof raw?.note === 'string' ? raw.note : null,
    submittedAt: typeof raw?.submittedAt === 'string' ? raw.submittedAt : null,
    reviewedAt: typeof raw?.reviewedAt === 'string' ? raw.reviewedAt : null,
  }
}

export function submitVerification(email: string, socials: VerificationSocial[]) {
  return rpc<{ ok: true; id: string }>('verification_submit', {
    p_email: email.trim(),
    p_socials: socials.map((social) => ({
      platform: social.platform,
      handle: social.handle.trim().replace(/^@/, ''),
      followers: Math.max(0, Math.round(social.followers)),
    })),
  })
}

export async function listAdminVerifications(status = 'pending'): Promise<AdminVerificationList> {
  const data = await rpc<{ total: number; rows: Record<string, unknown>[] }>('verification_admin', {
    p_status: status,
    p_limit: 100,
    p_offset: 0,
  })
  return {
    total: Number(data?.total) || 0,
    rows: (data?.rows ?? []).map((row) => ({
      id: String(row.id),
      pageId: String(row.pageId),
      username: String(row.username),
      name: typeof row.name === 'string' ? row.name : null,
      verified: Boolean(row.verified),
      ownerEmail: typeof row.ownerEmail === 'string' ? row.ownerEmail : null,
      email: String(row.email),
      socials: toSocials(row.socials),
      status: row.status as AdminVerificationRow['status'],
      note: typeof row.note === 'string' ? row.note : null,
      submittedAt: String(row.submittedAt),
      reviewedAt: typeof row.reviewedAt === 'string' ? row.reviewedAt : null,
    })),
  }
}

export function reviewVerification(
  id: string,
  status: 'approved' | 'rejected',
  note = '',
) {
  return rpc<{ ok: true }>('verification_review', {
    p_request: id,
    p_status: status,
    p_note: note.trim() || null,
  })
}
