import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  Check,
  FileArchive,
  ImagePlus,
  Loader2,
  Package,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { downscaleImage } from '../lib/image'
import { MAX_FILE_BYTES, StorageUnavailable, uploadProductFile } from '../lib/storage'
import {
  CURRENCIES,
  FULFILMENTS,
  PRODUCT_CATEGORIES,
  formatAmount,
  formatBytes,
  slugify,
  uniqueSlug,
  useProfile,
  type Currency,
  type Fulfilment,
  type Product,
} from '../store'

const MAX_GALLERY = 4

function blankProduct(currency: Currency): Product {
  return {
    id: crypto.randomUUID(),
    slug: '',
    title: '',
    category: 'Design Assets',
    price: 0,
    currency,
    isFree: false,
    ctaText: 'Download',
    description: '',
    image: null,
    images: [],
    fulfilment: 'default',
    externalUrl: null,
    fileName: null,
    fileSize: null,
    fileType: null,
    fileKey: null,
    purchases: 0,
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

type Props = {
  open: boolean
  product: Product | null
  onClose: () => void
  onSave: (product: Product) => void
}

export default function ProductDialog({ open, product, onClose, onSave }: Props) {
  const { profile, pageId } = useProfile()
  const [draft, setDraft] = useState<Product>(() => product ?? blankProduct('NGN'))
  const [priceText, setPriceText] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [photoError, setPhotoError] = useState('')
  const [fileError, setFileError] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setDraft(product ?? blankProduct('NGN'))
    setPriceText(product && !product.isFree && product.price ? formatAmount(product.price) : '')
    setErrors({})
    setPhotoError('')
    setFileError('')
    setUploading(false)
    const timer = window.setTimeout(() => titleRef.current?.focus(), 30)
    return () => window.clearTimeout(timer)
  }, [open, product])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !uploading) onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose, uploading])

  if (!open) return null

  const patch = <K extends keyof Product>(key: K, value: Product[K]) =>
    setDraft((current) => ({ ...current, [key]: value }))

  const readCover = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setPhotoError('')
    if (!file.type.startsWith('image/')) {
      setPhotoError('That file is not an image.')
      return
    }
    try {
      patch('image', await downscaleImage(file, 768))
    } catch {
      setPhotoError('Could not read that image. Try another one.')
    }
  }

  const readGallery = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).slice(0, MAX_GALLERY - draft.images.length)
    if (files.length === 0) return
    setPhotoError('')
    const next: string[] = []
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setPhotoError('One of those files is not an image.')
        continue
      }
      try {
        next.push(await downscaleImage(file, 768))
      } catch {
        setPhotoError('One image could not be read.')
      }
    }
    patch('images', [...draft.images, ...next].slice(0, MAX_GALLERY))
    if (galleryRef.current) galleryRef.current.value = ''
  }

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setFileError('')
    if (file.size > MAX_FILE_BYTES) {
      setFileError('That file is larger than 512 MB.')
      return
    }

    // Without a backend (or a saved page) there is nowhere to upload yet, so the
    // demo store keeps the details only.
    if (!pageId) {
      patch('fileName', file.name)
      patch('fileSize', file.size)
      patch('fileType', file.type || 'application/octet-stream')
      patch('fileKey', null)
      return
    }

    setUploading(true)
    try {
      const uploaded = await uploadProductFile(file, pageId)
      patch('fileName', uploaded.name)
      patch('fileSize', uploaded.size)
      patch('fileType', uploaded.type)
      patch('fileKey', uploaded.key)
    } catch (error) {
      setFileError(
        error instanceof StorageUnavailable
          ? 'Uploads aren’t available right now. Try again in a moment.'
          : error instanceof Error
            ? error.message
            : 'The upload failed.',
      )
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const taken = profile.products
      .filter((item) => item.id !== draft.id)
      .map((item) => item.slug)
    const next: Product = {
      ...draft,
      title: draft.title.trim(),
      ctaText: draft.ctaText.trim() || 'Download',
      description: draft.description.trim(),
      slug: draft.slug.trim() || uniqueSlug(draft.title, taken),
    }

    const found: Record<string, string> = {}
    if (!next.image) found.image = 'Add a product image.'
    if (!next.title) found.title = 'Give the product a title.'
    if (!next.category) found.category = 'Pick a category.'
    if (!next.isFree && (!Number.isFinite(next.price) || next.price <= 0)) {
      found.price = 'Enter a price, or mark the product free.'
    }
    if (!next.ctaText) found.ctaText = 'Add button text.'
    if (next.fulfilment === 'external') {
      if (!next.externalUrl) {
        found.externalUrl = 'Add the link buyers should open.'
      } else if (!/^https?:\/\/[^\s]+$/i.test(next.externalUrl)) {
        found.externalUrl = 'Use a full link that starts with https://'
      }
    } else if (!next.fileName) {
      found.file = 'Upload the digital file buyers get.'
    }

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
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="product-dialog-title">
        <header className="dialog-head">
          <span className="dialog-mark">
            <Package size={18} />
          </span>
          <div>
            <h2 id="product-dialog-title">{product ? 'Edit product' : 'New digital product'}</h2>
            <p className="dialog-sub">
              Sell the file here with Leenkr payments, or point the product at a link you already host.
            </p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </header>

        <form className="dialog-form" onSubmit={submit} noValidate>
          <div className="dialog-body">
            <div className="field">
              <label>
                Cover image
                <span className="req" aria-hidden="true" />
              </label>
              <div className="image-picker">
                <button
                  type="button"
                  className="image-drop"
                  onClick={() => fileRef.current !== null && document.getElementById('product-cover')?.click()}
                  aria-label={draft.image ? 'Replace cover image' : 'Upload cover image'}
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
                  <input
                    id="product-cover"
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={readCover}
                  />
                  <button
                    type="button"
                    className="btn ghost sm"
                    onClick={() => document.getElementById('product-cover')?.click()}
                  >
                    {draft.image ? 'Replace' : 'Upload'}
                  </button>
                  {draft.image ? (
                    <button type="button" className="btn ghost sm" onClick={() => patch('image', null)}>
                      <Trash2 size={14} />
                      Remove
                    </button>
                  ) : null}
                  <span className="hint">Square works best.</span>
                </div>
              </div>
              {errors.image ? <p className="field-error">{errors.image}</p> : null}
              {photoError ? <p className="field-error">{photoError}</p> : null}
            </div>

            <div className="field">
              <label>Gallery (optional)</label>
              <div className="gallery-picker">
                {draft.images.map((image, index) => (
                  <span className="gallery-thumb" key={image.slice(-12) + index}>
                    <img src={image} alt="" />
                    <button
                      type="button"
                      onClick={() => patch('images', draft.images.filter((_, i) => i !== index))}
                      aria-label="Remove gallery image"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                {draft.images.length < MAX_GALLERY ? (
                  <button
                    type="button"
                    className="gallery-add"
                    onClick={() => galleryRef.current?.click()}
                    aria-label="Add gallery images"
                  >
                    <ImagePlus size={16} />
                  </button>
                ) : null}
                <input
                  ref={galleryRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={readGallery}
                />
              </div>
              <span className="hint">Up to {MAX_GALLERY} extra shots of what is inside.</span>
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
                  onChange={(event) => {
                    const value = event.target.value
                    patch('title', value)
                    if (!draft.slug) {
                      // The slug is only suggested, never forced.
                      patch('slug', slugify(value))
                    }
                  }}
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
                  onChange={(event) => patch('category', event.target.value)}
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
              <label>Where buyers get it</label>
              <div className="switch" style={{ margin: 0 }} role="group" aria-label="Where buyers get it">
                {FULFILMENTS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    className="switch-item"
                    aria-pressed={draft.fulfilment === option.key}
                    onClick={() => {
                      patch('fulfilment', option.key as Fulfilment)
                      setErrors((current) => ({ ...current, file: '', externalUrl: '' }))
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <span className="hint">
                {FULFILMENTS.find((option) => option.key === draft.fulfilment)?.note}
              </span>
            </div>

            {draft.fulfilment === 'external' ? (
              <div className="field">
                <label htmlFor="product-external">
                  Product link
                  <span className="req" aria-hidden="true" />
                </label>
                <input
                  id="product-external"
                  className="input"
                  type="url"
                  autoComplete="off"
                  placeholder="https://gumroad.com/l/your-product"
                  value={draft.externalUrl ?? ''}
                  onChange={(event) => patch('externalUrl', event.target.value.trim() || null)}
                />
                <span className="hint">
                  Visitors are sent here. No file is needed and Leenkr takes no payment for this product.
                </span>
                {errors.externalUrl ? <p className="field-error">{errors.externalUrl}</p> : null}
              </div>
            ) : (
              <div className="field">
                <label htmlFor="product-file">
                  Digital file
                  <span className="req" aria-hidden="true" />
                </label>
                <input
                  id="product-file"
                  ref={fileRef}
                  type="file"
                  hidden
                  onChange={onFile}
                />
                {draft.fileName ? (
                  <div className="file-chip">
                    <FileArchive size={16} />
                    <span className="file-chip-main">
                      <strong>{draft.fileName}</strong>
                      <span className="hint">
                        {formatBytes(draft.fileSize)}
                        {draft.fileKey ? ' · stored privately' : ' · not uploaded yet'}
                      </span>
                    </span>
                    <button
                      type="button"
                      className="btn ghost sm"
                      onClick={() => document.getElementById('product-file')?.click()}
                    >
                      Replace
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="file-drop"
                    onClick={() => document.getElementById('product-file')?.click()}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 size={18} className="spin" /> : <Upload size={18} />}
                    {uploading ? 'Uploading your file…' : 'Choose the file buyers download'}
                  </button>
                )}
                {errors.file ? <p className="field-error">{errors.file}</p> : null}
                {fileError ? <p className="field-error">{fileError}</p> : null}
              </div>
            )}

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
                  onChange={(event) => patch('currency', event.target.value as Currency)}
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
                  placeholder={draft.isFree ? 'Free' : '5,000'}
                  value={draft.isFree ? '' : priceText}
                  onChange={(event) => {
                    const formatted = formatPriceInput(event.target.value)
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
                  onChange={(event) => {
                    patch('isFree', event.target.checked)
                    if (!event.target.checked) setPriceText(draft.price ? formatAmount(draft.price) : '')
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
                placeholder="Buy now"
                onChange={(event) => patch('ctaText', event.target.value)}
              />
              {errors.ctaText ? <p className="field-error">{errors.ctaText}</p> : null}
            </div>

            <div className="field">
              <label htmlFor="product-description">Description</label>
              <textarea
                id="product-description"
                className="input"
                value={draft.description}
                placeholder="What is inside, who it is for, what they need to open it…"
                onChange={(event) => patch('description', event.target.value)}
              />
            </div>
          </div>

          <footer className="dialog-foot">
            <button type="button" className="btn ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn" disabled={uploading}>
              <Check size={16} />
              Save product
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
