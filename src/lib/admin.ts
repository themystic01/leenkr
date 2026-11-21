import { useEffect, useState } from 'react'
import { useSession } from '../auth'
import { CURRENCIES, type Currency } from '../store'
import { backend } from './supabase'

/**
 * Operator console data. Every call lands on a security-definer RPC that checks
 * admin_users server-side, so the browser holds no service key and the checks
 * here only shape the UI.
 */

export type AdminStats = {
  creators: number
  pages: number
  live: number
  draft: number
  suspended: number
  paidOrders: number
  gross: number
  platformFees: number
  pendingPayouts: number
  pendingPayoutAmount: number
  last7Orders: number
  last7Gross: number
}

export type AdminPageRow = {
  id: string
  username: string
  name: string | null
  ownerId: string
  ownerEmail: string | null
  published: boolean
  verified: boolean
  suspendedAt: string | null
  suspendedReason: string | null
  createdAt: string
  products: number
  sales: number
  gmv: number
}

export type AdminOrderRow = {
  id: string
  productId: string
  productTitle: string
  creatorUsername: string
  creatorEmail: string | null
  buyerEmail: string
  buyerName: string | null
  amount: number | string
  currency: Currency
  platformFee: number | string
  gatewayFee: number | string
  creatorNet: number | string
  provider: string
  reference: string
  status: string
  paidAt: string | null
  createdAt: string
}

export type AdminPayoutRow = {
  id: string
  ownerId: string
  creatorEmail: string | null
  creatorUsername: string | null
  amount: number | string
  currency: Currency
  status: string
  provider: string | null
  reference: string | null
  note: string | null
  requestedAt: string
  processedAt: string | null
  bankName: string | null
  accountNumber: string | null
  accountName: string | null
}

export type AdminList<T> = { total: number; rows: T[] }

export function money(amount: number | string, currency: Currency = 'NGN') {
  const symbol = CURRENCIES.find((entry) => entry.code === currency)?.symbol ?? '₦'
  const value = typeof amount === 'number' ? amount : Number(amount)
  return `${symbol}${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(
    Number.isFinite(value) ? value : 0,
  )}`
}

export function when(iso: string | null) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function friendly(message: string) {
  if (/forbidden/i.test(message)) return 'You don’t have access.'
  if (/not_found/i.test(message)) return 'That record no longer exists.'
  if (/invalid_status/i.test(message)) return 'That status isn’t allowed.'
  if (/no backend/i.test(message)) return 'The backend isn’t configured.'
  return message
}

async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const db = backend
  if (!db) throw new Error('No backend configured.')
  const { data, error } = await db.rpc(name, args)
  if (error) throw new Error(friendly(error.message))
  return data as T
}

export const fetchAdminMe = () => rpc<boolean>('admin_me')

export const adminStats = () => rpc<AdminStats>('admin_stats')

export function listAdminPages(
  params: { search?: string; state?: string; limit?: number; offset?: number } = {},
) {
  return rpc<AdminList<AdminPageRow>>('admin_pages', {
    p_search: params.search?.trim() || null,
    p_state: params.state ?? 'all',
    p_limit: params.limit ?? 20,
    p_offset: params.offset ?? 0,
  })
}

export function setAdminPage(
  id: string,
  input: { published?: boolean; verified?: boolean; suspend?: boolean; reason?: string },
) {
  return rpc<{ ok: true }>('admin_set_page', {
    p_page: id,
    p_published: input.published ?? null,
    p_verified: input.verified ?? null,
    p_suspend: input.suspend ?? null,
    p_reason: input.reason ?? null,
  })
}

export function listAdminOrders(
  params: { search?: string; limit?: number; offset?: number } = {},
) {
  return rpc<AdminList<AdminOrderRow>>('admin_orders', {
    p_search: params.search?.trim() || null,
    p_limit: params.limit ?? 20,
    p_offset: params.offset ?? 0,
  })
}

export function listAdminPayouts(
  params: { status?: string; limit?: number; offset?: number } = {},
) {
  return rpc<AdminList<AdminPayoutRow>>('admin_payouts', {
    p_status: params.status ?? 'pending',
    p_limit: params.limit ?? 20,
    p_offset: params.offset ?? 0,
  })
}

export function setAdminPayout(
  id: string,
  status: 'paid' | 'rejected',
  input: { reference?: string; note?: string } = {},
) {
  return rpc<{ ok: true }>('admin_set_payout', {
    p_payout: id,
    p_status: status,
    p_reference: input.reference ?? null,
    p_note: input.note ?? null,
  })
}

/** Resolves admin_users membership once per signed-in account. */
export function useIsAdmin() {
  const { session } = useSession()
  const userId = session?.userId ?? null
  const [state, setState] = useState({ ready: false, isAdmin: false })

  useEffect(() => {
    if (!userId) {
      setState({ ready: true, isAdmin: false })
      return
    }
    let alive = true
    setState((current) => ({ ...current, ready: false }))
    fetchAdminMe()
      .then((isAdmin) => {
        if (alive) setState({ ready: true, isAdmin })
      })
      .catch(() => {
        if (alive) setState({ ready: true, isAdmin: false })
      })
    return () => {
      alive = false
    }
  }, [userId])

  return state
}
