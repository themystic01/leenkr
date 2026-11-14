import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowUpRight, Calendar, LayoutDashboard, Link2, Mail, Package, Send, Sparkles } from 'lucide-react'
import Avatar from '../components/Avatar'
import TabSwitch, { ContentPanel, type ContentTab } from '../components/TabSwitch'
import VerifiedBadge from '../components/VerifiedBadge'
import { hostOf, socialUrl, useProfile } from '../store'

export default function PublicProfile() {
  const { username } = useParams()
  const { profile } = useProfile()
  const [tab, setTab] = useState<ContentTab>('products')

  const dashboardLink = (
    <div className="public-top">
      <Link className="public-home" to="/">
        <LayoutDashboard size={14} />
        Dashboard
      </Link>
    </div>
  )

  if (profile.username !== username) {
    return (
      <div className="notice-page">
        {dashboardLink}
        <div className="notice-card">
          <span className="empty-mark">L</span>
          <h1 className="page-title">Page not found</h1>
          <p className="page-copy">There’s no Leenkr page at leenkr.com/{username} yet.</p>
          <Link className="btn" to="/">
            Go to Creator Studio
          </Link>
        </div>
      </div>
    )
  }

  if (!profile.published) {
    return (
      <div className="notice-page">
        {dashboardLink}
        <div className="notice-card">
          <span className="empty-mark">L</span>
          <h1 className="page-title">This page isn’t live yet</h1>
          <p className="page-copy">Finish the last step and publish it — then this URL is yours.</p>
          <Link className="btn" to="/profile">
            Finish setup
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="public-page">
      {dashboardLink}
      <div className="profile-wrap">
        <header className="profile-head">
          <Avatar name={profile.name} photo={profile.photo} size={104} ring />
          <h1>
            <span>{profile.name}</span>
            {profile.verified ? <VerifiedBadge size={34} /> : null}
          </h1>
          <p className="handle">@{profile.username}</p>
          {profile.bio ? <p className="bio">{profile.bio}</p> : null}

          {profile.socials.length > 0 ? (
            <div className="social-row">
              {profile.socials.map((social) => (
                <a
                  key={social.id}
                  className="social-pill"
                  href={socialUrl(social)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="social-mono">{social.platform.charAt(0).toUpperCase()}</span>
                  {social.handle ? '@' + social.handle.replace(/^@/, '') : 'Profile'}
                </a>
              ))}
            </div>
          ) : null}
        </header>

        <section className="profile-body">
          <div className="switch-wrap">
            <TabSwitch value={tab} onChange={setTab} />
          </div>

          <ContentPanel tab={tab}>
            {tab === 'products' ? (
              profile.products.length > 0 ? (
                <div className="product-list">
                  {profile.products.map((product) => (
                    <article className="product-card" key={product.id}>
                      <div className="product-art">{product.title.charAt(0).toUpperCase()}</div>
                      <div className="product-info">
                        <h3>{product.title}</h3>
                        {product.blurb ? <p>{product.blurb}</p> : null}
                        <div className="product-foot">
                          <span className="price">{product.price}</span>
                          <a className="btn sm" href={product.url} target="_blank" rel="noreferrer">
                            Get it
                            <ArrowUpRight size={14} />
                          </a>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="empty-panel">Nothing for sale right now.</p>
              )
            ) : null}

            {tab === 'links' ? (
              profile.links.length > 0 ? (
                <div className="link-list">
                  {profile.links.map((link) => (
                    <a className="link-row" key={link.id} href={link.url} target="_blank" rel="noreferrer">
                      <span className="link-ico">
                        <Link2 size={15} />
                      </span>
                      <span className="link-body">
                        <span className="link-title">{link.title}</span>
                        <span className="link-host">{hostOf(link.url)}</span>
                      </span>
                      <ArrowUpRight size={16} />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="empty-panel">No links posted yet.</p>
              )
            ) : null}

            {tab === 'connect' ? (
              profile.connects.length > 0 ? (
                <div className="connect-grid">
                  {profile.connects.map((item) => {
                    const href =
                      item.kind === 'email' && !item.value.startsWith('http')
                        ? `mailto:${item.value}`
                        : item.value || '#'
                    const Icon =
                      item.kind === 'call'
                        ? Calendar
                        : item.kind === 'newsletter'
                          ? Send
                          : item.kind === 'collab'
                            ? Sparkles
                            : Mail
                    return (
                      <a className="connect-card" key={item.id} href={href} target="_blank" rel="noreferrer">
                        <span className="link-ico">
                          <Icon size={16} />
                        </span>
                        <span className="link-body">
                          <span className="connect-label">{item.label}</span>
                          <span className="connect-value">{item.value.replace(/^mailto:/, '')}</span>
                        </span>
                        <ArrowUpRight size={16} />
                      </a>
                    )
                  })}
                </div>
              ) : (
                <p className="empty-panel">No contact options yet.</p>
              )
            ) : null}
          </ContentPanel>
        </section>

        <footer className="profile-foot">
          <Link to="/">
            <Package size={12} /> Made with Leenkr
          </Link>
        </footer>
      </div>
    </div>
  )
}
