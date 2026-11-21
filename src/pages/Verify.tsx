import { useEffect, useState, type FormEvent } from 'react'
import { ArrowRight, Check, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import PlatformIcon from '../components/PlatformIcon'
import VerifiedBadge from '../components/VerifiedBadge'
import {
  FOLLOWER_MIN,
  fetchMyVerification,
  qualifies,
  submitVerification,
  type MyVerification,
  type VerificationSocial,
} from '../lib/verification'
import { PLATFORMS, uid, useProfile, type PlatformKey } from '../store'

const PILL: Record<string, { label: string; className: string }> = {
  verified: { label: 'Verified', className: 'pill live' },
  pending: { label: 'Under review', className: 'pill live' },
  approved: { label: 'Approved', className: 'pill live' },
  rejected: { label: 'Declined', className: 'pill' },
  none: { label: 'Not verified', className: 'pill' },
}

function count(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}

function day(iso: string | null) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function qualifyingAccount(socials: VerificationSocial[]) {
  const best = socials
    .filter((social) => social.handle.trim().length > 0 && social.followers >= FOLLOWER_MIN)
    .sort((a, b) => b.followers - a.followers)[0]
  if (!best) return null
  return `@${best.handle.replace(/^@/, '')} (${count(best.followers)} followers)`
}

function seedSocials(profileSocials: { platform: PlatformKey; handle: string }[]) {
  const seen = new Set<PlatformKey>()
  return profileSocials
    .filter((social) => {
      if (seen.has(social.platform)) return false
      seen.add(social.platform)
      return true
    })
    .map((social) => ({ platform: social.platform, handle: social.handle.replace(/^@/, ''), followers: 0 }))
}

export default function Verify() {
  const { profile, save } = useProfile()
  const [request, setRequest] = useState<MyVerification | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [socials, setSocials] = useState<VerificationSocial[]>(() => seedSocials(profile.socials))
  const [email, setEmail] = useState(profile.email)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    let alive = true
    fetchMyVerification()
      .then((next) => {
        if (!alive) return
        setRequest(next)
        setEmail((current) => current || next.email)
      })
      .catch(() => {
        // A brand-new account without a saved page simply has no request yet.
        if (alive) setRequest({ ...EMPTY, email: profile.email })
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
    // Only on mount: the request is read once and then updated locally.
  }, [])

  const start = () => {
    const source =
      request && request.socials.length > 0 ? request.socials : seedSocials(profile.socials)
    setSocials(source)
    setEmail(email || request?.email || profile.email)
    setError('')
    setSent(false)
    setOpen(true)
  }

  const patchSocial = (platform: PlatformKey, patch: Partial<VerificationSocial>) =>
    setSocials((current) =>
      current.map((social) => (social.platform === platform ? { ...social, ...patch } : social)),
    )

  const removeSocial = (platform: PlatformKey) =>
    setSocials((current) => current.filter((social) => social.platform !== platform))

  const addSocial = (platform: PlatformKey) =>
    setSocials((current) => [...current, { platform, handle: '', followers: 0 }])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const filled = socials.filter((social) => social.handle.trim().length > 0)
    if (filled.length === 0) {
      setError('Add at least one social handle.')
      return
    }
    if (email.trim().length === 0 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.')
      return
    }
    if (!qualifies(filled)) {
      setError(`At least one account needs ${count(FOLLOWER_MIN)} followers or more.`)
      return
    }

    setBusy(true)
    setError('')
    try {
      await submitVerification(email, filled)
      // Keep the studio copy in step: the same handles now sit on the page.
      save({
        ...profile,
        email: email.trim(),
        socials: filled.map((social) => ({
          id: uid('s'),
          platform: social.platform,
          handle: social.handle.trim().replace(/^@/, ''),
        })),
      })
      setRequest({
        id: request?.id ?? null,
        status: 'pending',
        email: email.trim(),
        socials: filled,
        note: null,
        submittedAt: new Date().toISOString(),
        reviewedAt: null,
      })
      setOpen(false)
      setSent(true)
    } catch (problem) {
      setError((problem as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const status = profile.verified ? 'verified' : (request?.status ?? 'none')
  const pill = PILL[status] ?? PILL.none
  const pending = status === 'pending'
  const reviewed = status === 'approved' || status === 'rejected'

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
          <span className={pill.className}>{pill.label}</span>
        </div>

        <div className="verify-criteria">
          <p className="verify-criteria-title">What we check</p>
          <ul className="verify-criteria-list">
            <li>
              <Check size={13} />
              <span>
                <strong>{count(FOLLOWER_MIN)} followers or more</strong> on at least one account you
                list here.
              </span>
            </li>
            <li>
              <Check size={13} />
              <span>The handle is the public account, spelled exactly as it appears.</span>
            </li>
            <li>
              <Check size={13} />
              <span>An email address that belongs to this page, so we can reach you.</span>
            </li>
          </ul>
        </div>

        {loading ? (
          <p className="empty-panel">Checking your request…</p>
        ) : status === 'verified' ? (
          <div className="verify-summary">
            <p className="verify-note">
              On — the check shows on your public page. Approved by the Leenkr team.
            </p>
            {request && request.socials.length > 0 ? (
              <SocialSummary socials={request.socials} />
            ) : null}
            {!open ? (
              <div className="verify-gate">
                <button type="button" className="btn ghost sm" onClick={start}>
                  Update social profiles
                </button>
              </div>
            ) : null}
          </div>
        ) : pending ? (
          <div className="verify-summary">
            <p className="verify-note">
              Your request is with the Leenkr team. We check the account and the follower count,
              then turn the badge on from the control panel. This page updates on its next visit.
            </p>
            {request ? (
              <>
                <SocialSummary socials={request.socials} />
                <p className="verify-note">
                  Sent to {request.email || email}
                  {request.submittedAt ? ` · ${day(request.submittedAt)}` : ''}
                </p>
              </>
            ) : null}
            {!open ? (
              <div className="verify-gate">
                <button type="button" className="btn ghost sm" onClick={start}>
                  Update request
                </button>
              </div>
            ) : null}
          </div>
        ) : !open ? (
          <div className="verify-gate">
            <div>
              <h2 className="card-title">
                {status === 'rejected' ? 'Request declined' : 'Verify your profile'}
              </h2>
              <p className="tool-copy">
                {status === 'rejected'
                  ? request?.note
                    ? `Reason: ${request.note}`
                    : 'The last request did not meet the criteria. You can send a new one.'
                  : 'Send your social profiles and email. Review usually takes a few days.'}
              </p>
            </div>
            <button type="button" className="btn dark" onClick={start}>
              {status === 'rejected' ? 'Try again' : 'Start verification'}
              <ArrowRight size={16} />
            </button>
          </div>
        ) : null}

        {sent ? (
          <p className="verify-note" role="status">
            Request sent. You’ll see the badge here once it is approved.
          </p>
        ) : null}

        {open ? (
          <form className="verify-form" onSubmit={submit}>
            <div className="field">
              <label htmlFor="verify-email">Email for this page</label>
              <input
                id="verify-email"
                className="input"
                type="email"
                autoComplete="email"
                value={email}
                placeholder="you@studio.com"
                onChange={(event) => setEmail(event.target.value)}
              />
              <span className="hint">Only used to reach you about this request.</span>
            </div>

            <div className="field">
              <label>Social profiles</label>
              <div className="verify-socials">
                {socials.map((social) => (
                  <div className="verify-social-row" key={social.platform}>
                    <span className="platform-tag">
                      <PlatformIcon platform={social.platform} size={14} />
                      {PLATFORMS.find((entry) => entry.key === social.platform)?.label}
                    </span>
                    <input
                      className="input"
                      placeholder="handle"
                      aria-label={`${social.platform} handle`}
                      value={social.handle}
                      onChange={(event) =>
                        patchSocial(social.platform, {
                          handle: event.target.value.replace(/^@/, ''),
                        })
                      }
                    />
                    <input
                      className="input"
                      inputMode="numeric"
                      placeholder="Followers"
                      aria-label={`${social.platform} followers`}
                      value={social.followers > 0 ? count(social.followers) : ''}
                      onChange={(event) =>
                        patchSocial(social.platform, {
                          followers: Number(event.target.value.replace(/[^0-9]/g, '')) || 0,
                        })
                      }
                    />
                    <button
                      type="button"
                      className="trash"
                      onClick={() => removeSocial(social.platform)}
                      aria-label="Remove platform"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>

              {PLATFORMS.some(
                (platform) => !socials.some((social) => social.platform === platform.key),
              ) ? (
                <div className="chip-row verify-platforms">
                  {PLATFORMS.filter(
                    (platform) => !socials.some((social) => social.platform === platform.key),
                  ).map((platform) => (
                    <button
                      key={platform.key}
                      type="button"
                      className="chip"
                      onClick={() => addSocial(platform.key)}
                    >
                      <Plus size={12} />
                      {platform.label}
                    </button>
                  ))}
                </div>
              ) : null}

              <span
                className={qualifies(socials) ? 'verify-qualify ok' : 'verify-qualify'}
                aria-live="polite"
              >
                {qualifies(socials) ? (
                  <>
                    <ShieldCheck size={13} /> Requirement met: {qualifyingAccount(socials)} clears
                    the bar.
                  </>
                ) : (
                  `No account has ${count(FOLLOWER_MIN)} followers yet. Add the count for the largest one.`
                )}
              </span>
            </div>

            {error ? (
              <p className="field-error" role="alert">
                {error}
              </p>
            ) : null}

            <div className="verify-foot">
              <button type="button" className="btn ghost" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn dark" disabled={busy}>
                {busy ? 'Sending…' : 'Submit for review'}
              </button>
            </div>
          </form>
        ) : null}

        {!profile.verified && !open && !pending && !reviewed ? (
          <div className="verify-preview">
            <span className="verify-label">Preview</span>
            <p className="verify-name">{profile.name || 'Your name'}</p>
          </div>
        ) : null}
      </section>
    </div>
  )
}

const EMPTY: MyVerification = {
  id: null,
  status: 'none',
  email: '',
  socials: [],
  note: null,
  submittedAt: null,
  reviewedAt: null,
}

function SocialSummary({ socials }: { socials: VerificationSocial[] }) {
  return (
    <div className="verify-social-summary">
      {socials.map((social) => (
        <div className="verify-summary-row" key={social.platform}>
          <span className="platform-tag">
            <PlatformIcon platform={social.platform} size={13} />
            {PLATFORMS.find((entry) => entry.key === social.platform)?.label}
          </span>
          <span className="verify-summary-handle">@{social.handle.replace(/^@/, '')}</span>
          <span className={social.followers >= FOLLOWER_MIN ? 'verify-count ok' : 'verify-count'}>
            {count(social.followers)} followers
          </span>
        </div>
      ))}
    </div>
  )
}
