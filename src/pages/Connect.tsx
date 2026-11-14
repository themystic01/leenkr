import { ConnectEditor } from '../components/ContentEditors'
import { uid, useProfile } from '../store'

export default function Connect() {
  const { profile, save } = useProfile()

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Your page · section three</p>
          <h1 className="page-title">Connect</h1>
          <p className="page-sub">
            Email, bookings, a collab request. Visitors only see this when the Connect tab is open.
          </p>
        </div>
      </header>

      <div className="card">
        <div className="card-head">
          <h2 className="card-title">Ways to reach you</h2>
          <span className="card-note">
            {profile.connects.length} {profile.connects.length === 1 ? 'option' : 'options'}
          </span>
        </div>
        <ConnectEditor
          items={profile.connects}
          onAdd={(item) => save({ ...profile, connects: [...profile.connects, { ...item, id: uid('c') }] })}
          onRemove={(id) => save({ ...profile, connects: profile.connects.filter((c) => c.id !== id) })}
        />
      </div>
    </div>
  )
}
