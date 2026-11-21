import { useEffect, useState } from 'react'
import { ArrowUpRight, ShieldCheck } from 'lucide-react'
import { usePageTitle } from '../../lib/title'
import {
  adminStats,
  listAdminOrders,
  money,
  when,
  type AdminOrderRow,
  type AdminStats,
} from '../../lib/admin'

export default function AdminOverview() {
  usePageTitle('Admin · Leenkr')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [orders, setOrders] = useState<AdminOrderRow[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    Promise.all([adminStats(), listAdminOrders({ limit: 6 })])
      .then(([nextStats, recent]) => {
        if (!alive) return
        setStats(nextStats)
        setOrders(recent.rows)
      })
      .catch((problem: Error) => alive && setError(problem.message))
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Operators</p>
          <h1 className="page-title">Overview</h1>
          <p className="page-sub">Creators, sales and payouts across Leenkr.</p>
        </div>
        <span className="pill live">
          <ShieldCheck size={13} /> Admin
        </span>
      </header>

      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="stat-grid">
        <div className="stat">
          <span className="stat-label">Creators</span>
          <p className="stat-value">{stats?.creators ?? '—'}</p>
          <p className="stat-hint">{stats ? `${stats.pages} pages` : 'Loading'}</p>
        </div>
        <div className="stat">
          <span className="stat-label">Live pages</span>
          <p className="stat-value">{stats?.live ?? '—'}</p>
          <p className="stat-hint">
            {stats ? `${stats.draft} draft · ${stats.suspended} suspended` : 'Loading'}
          </p>
        </div>
        <div className="stat">
          <span className="stat-label">Paid orders</span>
          <p className="stat-value">{stats?.paidOrders ?? '—'}</p>
          <p className="stat-hint">{stats ? `${stats.last7Orders} in the last 7 days` : 'Loading'}</p>
        </div>
        <div className="stat">
          <span className="stat-label">Gross sales</span>
          <p className="stat-value">{stats ? money(stats.gross) : '—'}</p>
          <p className="stat-hint">
            {stats ? `${money(stats.platformFees)} platform fees` : 'Loading'}
          </p>
        </div>
      </div>

      <section className="card">
        <div className="card-head">
          <h2 className="card-title">Money in flight</h2>
          <span className="card-note">{stats?.last7Orders ?? 0} orders this week</span>
        </div>
        <dl className="admin-money">
          <div>
            <dt>Last 7 days</dt>
            <dd>{stats ? money(stats.last7Gross) : '—'}</dd>
          </div>
          <div>
            <dt>Pending payouts</dt>
            <dd>{stats?.pendingPayouts ?? '—'}</dd>
          </div>
          <div>
            <dt>Awaiting transfer</dt>
            <dd>{stats ? money(stats.pendingPayoutAmount) : '—'}</dd>
          </div>
        </dl>
      </section>

      <section className="card admin-recent">
        <div className="card-head">
          <h2 className="card-title">Recent orders</h2>
          <a className="btn ghost sm" href="/admin/orders">
            All orders <ArrowUpRight size={15} />
          </a>
        </div>

        {orders.length === 0 && !error ? (
          <p className="empty-panel">No orders yet.</p>
        ) : (
          <ul className="admin-list">
            {orders.map((order) => (
              <li className="admin-row order" key={order.id}>
                <div className="admin-who">
                  <p className="admin-name">{order.productTitle}</p>
                  <p className="admin-meta">
                    @{order.creatorUsername} · {order.reference}
                  </p>
                </div>
                <div className="admin-who">
                  <p className="admin-name small">{order.buyerEmail}</p>
                  <p className="admin-meta">{when(order.createdAt)}</p>
                </div>
                <dl className="admin-figures">
                  <div>
                    <dt>Paid</dt>
                    <dd>{money(order.amount, order.currency)}</dd>
                  </div>
                  <div>
                    <dt>Net</dt>
                    <dd>{money(order.creatorNet, order.currency)}</dd>
                  </div>
                </dl>
                <span className={order.status === 'paid' ? 'pill live' : 'pill'}>
                  {order.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
