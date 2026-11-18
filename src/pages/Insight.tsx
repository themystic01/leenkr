import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  Eye,
  Monitor,
  MousePointerClick,
  Smartphone,
  Tablet,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { fetchEarnings } from '../lib/api'
import { money } from '../lib/payments'
import { useSession } from '../auth'
import { hasBackend } from '../lib/supabase'
import { insightFor, useProfile, type InsightRange } from '../store'
import { usePageTitle } from '../lib/title'

const RANGES: { value: InsightRange; label: string }[] = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
]

const DEVICE_ICONS = { mobile: Smartphone, desktop: Monitor, tablet: Tablet } as const

const pct = (value: number) => `${Math.round(value * 100)}%`

export default function Insight() {
  usePageTitle('Insight · Leenkr')
  const { profile } = useProfile()
  const { session } = useSession()
  const [range, setRange] = useState<InsightRange>(7)
  const numbers = insightFor(profile, range)
  const [sales, setSales] = useState<{ revenue: number; orders: number; top: string | null }>({
    revenue: 0,
    orders: 0,
    top: null,
  })

  // Earnings come from real orders, so the traffic story and the money story
  // sit on the same screen.
  useEffect(() => {
    if (!hasBackend || !session) return
    let alive = true
    fetchEarnings(session.userId).then((data) => {
      if (!alive || !data) return
      const paid = data.orders.filter((order) => order.status === 'paid')
      const byProduct = new Map<string, number>()
      for (const order of paid) {
        byProduct.set(order.productTitle, (byProduct.get(order.productTitle) ?? 0) + order.creatorNet)
      }
      const top = [...byProduct.entries()].sort((a, b) => b[1] - a[1])[0]
      setSales({
        revenue: paid.reduce((sum, order) => sum + order.creatorNet, 0),
        orders: paid.length,
        top: top ? top[0] : null,
      })
    })
    return () => {
      alive = false
    }
  }, [session])

  if (numbers.views === 0) {
    return (
      <div className="page">
        <header className="page-head">
          <div>
            <p className="eyebrow">Creator Studio</p>
            <h1 className="page-title">Insight</h1>
            <p className="page-sub">Where people find your page, what they click, and the screens they click from.</p>
          </div>
        </header>
        <div className="card empty-card">
          <span className="empty-mark">L</span>
          <p>
            Nothing to count yet. Publish your page and share the link once — the numbers start here as soon
            as somebody arrives.
          </p>
          <Link className="btn ghost" to="/dashboard/profile">
            Work on your page
          </Link>
        </div>
      </div>
    )
  }

  const peak = numbers.daily.reduce((most, day) => Math.max(most, day.value), 0) || 1
  const totalClicks = numbers.clicks.toLocaleString()

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Creator Studio</p>
          <h1 className="page-title">Insight</h1>
          <p className="page-sub">Where people find your page, what they click, and the screens they click from.</p>
        </div>
        <div className="head-actions">
          <div className="range-switch" role="group" aria-label="Date range">
            {RANGES.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={range === option.value}
                onClick={() => setRange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="earn-strip" aria-label="Earnings from products">
        <div className="earn-strip-main">
          <span className="earn-label">
            <Wallet size={14} /> Product earnings
          </span>
          <p className="earn-strip-value">{money(sales.revenue)}</p>
          <p className="earn-note">
            {sales.orders === 0
              ? 'No paid orders yet'
              : `${sales.orders} paid ${sales.orders === 1 ? 'order' : 'orders'}${sales.top ? ` · top seller ${sales.top}` : ''}`}
          </p>
        </div>
        <Link className="btn ghost sm" to="/dashboard/earnings">
          Open earnings
          <ArrowUpRight size={14} />
        </Link>
      </section>

      <section className="stat-grid" aria-label="Totals">
        <div className="stat">
          <p className="stat-label">
            <Eye size={13} /> Page views
          </p>
          <p className="stat-value">{numbers.views.toLocaleString()}</p>
          <p className="stat-hint">Last {range} days</p>
        </div>
        <div className="stat">
          <p className="stat-label">
            <MousePointerClick size={13} /> Link clicks
          </p>
          <p className="stat-value">{numbers.clicks.toLocaleString()}</p>
          <p className="stat-hint">Across {numbers.links.length} links</p>
        </div>
        <div className="stat">
          <p className="stat-label">
            <TrendingUp size={13} /> Click rate
          </p>
          <p className="stat-value">{pct(numbers.clickRate)}</p>
          <p className="stat-hint">Visitors who clicked</p>
        </div>
        <div className="stat">
          <p className="stat-label">Busiest day</p>
          <p className="stat-value stat-value--word">{numbers.busiest?.label ?? '—'}</p>
          <p className="stat-hint">{numbers.busiest ? `${numbers.busiest.value} clicks` : 'No clicks yet'}</p>
        </div>
      </section>

      <section className="card insight-card">
        <div className="card-head">
          <h2 className="card-title">Clicks per day</h2>
          <span className="card-note">Peak {peak}</span>
        </div>
        <div
          className="insight-chart"
          role="img"
          aria-label={`Link clicks over the last ${range} days, ${totalClicks} in total, peaking at ${peak} on ${numbers.busiest?.label ?? 'no day'}`}
        >
          {numbers.daily.map((day, index) => (
            <div className="insight-day" key={day.key}>
              <span className="insight-col">
                <span
                  className="insight-bar"
                  style={{ height: `${Math.max(2, Math.round((day.value / peak) * 100))}%` }}
                  title={`${day.label}: ${day.value} clicks`}
                />
              </span>
              <span className="insight-day-label">
                {range === 7 || index % 5 === 0 || index === numbers.daily.length - 1 ? day.label : ''}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="insight-pair">
        <section className="card">
          <div className="card-head">
            <h2 className="card-title">Where clicks come from</h2>
            <span className="card-note">{totalClicks} clicks</span>
          </div>
          <ul className="insight-list">
            {numbers.sources.map((source) => (
              <li className="insight-row" key={source.key}>
                <span className="insight-row-label">{source.label}</span>
                <span className="insight-track">
                  <span className="insight-fill" style={{ width: pct(source.share) }} />
                </span>
                <span className="insight-row-value">
                  {pct(source.share)}
                  <span className="insight-row-count">{source.clicks}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <div className="card-head">
            <h2 className="card-title">Devices used</h2>
            <span className="card-note">{numbers.views.toLocaleString()} visits</span>
          </div>
          <ul className="insight-list">
            {numbers.devices.map((device) => {
              const Icon = DEVICE_ICONS[device.key]
              return (
                <li className="insight-row" key={device.key}>
                  <span className="insight-row-label insight-device">
                    <Icon size={15} />
                    {device.label}
                  </span>
                  <span className="insight-track">
                    <span className="insight-fill insight-fill--ink" style={{ width: pct(device.share) }} />
                  </span>
                  <span className="insight-row-value">
                    {pct(device.share)}
                    <span className="insight-row-count">{device.visits.toLocaleString()}</span>
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      <section className="card insight-card">
        <div className="card-head">
          <h2 className="card-title">Most clicked links</h2>
          <Link className="card-note insight-edit" to="/dashboard/links">
            Edit links
            <ArrowUpRight size={13} />
          </Link>
        </div>
        {numbers.links.length === 0 ? (
          <p className="block-note">No links on the page yet — add one and it shows up here.</p>
        ) : (
          <ul className="insight-links">
            {numbers.links.map((link, index) => (
              <li className="insight-link-row" key={link.id}>
                <span className="insight-link-rank">{index + 1}</span>
                <span className="insight-link-body">
                  <span className="insight-link-title">{link.title}</span>
                  <span className="insight-link-host">{link.host}</span>
                </span>
                <span className="insight-link-bar">
                  <span style={{ width: pct(link.share) }} />
                </span>
                <span className="insight-link-value">{link.clicks.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="insight-note">
        Preview build — these figures are generated from your page so the screen behaves like the real one.
        Live counting starts when the studio is connected to a server.
      </p>
    </div>
  )
}
