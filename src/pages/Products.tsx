import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import ProductDialog from '../components/ProductDialog'
import { formatBytes, hostOf, priceLabel, useProfile, type Product } from '../store'

export default function Products() {
  const { profile, save } = useProfile()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)

  const openNew = () => {
    setEditing(null)
    setOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditing(product)
    setOpen(true)
  }

  const onSave = (product: Product) => {
    const exists = profile.products.some((item) => item.id === product.id)
    save({
      ...profile,
      products: exists
        ? profile.products.map((item) => (item.id === product.id ? product : item))
        : [...profile.products, product],
    })
    setOpen(false)
    setEditing(null)
  }

  const remove = (id: string) =>
    save({ ...profile, products: profile.products.filter((item) => item.id !== id) })

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Your page · section one</p>
          <h1 className="page-title">Products</h1>
          <p className="page-sub">
            Anything you sell — kits, downloads, paid work. Visitors only see this when the Products tab is
            open.
          </p>
        </div>
        <div className="head-actions">
          <button type="button" className="btn" onClick={openNew}>
            <Plus size={16} />
            New product
          </button>
        </div>
      </header>

      <div className="card">
        <div className="card-head">
          <h2 className="card-title">Listed products</h2>
          <span className="card-note">
            {profile.products.length} {profile.products.length === 1 ? 'product' : 'products'}
          </span>
        </div>

        {profile.products.length === 0 ? (
          <div className="empty-panel">
            No products yet.{' '}
            <button type="button" className="link-btn" onClick={openNew}>
              Add your first one
            </button>
            .
          </div>
        ) : (
          <ul className="item-list">
            {profile.products.map((product) => (
              <li className="item-row product-row" key={product.id}>
                <span className="item-art product-thumb">
                  {product.image ? (
                    <img src={product.image} alt="" />
                  ) : (
                    product.title.charAt(0).toUpperCase() || 'P'
                  )}
                </span>
                <span className="item-main">
                  <span className="item-title">{product.title}</span>
                  <span className="item-sub">
                    {product.category} · {priceLabel(product)} ·{' '}
                    {product.fulfilment === 'external'
                      ? `External · ${hostOf(product.externalUrl ?? '') || 'no link set'}`
                      : product.fileName
                        ? `${product.fileName}${product.fileSize ? ` (${formatBytes(product.fileSize)})` : ''}`
                        : 'No file attached'}
                    {product.purchases > 0 ? ` · ${product.purchases} sold` : ''}
                  </span>
                </span>
                <button type="button" className="btn ghost sm" onClick={() => openEdit(product)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="trash"
                  onClick={() => remove(product.id)}
                  aria-label={`Remove ${product.title}`}
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ProductDialog
        open={open}
        product={editing}
        onClose={() => {
          setOpen(false)
          setEditing(null)
        }}
        onSave={onSave}
      />
    </div>
  )
}
