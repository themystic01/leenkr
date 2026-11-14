import { LinksEditor } from '../components/ContentEditors'
import { uid, useProfile } from '../store'

export default function Links() {
  const { profile, save } = useProfile()

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Your page · section two</p>
          <h1 className="page-title">Links</h1>
          <p className="page-sub">
            Writing, videos, press — anything worth a click. Visitors only see this when the Links tab is
            open.
          </p>
        </div>
      </header>

      <div className="card">
        <div className="card-head">
          <h2 className="card-title">Listed links</h2>
          <span className="card-note">
            {profile.links.length} {profile.links.length === 1 ? 'link' : 'links'}
          </span>
        </div>
        <LinksEditor
          items={profile.links}
          onAdd={(item) => save({ ...profile, links: [...profile.links, { ...item, id: uid('l') }] })}
          onRemove={(id) => save({ ...profile, links: profile.links.filter((l) => l.id !== id) })}
        />
      </div>
    </div>
  )
}
