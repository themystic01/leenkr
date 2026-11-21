import VerifiedBadge from '../components/VerifiedBadge'
import { useProfile } from '../store'

export default function Verify() {
  const { profile } = useProfile()
  const on = profile.verified

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
              {profile.username || 'username'} once Leenkr approves it.
            </p>
          </div>
          <span className={on ? 'pill live' : 'pill'}>{on ? 'Verified' : 'Not verified'}</span>
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
            : 'Verification is reviewed by the Leenkr team. Until it is approved, no badge appears.'}
        </p>
      </section>
    </div>
  )
}
