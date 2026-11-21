import { useCallback, useEffect, useState } from 'react'
import { ArrowUpRight, ShieldCheck } from 'lucide-react'
import PlatformIcon from '../../components/PlatformIcon'
import VerifiedBadge from '../../components/VerifiedBadge'
import { usePageTitle } from '../../lib/title'
import { when } from '../../lib/admin'
import {
  FOLLOWER_MIN,
  listAdminVerifications,
  reviewVerification,
  type AdminVerificationList,
  type AdminVerificationRow,
} from '../../lib/verification'
import { PLATFORMS } from '../../store'

const STATES = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Declined' },
  { key: 'all', label: 'All' },
]

const count = (value: number) => new Intl.NumberFormat('en-US').format(value)

export default function AdminVerifications() {
  usePageTitle('Verification · Admin · Leenkr')
  const [state, setState] = useState('pending')
  const [data, setData] = useState<AdminVerificationList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [note, setNote] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await listAdminVerifications(state))
      setError('')
    } catch (problem) {
      setError((problem as Error).message)
    } finally {
      setLoading(false)
    }
  }, [state])

  useEffect(() => {
    void load()
  }, [load])

  const review = async (row: AdminVerificationRow, decision: 'approved' | 'rejected') => {
    setBusy(row.id)
    try {
      await reviewVerification(row.id, decision, rejectId === row.id ? note : '')
      setRejectId(null)
      setNote('')
      await load()
    } catch (problem) {
      setError((problem as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const rows = data?.rows ?? []

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Operators</p>
          <h1 className="page-title">Verification</h1>
          <p className="page-sub">
            Creators who asked for the check. Approving turns the badge on for their page.
          </p>
        </div>
        <span className="pill live">
          <ShieldCheck size={13} /> {count(FOLLOWER_MIN)} followers
        </span>
      </header>

      <div className="admin-toolbar">
        <div className="switch admin-filters" role="group" aria-label="Filter requests">
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
        <p className="empty-panel">Loading requests…</p>
      ) : rows.length === 0 ? (
        <p className="empty-panel">
          {state === 'pending' ? 'No requests waiting.' : 'No requests with that status.'}
        </p>
      ) : (
        <ul className="admin-list">
          {rows.map((row) => (
            <li className="admin-row verification" key={row.id}>
              <div className="admin-who">
                <p className="admin-name">
                  {row.name || row.username}
                  {row.verified ? <VerifiedBadge size={17} /> : null}
                </p>
                <p className="admin-meta">@{row.username}</p>
                <p className="admin-meta">
                  Request: {row.email}
                  {row.ownerEmail && row.ownerEmail !== row.email ? ` · Account: ${row.ownerEmail}` : ''}
                </p>
                <p className="admin-meta">Sent {when(row.submittedAt)}</p>
              </div>

              <div className="verify-social-summary admin-verify-socials">
                {row.socials.map((social) => (
                  <div className="verify-summary-row" key={social.platform}>
                    <span className="platform-tag">
                      <PlatformIcon platform={social.platform} size={13} />
                      {PLATFORMS.find((entry) => entry.key === social.platform)?.label}
                    </span>
                    <span className="verify-summary-handle">@{social.handle}</span>
                    <span
                      className={
                        social.followers >= FOLLOWER_MIN ? 'verify-count ok' : 'verify-count'
                      }
                    >
                      {count(social.followers)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="admin-actions">
                <span className={row.status === 'pending' ? 'pill' : 'pill live'}>
                  {row.status}
                </span>
                <a
                  className="btn ghost sm"
                  href={`/${row.username}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View <ArrowUpRight size={14} />
                </a>
                {row.status !== 'approved' ? (
                  <button
                    type="button"
                    className="btn dark sm"
                    disabled={busy === row.id}
                    onClick={() => void review(row, 'approved')}
                  >
                    Approve
                  </button>
                ) : null}
                {row.status !== 'rejected' ? (
                  <button
                    type="button"
                    className="btn ghost sm"
                    disabled={busy === row.id}
                    onClick={() => {
                      setRejectId(rejectId === row.id ? null : row.id)
                      setNote('')
                    }}
                  >
                    {row.status === 'approved' ? 'Remove verification' : 'Decline'}
                  </button>
                ) : null}
              </div>

              {row.note ? <p className="admin-suspend-note">Note: {row.note}</p> : null}

              {rejectId === row.id ? (
                <div className="admin-suspend">
                  <div className="field">
                    <label htmlFor={`note-${row.id}`}>Reason (optional)</label>
                    <input
                      id={`note-${row.id}`}
                      className="input"
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="Why was this declined?"
                    />
                  </div>
                  <div className="admin-actions">
                    <button
                      type="button"
                      className="btn dark sm"
                      disabled={busy === row.id}
                      onClick={() => void review(row, 'rejected')}
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      className="btn ghost sm"
                      onClick={() => {
                        setRejectId(null)
                        setNote('')
                      }}
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
    </div>
  )
}
