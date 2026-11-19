import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Download,
  FileArchive,
  ImageOff,
  Lock,
  Package,
  ShoppingBag,
} from 'lucide-react'
import CheckoutDialog from '../components/CheckoutDialog'
import InstallBanner from '../components/InstallBanner'
import { fetchProduct, recordPageEvent } from '../lib/api'
import { startDownload, savedOrderToken } from '../lib/download'
import { money } from '../lib/payments'
import { formatBytes, hostOf, priceLabel, useProfile, type Product } from '../store'

function FileBadge({ product }: { product: Product }) {
  if (product.fulfilment === 'external') {
    return (
      <span className="detail-file">
        <ArrowUpRight size={15} />
        Hosted at {hostOf(product.externalUrl ?? '') || 'an external link'}
      </span>
    )
  }
  if (!product.fileName) {
    return (
      <span className="detail-file off">
        <Package size={15} /> No file attached yet
      </span>
    )
  }
  const size = formatBytes(product.fileSize)
  return (
    <span className="detail-file">
      <FileArchive size={15} />
      {product.fileName}
      {size ? ` · ${size}` : ''}
    </span>
  )
}

export default function ProductDetail() {
  const { username, slug } = useParams()
  const local = useProfile()
  const [product, setProduct] = useState<Product | null>(null)
  const [pageId, setPageId] = useState<string | null>(null)
  const [missing, setMissing] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [checkout, setCheckout] = useState(false)
  const [shot, setShot] = useState(0)
  const counted = useRef(false)

  useEffect(() => {
    if (!username || !slug) return
    let alive = true
    setProduct(null)
    setMissing(false)

    // The demo store answers when there is no backend.
    const localProduct = local.profile.products.find(
      (item) => item.slug === slug && local.profile.username === username,
    )
    if (!localProduct) {
      // fall through to the database read
    }

    fetchProduct(username, slug)
      .then((found) => {
        if (!alive) return
        if (found) {
          setProduct(found.product)
          setPageId(found.pageId)
          setToken(savedOrderToken(found.product.id))
        } else if (localProduct) {
          setProduct(localProduct)
          setPageId(null)
          setToken(null)
        } else {
          setMissing(true)
        }
      })
      .catch(() => alive && setMissing(true))

    return () => {
      alive = false
    }
  }, [username, slug, local.profile.username, local.profile.products])

  useEffect(() => {
    if (!pageId || !product || counted.current) return
    counted.current = true
    recordPageEvent(pageId, 'click', { kind: 'product', id: product.id })
  }, [pageId, product])

  const download = async () => {
    if (!product) return
    setBusy(true)
    setNotice('')
    const result = await startDownload(product.id, product.isFree ? null : token)
    setBusy(false)
    if (!result.ok) {
      setNotice(result.error)
      return
    }
    setProduct((current) => (current ? { ...current, downloads: current.downloads + 1 } : current))
  }

  const notFound = (
    <div className="notice-page">
      <div className="notice-card">
        <span className="empty-mark">L</span>
        <h1 className="page-title">Product not found</h1>
        <p className="page-copy">
          There is no product at leenkr.app/{username}/p/{slug}.
        </p>
        <Link className="btn" to={username ? `/${username}` : '/'}>
          Back to the page
        </Link>
      </div>
    </div>
  )

  if (missing) return notFound
  if (!product) {
    return (
      <div className="notice-page">
        <div className="notice-card">
          <span className="empty-mark">L</span>
          <p className="page-copy">Loading product…</p>
        </div>
      </div>
    )
  }

  const gallery = [product.image, ...product.images].filter(Boolean) as string[]
  const active = gallery[Math.min(shot, gallery.length - 1)]
  const owned = Boolean(token)
  const external = product.fulfilment === 'external' && Boolean(product.externalUrl)
  const action = product.isFree ? 'Download free' : owned ? 'Download' : `Buy ${priceLabel(product)}`

  return (
    <div
      className="detail-page"
      style={{ '--yellow': local.profile.appearance.accent === 'electric' ? '#dfff00' : 'var(--yellow)' } as CSSProperties}
    >
      <div className="detail-top">
        <Link className="public-home" to={`/${username ?? ''}`}>
          <ArrowLeft size={14} />
          Back to @{username}
        </Link>
      </div>

      <article className="detail-wrap">
        <div className="detail-media">
          <div className="detail-shot">
            {active ? (
              <img src={active} alt="" onError={() => setShot((current) => current + 0)} />
            ) : (
              <span className="detail-shot-fallback">
                <ImageOff size={22} />
                No image
              </span>
            )}
          </div>
          {gallery.length > 1 ? (
            <div className="detail-thumbs">
              {gallery.map((image, index) => (
                <button
                  key={image.slice(-16) + index}
                  type="button"
                  className={index === shot ? 'detail-thumb on' : 'detail-thumb'}
                  onClick={() => setShot(index)}
                  aria-label={`Image ${index + 1}`}
                >
                  <img src={image} alt="" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="detail-body">
          <p className="eyebrow">
            {product.category} · {external ? 'Hosted elsewhere' : 'Digital download'}
          </p>
          <h1 className="detail-title">{product.title}</h1>
          <p className="detail-price">{priceLabel(product)}</p>

          <div className="detail-counts">
            <span>
              <ShoppingBag size={14} /> {product.purchases.toLocaleString()}{' '}
              {product.purchases === 1 ? 'purchase' : 'purchases'}
            </span>
            <span>
              <Download size={14} /> {product.downloads.toLocaleString()}{' '}
              {product.downloads === 1 ? 'download' : 'downloads'}
            </span>
          </div>

          {product.description ? <p className="detail-copy">{product.description}</p> : null}

          <FileBadge product={product} />

          <div className="detail-actions">
            {external ? (
              <a className="btn" href={product.externalUrl ?? ''} target="_blank" rel="noreferrer">
                {product.ctaText || 'Get it'}
                <ArrowUpRight size={16} />
              </a>
            ) : product.isFree || owned ? (
              <button type="button" className="btn" onClick={download} disabled={busy}>
                {busy ? 'Preparing…' : owned && !product.isFree ? 'Download' : product.ctaText || action}
                <Download size={16} />
              </button>
            ) : (
              <button type="button" className="btn" onClick={() => setCheckout(true)}>
                {product.ctaText || 'Buy now'} · {money(product.price, product.currency)}
                <ArrowUpRight size={16} />
              </button>
            )}
            {!external && !product.isFree && owned ? (
              <span className="detail-owned">
                <Check size={14} /> Purchased — download anytime
              </span>
            ) : null}
          </div>

          {notice ? <p className="detail-notice">{notice}</p> : null}

          {external ? (
            <p className="detail-guard">
              <ArrowUpRight size={13} /> This product is delivered on another site. Leenkr does not take
              payment for it.
            </p>
          ) : (
            <p className="detail-guard">
              <Lock size={13} /> The file is private. It is only handed out after payment, through a link that
              expires in minutes.
            </p>
          )}
        </div>
      </article>

      <InstallBanner />

      <footer className="profile-foot">
        <Link to="/">
          <Package size={12} /> Made with Leenkr
        </Link>
      </footer>

      <CheckoutDialog
        open={checkout}
        product={product}
        onClose={() => setCheckout(false)}
        onPaid={(nextToken) => {
          setToken(nextToken)
          setProduct((current) =>
            current ? { ...current, purchases: current.purchases + 1 } : current,
          )
        }}
      />
    </div>
  )
}
