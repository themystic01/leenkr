import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowUpRight, Calendar, ImageOff, LayoutDashboard, Link2, Mail, Package, Send, Sparkles } from 'lucide-react'
import Avatar from '../components/Avatar'
import InstallBanner from '../components/InstallBanner'
import PlatformIcon from '../components/PlatformIcon'
import TabSwitch, { ContentPanel, type ContentTab } from '../components/TabSwitch'
import VerifiedBadge from '../components/VerifiedBadge'
import { PAGE_ACCENTS, hostOf, priceLabel, socialUrl, useProfile, type Product, type Profile } from '../store'
import { fetchPublicPage, recordPageEvent, type EventTarget as ClickTarget } from '../lib/api'
import { hasBackend } from '../lib/supabase'
import { useSession } from '../auth'

function ProductCard({
  product,
  href,
  onOpen,
}: {
  product: Product
  href: string
  onOpen?: () => void
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = product.image && !imageFailed
  // An external product is never sold or downloaded here, so its price and
  // counts would be a lie; the host tells visitors where it actually lives.
  const external = product.fulfilment === 'external'

  return (
    <article className="product-card">
      <div className="product-art">
        {showImage ? (
          <img src={product.image ?? ''} alt="" onError={() => setImageFailed(true)} />
        ) : (
          product.title.charAt(0).toUpperCase() || 'P'
        )}
      </div>
      <div className="product-info">
        <h3>{product.title}</h3>
        {product.image && imageFailed ? (
          <p className="product-hint">
            <ImageOff size={13} />
            Image couldn’t load — re-upload it in Creator Studio.
          </p>
        ) : null}
        {product.description ? <p>{product.description}</p> : null}
        <div className="product-foot">
          <span className="price">
            {external ? hostOf(product.externalUrl ?? '') || 'External link' : priceLabel(product)}
          </span>
          {external && product.externalUrl ? (
            <a
              className="btn sm"
              href={product.externalUrl}
              target="_blank"
              rel="noreferrer"
              onClick={onOpen}
            >
              {product.ctaText || 'Get it'}
              <ArrowUpRight size={14} />
            </a>
          ) : (
            <Link className="btn sm" to={href} onClick={onOpen}>
              {product.ctaText || 'View'}
              <ArrowUpRight size={14} />
            </Link>
          )}
        </div>
        {external ? null : (
          <p className="product-counts">
            {product.purchases.toLocaleString()} bought · {product.downloads.toLocaleString()} downloaded
          </p>
        )}
      </div>
    </article>
  )
}

export default function PublicProfile() {
  const { username } = useParams()
  const local = useProfile()
  const { session } = useSession()
  const [remote, setRemote] = useState<{ pageId: string | null; profile: Profile | null }>({
    pageId: null,
    profile: null,
  })
  // A page has to be read from the database before it can be called missing,
  // otherwise a slow read flashes "Page not found" over a real profile.
  const [loaded, setLoaded] = useState(!hasBackend)
  const counted = useRef(false)

  useEffect(() => {
    if (!hasBackend || !username) return
    let alive = true
    setLoaded(false)
    fetchPublicPage(username)
      .then((page) => {
        if (!alive) return
        setRemote({ pageId: page?.id ?? null, profile: page?.profile ?? null })
        setLoaded(true)
      })
      .catch(() => {
        if (alive) setLoaded(true)
      })
    return () => {
      alive = false
    }
  }, [username])

  // The local copy is the demo store. With a backend configured, only published
  // database pages are shown, never sample content.
  const localMatch = !hasBackend && local.profile.username === username ? local.profile : null
  const profile = remote.profile ?? localMatch

  useEffect(() => {
    if (!remote.pageId || counted.current) return
    counted.current = true
    recordPageEvent(remote.pageId, 'view')
  }, [remote.pageId])

  const track = (kind: ClickTarget, id: string) => {
    if (remote.pageId) recordPageEvent(remote.pageId, 'click', { kind, id })
  }
  const [tab, setTab] = useState<ContentTab>('products')
  const accent = PAGE_ACCENTS.find((item) => item.key === profile?.appearance.accent)?.color ?? '#dfff00'

  // A visitor has no studio to go back to, so the shortcut belongs to signed-in
  // creators only.
  const dashboardLink = session ? (
    <div className="public-top">
      <Link className="public-home" to="/dashboard">
        <LayoutDashboard size={14} />
        Dashboard
      </Link>
    </div>
  ) : null

  if (!profile && !loaded) {
    return (
      <div className="notice-page">
        {dashboardLink}
        <div className="notice-card">
          <span className="empty-mark">L</span>
          <p className="page-copy">Loading page…</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="notice-page">
        {dashboardLink}
        <div className="notice-card">
          <span className="empty-mark">L</span>
          <h1 className="page-title">This handle is free</h1>
          <p className="page-copy">
            Nobody has claimed leenkr.app/{username} yet. Take it, put your products, your links and your
            inbox on one page.
          </p>
          <Link className="btn" to="/signup">
            Claim @{username} — free
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
          <Link className="btn" to="/dashboard/profile">
            Finish setup
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`public-page theme-${profile.appearance.theme} motion-${profile.appearance.motion}`}
      style={{ '--yellow': accent } as CSSProperties}
    >
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
                  <span className="social-mono">
                    <PlatformIcon platform={social.platform} size={12} />
                  </span>
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
                    <ProductCard
                      key={product.id}
                      product={product}
                      href={`/${profile.username}/p/${product.slug || product.id}`}
                      onOpen={() => track('product', product.id)}
                    />
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
                    <a
                      className="link-row"
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => track('link', link.id)}
                    >
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
                      <a
                        className="connect-card"
                        key={item.id}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => track('connect', item.id)}
                      >
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

        <InstallBanner />

        <footer className="profile-foot">
          <Link to="/">
            <Package size={12} /> Made with Leenkr
          </Link>
        </footer>
      </div>
    </div>
  )
}
