import { useCallback, useEffect, useState } from 'react'
import { usePageTitle } from '../../lib/title'
import {
  listAdminOrders,
  money,
  when,
  type AdminList,
  type AdminOrderRow,
} from '../../lib/admin'

const PAGE_SIZE = 20

export default function AdminOrders() {
  usePageTitle('Orders · Admin · Leenkr')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [pageIndex, setPageIndex] = useState(0)
  const [data, setData] = useState<AdminList<AdminOrderRow> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(search), 250)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPageIndex(0)
  }, [query])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const next = await listAdminOrders({
        search: query,
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
  }, [query, pageIndex])

  useEffect(() => {
    void load()
  }, [load])

  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  const start = total === 0 ? 0 : pageIndex * PAGE_SIZE + 1
  const end = Math.min((pageIndex + 1) * PAGE_SIZE, total)

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Operators</p>
          <h1 className="page-title">Orders</h1>
          <p className="page-sub">Every payment recorded on the platform.</p>
        </div>
      </header>

      <div className="admin-toolbar">
        <input
          className="input admin-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search buyer, reference, product or creator"
          aria-label="Search orders"
        />
      </div>

      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}

      {loading && rows.length === 0 ? (
        <p className="empty-panel">Loading orders…</p>
      ) : rows.length === 0 ? (
        <p className="empty-panel">No orders match that search.</p>
      ) : (
        <ul className="admin-list">
          {rows.map((order) => (
            <li className="admin-row order" key={order.id}>
              <div className="admin-who">
                <p className="admin-name">{order.productTitle}</p>
                <p className="admin-meta">
                  @{order.creatorUsername} · {order.reference}
                </p>
              </div>

              <div className="admin-who">
                <p className="admin-name small">{order.buyerEmail}</p>
                <p className="admin-meta">
                  {order.provider} · {when(order.createdAt)}
                </p>
              </div>

              <dl className="admin-figures">
                <div>
                  <dt>Amount</dt>
                  <dd>{money(order.amount, order.currency)}</dd>
                </div>
                <div>
                  <dt>Fees</dt>
                  <dd>
                    {money(
                      Number(order.platformFee) + Number(order.gatewayFee),
                      order.currency,
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Creator net</dt>
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

      <div className="admin-pager">
        <span>{total === 0 ? 'No orders' : `Showing ${start}–${end} of ${total}`}</span>
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
