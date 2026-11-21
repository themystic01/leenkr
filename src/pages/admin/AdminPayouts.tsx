import { useCallback, useEffect, useState } from 'react'
import { usePageTitle } from '../../lib/title'
import {
  listAdminPayouts,
  money,
  setAdminPayout,
  when,
  type AdminList,
  type AdminPayoutRow,
} from '../../lib/admin'

const FILTERS = [
  { key: 'pending', label: 'Pending' },
  { key: 'paid', label: 'Paid' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
]

const PAGE_SIZE = 20

export default function AdminPayouts() {
  usePageTitle('Payouts · Admin · Leenkr')
  const [status, setStatus] = useState('pending')
  const [pageIndex, setPageIndex] = useState(0)
  const [data, setData] = useState<AdminList<AdminPayoutRow> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    setPageIndex(0)
  }, [status])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const next = await listAdminPayouts({
        status,
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
  }, [status, pageIndex])

  useEffect(() => {
    void load()
  }, [load])

  const settle = async (row: AdminPayoutRow, next: 'paid' | 'rejected') => {
    setBusy(row.id)
    try {
      await setAdminPayout(row.id, next, { reference, note })
      setOpenId(null)
      setReference('')
      setNote('')
      await load()
    } catch (problem) {
      setError((problem as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const open = (row: AdminPayoutRow) => {
    setOpenId(openId === row.id ? null : row.id)
    setReference('')
    setNote('')
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
          <h1 className="page-title">Payouts</h1>
          <p className="page-sub">
            Withdrawal requests from creators. Mark one paid once the transfer lands.
          </p>
        </div>
      </header>

      <div className="admin-toolbar">
        <div className="switch admin-filters" role="group" aria-label="Filter payouts">
          {FILTERS.map((entry) => (
            <button
              key={entry.key}
              type="button"
              className="switch-item"
              aria-pressed={status === entry.key}
              onClick={() => setStatus(entry.key)}
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
        <p className="empty-panel">Loading payouts…</p>
      ) : rows.length === 0 ? (
        <p className="empty-panel">
          {status === 'pending' ? 'No payout requests waiting.' : 'Nothing here yet.'}
        </p>
      ) : (
        <ul className="admin-list">
          {rows.map((row) => (
            <li className="admin-row payout" key={row.id}>
              <div className="admin-who">
                <p className="admin-name small">
                  {row.creatorUsername ? `@${row.creatorUsername}` : 'Creator'}
                </p>
                <p className="admin-meta">{row.creatorEmail ?? row.ownerId}</p>
                <p className="admin-meta">
                  {row.bankName ?? 'No bank on file'}
                  {row.accountNumber ? ` · ${row.accountNumber}` : ''}
                  {row.accountName ? ` · ${row.accountName}` : ''}
                </p>
              </div>

              <dl className="admin-figures">
                <div>
                  <dt>Amount</dt>
                  <dd>{money(row.amount, row.currency)}</dd>
                </div>
                <div>
                  <dt>Requested</dt>
                  <dd>{when(row.requestedAt)}</dd>
                </div>
                <div>
                  <dt>Reference</dt>
                  <dd>{row.reference ?? '—'}</dd>
                </div>
              </dl>

              <span className={row.status === 'paid' ? 'pill live' : 'pill'}>
                {row.status}
              </span>

              {row.status === 'pending' ? (
                <div className="admin-actions">
                  <button
                    type="button"
                    className="btn ghost sm"
                    disabled={busy === row.id}
                    onClick={() => open(row)}
                  >
                    Review
                  </button>
                </div>
              ) : null}

              {row.note ? <p className="admin-suspend-note">{row.note}</p> : null}

              {openId === row.id ? (
                <div className="admin-suspend">
                  <div className="field">
                    <label htmlFor={`reference-${row.id}`}>Transfer reference</label>
                    <input
                      id={`reference-${row.id}`}
                      className="input"
                      value={reference}
                      onChange={(event) => setReference(event.target.value)}
                      placeholder="Bank or gateway reference"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor={`note-${row.id}`}>Note (optional)</label>
                    <input
                      id={`note-${row.id}`}
                      className="input"
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="What happened to this request?"
                    />
                  </div>
                  <div className="admin-actions">
                    <button
                      type="button"
                      className="btn dark sm"
                      disabled={busy === row.id}
                      onClick={() => void settle(row, 'paid')}
                    >
                      Mark paid
                    </button>
                    <button
                      type="button"
                      className="btn ghost sm"
                      disabled={busy === row.id}
                      onClick={() => void settle(row, 'rejected')}
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      className="btn ghost sm"
                      onClick={() => setOpenId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <div className="admin-pager">
        <span>
          {total === 0 ? 'No payouts' : `Showing ${start}–${end} of ${total}`}
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
