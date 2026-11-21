import { useCallback, useEffect, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import VerifiedBadge from '../../components/VerifiedBadge'
import { usePageTitle } from '../../lib/title'
import {
  listAdminPages,
  money,
  setAdminPage,
  when,
  type AdminList,
  type AdminPageRow,
} from '../../lib/admin'

const STATES = [
  { key: 'all', label: 'All' },
  { key: 'live', label: 'Live' },
  { key: 'draft', label: 'Draft' },
  { key: 'suspended', label: 'Suspended' },
  { key: 'unverified', label: 'Unverified' },
]

const PAGE_SIZE = 20

function stateLabel(row: AdminPageRow) {
  if (row.suspendedAt) return { label: 'Suspended', className: 'pill' }
  if (row.published) return { label: 'Live', className: 'pill live' }
  return { label: 'Draft', className: 'pill' }
}

export default function AdminCreators() {
  usePageTitle('Creators · Admin · Leenkr')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [state, setState] = useState('all')
  const [pageIndex, setPageIndex] = useState(0)
  const [data, setData] = useState<AdminList<AdminPageRow> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [suspendId, setSuspendId] = useState<string | null>(null)
  const [reason, setReason] = useState('')

  // Typing shouldn't fire a query per keystroke.
  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(search), 250)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPageIndex(0)
  }, [query, state])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const next = await listAdminPages({
        search: query,
        state,
        limit: PAGE_SIZE,
        offset: pageIndex * PAGE_SIZE,
      })
      setData(next)
      setError('')
    } catch (problem) {
      setError((problem as Error).message)
    } finally {
      setLoading(false)
    }
  }, [query, state, pageIndex])

  useEffect(() => {
    void load()
  }, [load])

  const change = async (
    row: AdminPageRow,
    patch: { published?: boolean; verified?: boolean; suspend?: boolean; reason?: string },
  ) => {
    setBusy(row.id)
    try {
      await setAdminPage(row.id, {
        published: patch.published ?? row.published,
        verified: patch.verified ?? row.verified,
        suspend: patch.suspend ?? Boolean(row.suspendedAt),
        reason: patch.reason ?? row.suspendedReason ?? '',
      })
      setSuspendId(null)
      setReason('')
      await load()
    } catch (problem) {
      setError((problem as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  const start = total === 0 ? 0 : pageIndex * PAGE_SIZE + 1
  const end = Math.min((pageIndex + 1) * PAGE_SIZE, total)

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Operators</p>
          <h1 className="page-title">Creators</h1>
          <p className="page-sub">
            Every page on Leenkr. Verification and takedowns are applied from here.
          </p>
        </div>
      </header>

      <div className="admin-toolbar">
        <input
          className="input admin-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, handle or email"
          aria-label="Search creators"
        />
        <div className="switch admin-filters" role="group" aria-label="Filter creators">
          {STATES.map((entry) => (
            <button
              key={entry.key}
              type="button"
              className="switch-item"
              aria-pressed={state === entry.key}
              onClick={() => setState(entry.key)}
            >
              {entry.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}

      {loading && rows.length === 0 ? (
        <p className="empty-panel">Loading creators…</p>
      ) : rows.length === 0 ? (
        <p className="empty-panel">No pages match that filter.</p>
      ) : (
        <ul className="admin-list">
          {rows.map((row) => {
            const pill = stateLabel(row)
            const suspended = Boolean(row.suspendedAt)
            return (
              <li className="admin-row" key={row.id}>
                <div className="admin-who">
                  <p className="admin-name">
                    {row.name || row.username}
                    {row.verified ? <VerifiedBadge size={17} /> : null}
                  </p>
                  <p className="admin-meta">
                    @{row.username} · {row.ownerEmail ?? 'no account email'}
                  </p>
                </div>

                <span className={pill.className}>{pill.label}</span>

                <dl className="admin-figures">
                  <div>
                    <dt>Products</dt>
                    <dd>{row.products}</dd>
                  </div>
                  <div>
                    <dt>Sales</dt>
                    <dd>{row.sales}</dd>
                  </div>
                  <div>
                    <dt>GMV</dt>
                    <dd>{money(row.gmv)}</dd>
                  </div>
                  <div>
                    <dt>Joined</dt>
                    <dd>{when(row.createdAt)}</dd>
                  </div>
                </dl>

                <div className="admin-actions">
                  <a
                    className="btn ghost sm"
                    href={`/${row.username}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View <ArrowUpRight size={14} />
                  </a>
                  <button
                    type="button"
                    className="btn ghost sm"
                    disabled={busy === row.id}
                    onClick={() => void change(row, { verified: !row.verified })}
                  >
                    {row.verified ? 'Unverify' : 'Verify'}
                  </button>
                  <button
                    type="button"
                    className="btn ghost sm"
                    disabled={busy === row.id || suspended}
                    onClick={() => void change(row, { published: !row.published })}
                  >
                    {row.published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    type="button"
                    className="btn ghost sm"
                    disabled={busy === row.id}
                    onClick={() => {
                      if (suspended) {
                        void change(row, { suspend: false })
                        return
                      }
                      setSuspendId(suspendId === row.id ? null : row.id)
                      setReason('')
                    }}
                  >
                    {suspended ? 'Restore' : 'Suspend'}
                  </button>
                </div>

                {suspended ? (
                  <p className="admin-suspend-note">
                    Suspended {when(row.suspendedAt)}
                    {row.suspendedReason ? ` · ${row.suspendedReason}` : ''}
                  </p>
                ) : null}

                {suspendId === row.id ? (
                  <div className="admin-suspend">
                    <div className="field">
                      <label htmlFor={`reason-${row.id}`}>Reason (optional)</label>
                      <input
                        id={`reason-${row.id}`}
                        className="input"
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        placeholder="Why is this page coming down?"
                      />
                    </div>
                    <p className="admin-note">
                      The public page stops resolving, and its downloads and checkout are
                      refused, until you restore it.
                    </p>
                    <div className="admin-actions">
                      <button
                        type="button"
                        className="btn dark sm"
                        disabled={busy === row.id}
                        onClick={() => void change(row, { suspend: true, reason })}
                      >
                        Suspend page
                      </button>
                      <button
                        type="button"
                        className="btn ghost sm"
                        onClick={() => {
                          setSuspendId(null)
                          setReason('')
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}

      <div className="admin-pager">
        <span>
          {total === 0 ? 'No pages' : `Showing ${start}–${end} of ${total}`}
        </span>
        <div className="admin-actions">
          <button
            type="button"
            className="btn ghost sm"
            disabled={pageIndex === 0 || loading}
            onClick={() => setPageIndex((value) => Math.max(0, value - 1))}
          >
            Previous
          </button>
          <button
            type="button"
            className="btn ghost sm"
            disabled={loading || end >= total}
            onClick={() => setPageIndex((value) => value + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
