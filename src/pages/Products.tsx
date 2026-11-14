import { ProductsEditor } from '../components/ContentEditors'
import { uid, useProfile } from '../store'

export default function Products() {
  const { profile, save } = useProfile()

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
      </header>

      <div className="card">
        <div className="card-head">
          <h2 className="card-title">Listed products</h2>
          <span className="card-note">
            {profile.products.length} {profile.products.length === 1 ? 'product' : 'products'}
          </span>
        </div>
        <ProductsEditor
          items={profile.products}
          onAdd={(item) => save({ ...profile, products: [...profile.products, { ...item, id: uid('p') }] })}
          onRemove={(id) => save({ ...profile, products: profile.products.filter((p) => p.id !== id) })}
        />
      </div>
    </div>
  )
}
