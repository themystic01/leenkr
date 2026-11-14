import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Check, ImagePlus, Package, Trash2, X } from 'lucide-react'
import { downscaleImage } from '../lib/image'
import {
  CURRENCIES,
  PRODUCT_CATEGORIES,
  formatAmount,
  uid,
  type Currency,
  type Product,
} from '../store'

function blankProduct(): Product {
  return {
    id: '',
    title: '',
    category: 'Design Assets',
    price: 0,
    currency: 'USD',
    isFree: false,
    ctaText: 'Download',
    url: '',
    description: '',
    image: null,
  }
}

// Groups digits as they are typed: 1000 reads back as 1,000. A trailing dot or
// up to two decimals are kept so a price can still be typed as 49.99.
function formatPriceInput(raw: string) {
  const cleaned = raw.replace(/[^0-9.]/g, '')
  const dot = cleaned.indexOf('.')
  const whole = (dot === -1 ? cleaned : cleaned.slice(0, dot)).replace(/^0+(?=\d)/, '')
  const fraction = dot === -1 ? '' : cleaned.slice(dot + 1).replace(/\./g, '').slice(0, 2)
  const grouped = whole ? formatAmount(Number(whole)) : ''
  if (dot === -1) return grouped
  return `${grouped || '0'}.${fraction}`
}

function withProtocol(url: string) {
  const trimmed = url.trim()
  if (!trimmed) return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

type Props = {
  open: boolean
  product: Product | null
  onClose: () => void
  onSave: (product: Product) => void
}

export default function ProductDialog({ open, product, onClose, onSave }: Props) {
  const [draft, setDraft] = useState<Product>(() => product ?? blankProduct())
  const [priceText, setPriceText] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [photoError, setPhotoError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setDraft(product ?? blankProduct())
    setPriceText(product && !product.isFree && product.price ? formatAmount(product.price) : '')
    setErrors({})
    setPhotoError('')
    const timer = window.setTimeout(() => titleRef.current?.focus(), 30)
    return () => window.clearTimeout(timer)
  }, [open, product])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  const patch = <K extends keyof Product>(key: K, value: Product[K]) =>
    setDraft((current) => ({ ...current, [key]: value }))

  const onImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setPhotoError('')
    if (!file.type.startsWith('image/')) {
      setPhotoError('That file is not an image.')
      return
    }
    try {
      const image = await downscaleImage(file)
      patch('image', image)
      setErrors((current) => ({ ...current, image: '' }))
    } catch {
      setPhotoError('Could not read that image. Try another one.')
    }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const next: Product = {
      ...draft,
      id: draft.id || uid('p'),
      title: draft.title.trim(),
      ctaText: draft.ctaText.trim(),
      url: withProtocol(draft.url),
      description: draft.description.trim(),
    }

    const found: Record<string, string> = {}
    if (!next.image) found.image = 'Add a product image.'
    if (!next.title) found.title = 'Give the product a title.'
    if (!next.category) found.category = 'Pick a category.'
    if (!next.isFree && (!Number.isFinite(next.price) || next.price < 0)) {
      found.price = 'Enter a price, or mark the product free.'
    }
    if (!next.ctaText) found.ctaText = 'Add button text.'
    if (!next.url) found.url = 'Add a destination URL.'

    setErrors(found)
    if (Object.keys(found).length > 0) return
    onSave(next)
  }

  return (
    <div
      className="dialog-scrim"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-dialog-title"
        ref={dialogRef}
      >
        <header className="dialog-head">
          <span className="dialog-mark">
            <Package size={18} />
          </span>
          <div>
            <h2 id="product-dialog-title">{product ? 'Edit product' : 'New product'}</h2>
            <p className="dialog-sub">
              {product ? 'Update digital product details in your showcase.' : 'Add a digital product to your showcase.'}
            </p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </header>

        <form className="dialog-form" onSubmit={submit} noValidate>
          <div className="dialog-body">
            <div className="field">
              <label htmlFor="product-image">
                Product image
                <span className="req" aria-hidden="true" />
              </label>
              <div className="image-picker">
                <button
                  type="button"
                  className="image-drop"
                  onClick={() => fileRef.current?.click()}
                  aria-label={draft.image ? 'Replace product image' : 'Upload product image'}
                >
                  {draft.image ? (
                    <img src={draft.image} alt="" />
                  ) : (
                    <span className="placeholder">
                      <ImagePlus size={20} />
                      Upload image
                    </span>
                  )}
                </button>
                <div className="image-actions">
                  <button type="button" className="btn ghost sm" onClick={() => fileRef.current?.click()}>
                    {draft.image ? 'Replace' : 'Upload'}
                  </button>
                  {draft.image ? (
                    <button type="button" className="btn ghost sm" onClick={() => patch('image', null)}>
                      <Trash2 size={14} />
                      Remove
                    </button>
                  ) : null}
                  <span className="hint">Square works best.</span>
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={onImage} />
                </div>
              </div>
              {errors.image ? <p className="field-error">{errors.image}</p> : null}
              {photoError ? <p className="field-error">{photoError}</p> : null}
            </div>

            <div className="field-grid">
              <div className="field">
                <label htmlFor="product-title">
                  Product title
                  <span className="req" aria-hidden="true" />
                </label>
                <input
                  id="product-title"
                  ref={titleRef}
                  className="input"
                  value={draft.title}
                  placeholder="Carousel Bundle"
                  onChange={(e) => patch('title', e.target.value)}
                />
                {errors.title ? <p className="field-error">{errors.title}</p> : null}
              </div>

              <div className="field">
                <label htmlFor="product-category">
                  Category
                  <span className="req" aria-hidden="true" />
                </label>
                <select
                  id="product-category"
                  className="input"
                  value={draft.category}
                  onChange={(e) => patch('category', e.target.value)}
                >
                  {PRODUCT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category ? <p className="field-error">{errors.category}</p> : null}
              </div>
            </div>

            <div className="field">
              <label htmlFor="product-price">
                Price
                <span className="req" aria-hidden="true" />
              </label>
              <div className="price-row">
                <select
                  className="input currency"
                  aria-label="Currency"
                  value={draft.currency}
                  onChange={(e) => patch('currency', e.target.value as Currency)}
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.label}
                    </option>
                  ))}
                </select>
                <input
                  id="product-price"
                  className="input"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  disabled={draft.isFree}
                  placeholder={draft.isFree ? 'Free' : '1,000'}
                  value={draft.isFree ? '' : priceText}
                  onChange={(e) => {
                    const formatted = formatPriceInput(e.target.value)
                    setPriceText(formatted)
                    const numeric = Number(formatted.replace(/,/g, ''))
                    patch('price', Number.isFinite(numeric) ? numeric : 0)
                  }}
                />
              </div>
              <label className="check-line" htmlFor="product-free">
                <input
                  id="product-free"
                  type="checkbox"
                  checked={draft.isFree}
                  onChange={(e) => {
                    patch('isFree', e.target.checked)
                    if (!e.target.checked) setPriceText(draft.price ? formatAmount(draft.price) : '')
                  }}
                />
                This product is free
              </label>
              {errors.price ? <p className="field-error">{errors.price}</p> : null}
            </div>

            <div className="field">
              <label htmlFor="product-cta">
                CTA button text
                <span className="req" aria-hidden="true" />
              </label>
              <input
                id="product-cta"
                className="input"
                value={draft.ctaText}
                placeholder="Download"
                onChange={(e) => patch('ctaText', e.target.value)}
              />
              {errors.ctaText ? <p className="field-error">{errors.ctaText}</p> : null}
            </div>

            <div className="field">
              <label htmlFor="product-url">
                Destination URL
                <span className="req" aria-hidden="true" />
              </label>
              <input
                id="product-url"
                className="input"
                value={draft.url}
                placeholder="https://leenkr.vercel.app"
                onChange={(e) => patch('url', e.target.value)}
              />
              {errors.url ? <p className="field-error">{errors.url}</p> : null}
            </div>

            <div className="field">
              <label htmlFor="product-description">Product description (optional)</label>
              <textarea
                id="product-description"
                className="input"
                value={draft.description}
                placeholder="Key features, deliverables, tokens or software requirements…"
                onChange={(e) => patch('description', e.target.value)}
              />
            </div>
          </div>

          <footer className="dialog-foot">
            <button type="button" className="btn ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn">
              <Check size={16} />
              Save changes
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
