import VerifiedBadge from '../components/VerifiedBadge'
import { useProfile } from '../store'

export default function Verify() {
  const { profile, save } = useProfile()
  const on = profile.verified

  const toggle = () => save({ ...profile, verified: !on })

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Trust</p>
          <h1 className="page-title">Verify</h1>
          <p className="page-sub">
            A yellow check next to your name tells visitors this page is really yours.
          </p>
        </div>
      </header>

      <section className="card verify-card">
        <div className="verify-row">
          <span className="verify-mark">
            <VerifiedBadge size={30} />
          </span>
          <div className="verify-copy">
            <h2 className="card-title">Verified badge</h2>
            <p className="tool-copy">
              Appears right after {profile.name || 'your name'} on leenkr.app/
              {profile.username || 'username'}.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label="Show verified badge"
            className={on ? 'toggle on' : 'toggle'}
            onClick={toggle}
          >
            <span className="toggle-knob" />
          </button>
        </div>

        <div className="verify-preview">
          <span className="verify-label">Preview</span>
          <p className="verify-name">
            {profile.name || 'Your name'}
            {on ? <VerifiedBadge size={26} /> : null}
          </p>
        </div>

        <p className="verify-note">
          {on
            ? 'On — the check shows on your public page.'
            : 'Off — your name stands on its own.'}{' '}
          Review is manual in this build, so the switch is yours to flip.
        </p>
      </section>
    </div>
  )
}
