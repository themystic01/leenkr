import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Check,
  Copy,
  Globe,
  KeyRound,
  Lock,
  Palette,
  ShieldCheck,
  Trash2,
  User,
  type LucideIcon,
} from 'lucide-react'
import PasswordInput from '../components/PasswordInput'
import { useSession } from '../auth'
import { isHandleAvailable } from '../lib/api'
import { passwordProblem } from '../lib/password'
import {
  PAGE_ACCENTS,
  PAGE_MOTIONS,
  PAGE_THEMES,
  useProfile,
  type DomainStatus,
  type PageAccent,
  type PageMotion,
  type PageTheme,
} from '../store'

type SectionKey = 'account' | 'security' | 'domain' | 'appearance'

const SECTIONS: { key: SectionKey; label: string; icon: LucideIcon }[] = [
  { key: 'account', label: 'Account', icon: User },
  { key: 'security', label: 'Security', icon: ShieldCheck },
  { key: 'domain', label: 'Domain', icon: Globe },
  { key: 'appearance', label: 'Appearance', icon: Palette },
]

// Must match the shape the pages table accepts, or the save is rejected outright.
const USERNAME_PATTERN = /^[a-z0-9-_]{3,24}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DOMAIN_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i

function Saved({ children }: { children: string }) {
  return (
    <p className="saved-note">
      <Check size={14} />
      {children}
    </p>
  )
}

function AccountPanel() {
  const { profile, save } = useProfile()
  const { session, signOut } = useSession()
  const navigate = useNavigate()
  const [email, setEmail] = useState(profile.email)
  const [username, setUsername] = useState(profile.username)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setEmail(profile.email)
    setUsername(profile.username)
  }, [profile.email, profile.username])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const nextEmail = email.trim()
    const nextUsername = username.trim().toLowerCase().replace(/^@/, '')
    const found: Record<string, string> = {}
    if (!EMAIL_PATTERN.test(nextEmail)) found.email = 'Enter a valid email address.'
    if (!USERNAME_PATTERN.test(nextUsername)) {
      found.username = 'Use 3–24 lowercase letters, numbers, dashes or underscores.'
    }
    setErrors(found)
    setSaved(false)
    if (Object.keys(found).length > 0) return

    // Someone else may already own this handle.
    if (nextUsername !== profile.username && !(await isHandleAvailable(nextUsername))) {
      setErrors({ username: 'That handle is already taken. Try another.' })
      return
    }

    save({ ...profile, email: nextEmail, username: nextUsername })
    setUsername(nextUsername)
    setSaved(true)
  }

  const dirty = email.trim() !== profile.email || username.trim().toLowerCase() !== profile.username

  return (
    <form className="card settings-card" onSubmit={submit} noValidate>
      <div className="card-head">
        <h2 className="card-title">Account</h2>
        <span className="card-note">How you sign in</span>
      </div>
      <p className="tool-copy">
        Your email is what you sign in with. Your username is the address of your page.
      </p>

      <div className="field">
        <label htmlFor="account-email">Email</label>
        <input
          id="account-email"
          className="input"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        {errors.email ? <p className="field-error">{errors.email}</p> : null}
      </div>

      <div className="field">
        <label htmlFor="account-username">Username</label>
        <div className="input-prefix">
          <span className="prefix">leenkr.app/</span>
          <input
            id="account-username"
            value={username}
            autoComplete="username"
            spellCheck={false}
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>
        {errors.username ? (
          <p className="field-error">{errors.username}</p>
        ) : (
          <p className="hint">Changing this changes your public link. Old links will stop working.</p>
        )}
      </div>

      <div className="editor-foot">
        <div className="foot-right">
          {saved ? <Saved>Account updated.</Saved> : null}
        </div>
        <button type="submit" className="btn" disabled={!dirty}>
          Save account
        </button>
      </div>

      <div className="session-row">
        <div>
          <p className="session-title">Signed in as {session?.email}</p>
        </div>
        <button
          type="button"
          className="btn ghost sm"
          onClick={() => {
            signOut()
            navigate('/login')
          }}
        >
          Sign out
        </button>
      </div>
    </form>
  )
}

function SecurityPanel() {
  const { profile, save } = useProfile()
  const { updatePassword } = useSession()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)
  const [failure, setFailure] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const found: Record<string, string> = {}
    if (!current) found.current = 'Enter your current password.'
    const problem = passwordProblem(next)
    if (problem) found.next = problem
    if (confirm !== next) found.confirm = 'The two passwords don’t match.'
    setErrors(found)
    setSaved(false)
    setFailure('')
    if (Object.keys(found).length > 0) return

    setBusy(true)
    const result = await updatePassword(next, current)
    setBusy(false)
    if (!result.ok) {
      setFailure(result.error ?? 'Could not save the new password.')
      return
    }
    setCurrent('')
    setNext('')
    setConfirm('')
    setSaved(true)
  }

  const twoFactor = profile.security.twoFactor

  return (
    <div className="settings-stack">
      <section className="card settings-card">
        <div className="card-head">
          <h2 className="card-title">Password</h2>
          <span className="card-note">Last changed —</span>
        </div>
        <form onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="security-current">Current password</label>
            <PasswordInput
              id="security-current"
              autoComplete="current-password"
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
            />
            {errors.current ? <p className="field-error">{errors.current}</p> : null}
          </div>
          <div className="field-grid">
            <div className="field">
              <label htmlFor="security-next">New password</label>
              <PasswordInput
                id="security-next"
                autoComplete="new-password"
                value={next}
                onChange={(event) => setNext(event.target.value)}
              />
              {errors.next ? <p className="field-error">{errors.next}</p> : null}
            </div>
            <div className="field">
              <label htmlFor="security-confirm">Confirm new password</label>
              <PasswordInput
                id="security-confirm"
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
              />
              {errors.confirm ? <p className="field-error">{errors.confirm}</p> : null}
            </div>
          </div>
          <div className="editor-foot">
            <div className="foot-right">
              {saved ? (
                <Saved>Password updated.</Saved>
              ) : failure ? (
                <span className="form-note">{failure}</span>
              ) : (
                <span className="form-note">
                  You stay signed in here; other devices have to sign in again.
                </span>
              )}
            </div>
            <button type="submit" className="btn" disabled={busy}>
              <KeyRound size={16} />
              {busy ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      </section>

      <section className="card settings-card">
        <div className="settings-row">
          <span className="settings-mark">
            <Lock size={17} />
          </span>
          <div className="settings-copy">
            <h2 className="card-title">Two-factor authentication</h2>
            <p className="tool-copy">
              {twoFactor
                ? 'On — you’ll enter a 6-digit code from your authenticator app after your password.'
                : 'Add a second step to sign-in with an authenticator app.'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={twoFactor}
            aria-label="Two-factor authentication"
            className={twoFactor ? 'toggle on' : 'toggle'}
            onClick={() =>
              save({ ...profile, security: { ...profile.security, twoFactor: !twoFactor } })
            }
          >
            <span className="toggle-knob" />
          </button>
        </div>
        <p className="settings-hint">
          {twoFactor
            ? 'Keep your recovery codes somewhere safe. This build stores the switch, not the codes.'
            : 'Turn it on and Leenkr asks for a code before letting anyone into your studio.'}
        </p>
      </section>
    </div>
  )
}

function DomainPanel() {
  const { profile, save } = useProfile()
  const [value, setValue] = useState(profile.domain)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => setValue(profile.domain), [profile.domain])

  const connect = (event: FormEvent) => {
    event.preventDefault()
    const next = value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    if (!DOMAIN_PATTERN.test(next)) {
      setError('Enter a domain like yourname.com.')
      return
    }
    setError('')
    save({ ...profile, domain: next, domainStatus: 'pending' })
  }

  const setStatus = (domainStatus: DomainStatus) => save({ ...profile, domainStatus })

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      window.setTimeout(() => setCopied(''), 1600)
    } catch {
      setToast('Copying is blocked in this browser — select the value and copy it by hand.')
    }
  }

  const records = [
    { type: 'CNAME', name: 'www', value: 'cname.leenkr.app', key: 'cname' },
    { type: 'A', name: '@', value: '76.76.21.21', key: 'a' },
    { type: 'TXT', name: '_leenkr', value: `leenkr-verify=${profile.username || 'username'}`, key: 'txt' },
  ]

  return (
    <section className="card settings-card">
      <div className="card-head">
        <h2 className="card-title">Custom domain</h2>
        {profile.domain ? (
          <span className={profile.domainStatus === 'connected' ? 'pill live' : 'pill'}>
            {profile.domainStatus === 'connected' ? 'Connected' : 'Waiting for DNS'}
          </span>
        ) : (
          <span className="card-note">Not connected</span>
        )}
      </div>
      <p className="tool-copy">
        Buy the domain wherever you like, then point it here. Leenkr keeps serving leenkr.app/
        {profile.username || 'username'} either way.
      </p>

      <form className="domain-form" onSubmit={connect} noValidate>
        <div className="field">
          <label htmlFor="domain-value">Your domain</label>
          <input
            id="domain-value"
            className="input"
            value={value}
            placeholder="yourname.com"
            spellCheck={false}
            onChange={(event) => setValue(event.target.value)}
          />
          {error ? <p className="field-error">{error}</p> : null}
        </div>
        <button type="submit" className="btn">
          {profile.domain ? 'Update domain' : 'Connect domain'}
        </button>
      </form>

      {profile.domain ? (
        <>
          <div className="dns">
            <div className="dns-head">
              <span>Type</span>
              <span>Name</span>
              <span>Value</span>
              <span />
            </div>
            {records.map((record) => (
              <div className="dns-row" key={record.key}>
                <span className="dns-type">{record.type}</span>
                <span className="mono dns-name">{record.name}</span>
                <span className="mono dns-value">{record.value}</span>
                <button
                  type="button"
                  className="icon-btn tiny"
                  aria-label={`Copy ${record.type} value`}
                  onClick={() => copy(record.value, record.key)}
                >
                  {copied === record.key ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </div>
            ))}
          </div>

          <div className="editor-foot">
            <div className="foot-right">
              <span className="form-note">
                {profile.domainStatus === 'connected'
                  ? `Serving at ${profile.domain}.`
                  : 'DNS can take up to 24 hours. We check automatically once the records resolve.'}
              </span>
            </div>
            <div className="head-actions">
              {profile.domainStatus !== 'connected' ? (
                <button type="button" className="btn" onClick={() => setStatus('connected')}>
                  I’ve added the records
                </button>
              ) : (
                <button type="button" className="btn ghost" onClick={() => setStatus('pending')}>
                  Re-check DNS
                </button>
              )}
              <button
                type="button"
                className="btn ghost"
                onClick={() => save({ ...profile, domain: '', domainStatus: 'none' })}
              >
                <Trash2 size={15} />
                Remove
              </button>
            </div>
          </div>
        </>
      ) : null}

      {toast ? <p className="form-note">{toast}</p> : null}
    </section>
  )
}

function AppearancePanel() {
  const { profile, save } = useProfile()
  const { appearance } = profile
  const setAppearance = (patch: Partial<typeof appearance>) =>
    save({ ...profile, appearance: { ...appearance, ...patch } })

  return (
    <div className="settings-stack">
      <section className="card settings-card">
        <div className="card-head">
          <h2 className="card-title">Look</h2>
          <span className="card-note">leenkr.app/{profile.username || 'username'}</span>
        </div>
        <p className="tool-copy">The canvas and accent of your public page. Your studio stays as it is.</p>

        <div className="field">
          <label id="theme-label">Theme</label>
          <div className="option-row" role="group" aria-labelledby="theme-label">
            {PAGE_THEMES.map((theme) => (
              <button
                key={theme.key}
                type="button"
                className="option"
                aria-pressed={appearance.theme === theme.key}
                onClick={() => setAppearance({ theme: theme.key as PageTheme })}
              >
                <span
                  className="option-swatch"
                  style={{ background: theme.swatch, color: theme.ink }}
                >
                  Aa
                </span>
                <span className="option-label">
                  {theme.label}
                  {appearance.theme === theme.key ? <Check size={13} /> : null}
                </span>
                <span className="option-note">{theme.note}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label id="accent-label">Accent</label>
          <div className="swatch-row" role="group" aria-labelledby="accent-label">
            {PAGE_ACCENTS.map((accent) => (
              <button
                key={accent.key}
                type="button"
                className="swatch"
                style={{ background: accent.color }}
                aria-pressed={appearance.accent === accent.key}
                aria-label={accent.label}
                onClick={() => setAppearance({ accent: accent.key as PageAccent })}
              />
            ))}
          </div>
          <p className="hint">Used for buttons, the badge and product art on your page.</p>
        </div>
      </section>

      <section className="card settings-card">
        <div className="card-head">
          <h2 className="card-title">Motion</h2>
          <span className="card-note">Public page only</span>
        </div>
        <p className="tool-copy">
          Subtle, clean animation as your page loads and as visitors move between Products, Links and
          Connect. Anyone who prefers reduced motion gets none of it.
        </p>
        <div className="option-row" role="group" aria-label="Motion">
          {PAGE_MOTIONS.map((motion) => (
            <button
              key={motion.key}
              type="button"
              className="option"
              aria-pressed={appearance.motion === motion.key}
              onClick={() => setAppearance({ motion: motion.key as PageMotion })}
            >
              <span className={`option-motion motion-demo-${motion.key}`}>
                <span />
                <span />
                <span />
              </span>
              <span className="option-label">
                {motion.label}
                {appearance.motion === motion.key ? <Check size={13} /> : null}
              </span>
              <span className="option-note">{motion.note}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

export default function Settings() {
  const [section, setSection] = useState<SectionKey>('account')

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Studio</p>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">Your account, how you sign in, the domain and how your page looks.</p>
        </div>
      </header>

      <div className="settings-tabs" role="tablist" aria-label="Settings sections">
        {SECTIONS.map((item) => {
          const Icon = item.icon
          const active = section === item.key
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              id={`settings-tab-${item.key}`}
              aria-selected={active}
              aria-controls={`settings-panel-${item.key}`}
              className="settings-tab"
              onClick={() => setSection(item.key)}
            >
              <Icon size={16} strokeWidth={1.8} />
              {item.label}
            </button>
          )
        })}
      </div>

      <div
        className="settings-panel"
        role="tabpanel"
        id={`settings-panel-${section}`}
        aria-labelledby={`settings-tab-${section}`}
        tabIndex={0}
      >
        {section === 'account' ? <AccountPanel /> : null}
        {section === 'security' ? <SecurityPanel /> : null}
        {section === 'domain' ? <DomainPanel /> : null}
        {section === 'appearance' ? <AppearancePanel /> : null}
      </div>
    </div>
  )
}
