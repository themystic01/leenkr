import { Link } from 'react-router-dom'
import { ArrowUpRight, Check, MousePointerClick, Package, Link2 } from 'lucide-react'
import Avatar from '../components/Avatar'
import { insightFor, useProfile } from '../store'

export default function Overview() {
  const { profile } = useProfile()
  // The same numbers the Insight screen shows for a week, so the two agree.
  const stats = insightFor(profile, 7)
  const firstName = profile.name.trim().split(/\s+/)[0] || 'there'

  const checklist = [
    { label: 'Add a profile photo', done: Boolean(profile.photo), to: '/dashboard/profile' },
    { label: 'Write a bio people remember', done: profile.bio.trim().length > 40, to: '/dashboard/profile' },
    { label: 'Add your socials', done: profile.socials.length >= 2, to: '/dashboard/verify' },
    { label: 'Add a product', done: profile.products.length > 0, to: '/dashboard/products' },
    { label: 'Add a link', done: profile.links.length > 0, to: '/dashboard/links' },
    { label: 'Add a way to connect', done: profile.connects.length > 0, to: '/dashboard/connect' },
    { label: 'Publish your page', done: profile.published, to: '/dashboard/profile' },
  ]
  const done = checklist.filter((item) => item.done).length
  const progress = Math.round((done / checklist.length) * 100)

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Creator Studio</p>
          <h1 className="page-title">Hey {firstName}</h1>
          <p className="page-sub">
            Everything you sell, share and offer — stacked in one page, one section at a time.
          </p>
        </div>
        <div className="head-actions">
          <Link className="btn" to="/dashboard/profile">
            Edit page
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </header>

      <section className="stat-grid" aria-label="Page numbers">
        <Link className="stat stat--link" to="/dashboard/insight">
          <p className="stat-label">Profile views</p>
          <p className="stat-value">{stats.views.toLocaleString()}</p>
          <p className="stat-hint">Last 7 days</p>
          <ArrowUpRight className="stat-go" size={15} />
        </Link>
        <Link className="stat stat--link" to="/dashboard/insight">
          <p className="stat-label">Link clicks</p>
          <p className="stat-value">{stats.clicks.toLocaleString()}</p>
          <p className="stat-hint">
            {stats.views > 0 ? `${Math.round(stats.clickRate * 100)}% of visitors` : 'Waiting on traffic'}
          </p>
          <ArrowUpRight className="stat-go" size={15} />
        </Link>
        <div className="stat">
          <p className="stat-label">Products</p>
          <p className="stat-value">{profile.products.length}</p>
          <p className="stat-hint">In the products tab</p>
        </div>
        <div className="stat">
          <p className="stat-label">Links</p>
          <p className="stat-value">{profile.links.length}</p>
          <p className="stat-hint">In the links tab</p>
        </div>
      </section>

      <div className="overview-grid">
        <section className="card">
          <div className="card-head">
            <h2 className="card-title">Your page</h2>
            <span className={profile.published ? 'pill live' : 'pill'}>{profile.published ? 'Live' : 'Draft'}</span>
          </div>

          <div className="mini">
            <div className="mini-top">
              <Avatar name={profile.name} photo={profile.photo} size={46} />
              <div>
                <p className="mini-name">{profile.name || 'Your name'}</p>
                <p className="mini-handle">@{profile.username || 'username'}</p>
              </div>
            </div>
            <p className="mini-bio">{profile.bio || 'Your bio shows up here.'}</p>
            <div className="mini-tabs">
              <span className="mini-chip on">Products {profile.products.length}</span>
              <span className="mini-chip">Links {profile.links.length}</span>
              <span className="mini-chip">Connect {profile.connects.length}</span>
            </div>
          </div>

          <div className="mini-foot">
            <span className="link-preview">
              leenkr.app/<strong>{profile.username || 'username'}</strong>
            </span>
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <h2 className="card-title">Finish your page</h2>
            <span className="card-note">
              {done}/{checklist.length}
            </span>
          </div>
          <div className="progress">
            <span style={{ width: `${progress}%` }} />
          </div>
          <ul className="check-list">
            {checklist.map((item) => (
              <li key={item.label} className={item.done ? 'check-item done' : 'check-item'}>
                <span className="check-box">
                  <Check size={13} strokeWidth={3} />
                </span>
                <Link className="check-label" to={item.to}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card activity-card">
        <div className="card-head">
          <h2 className="card-title">What lives where</h2>
          <span className="card-note">One section visible at a time</span>
        </div>
        <div className="three-up">
          <div className="three-item">
            <span className="three-icon">
              <Package size={17} />
            </span>
            <p className="three-title">Products</p>
            <p className="three-copy">Digital downloads, kits and paid work. Price and link out.</p>
          </div>
          <div className="three-item">
            <span className="three-icon">
              <Link2 size={17} />
            </span>
            <p className="three-title">Links</p>
            <p className="three-copy">Writing, videos, press — anything worth a click.</p>
          </div>
          <div className="three-item">
            <span className="three-icon">
              <MousePointerClick size={17} />
            </span>
            <p className="three-title">Connect</p>
            <p className="three-copy">Email, bookings, newsletter or a collab request.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
