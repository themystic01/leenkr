import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Link2, Package, Send } from 'lucide-react'
import { useSession } from '../auth'
import { isHandleAvailable } from '../lib/api'
import { cleanHandle } from '../lib/handle'
import { usePageTitle } from '../lib/title'
import { useProfile } from '../store'

type StepKey = 'handle' | 'page' | 'sections'

const STEPS: { key: StepKey; label: string }[] = [
  { key: 'handle', label: 'Your handle' },
  { key: 'page', label: 'Your page' },
  { key: 'sections', label: 'What you share' },
]

// Studio and marketing routes take priority over a handle at the same path.
const RESERVED = new Set([
  'login',
  'signup',
  'onboarding',
  'dashboard',
  'pricing',
  'home',
  'p',
  'profile',
  'products',
  'links',
  'connect',
  'settings',
  'analytics',
  'insight',
  'tools',
  'verify',
])

const SECTIONS = [
  { key: 'products', label: 'Products', copy: 'Digital downloads with a price and a button.', icon: Package },
  { key: 'links', label: 'Links', copy: 'Writing, videos, press — anything worth a click.', icon: Link2 },
  { key: 'connect', label: 'Connect', copy: 'Email, bookings, newsletter or a collab request.', icon: Send },
] as const

export default function Onboarding() {
  usePageTitle('Set up your page · Leenkr')
  const { session, finishOnboarding } = useSession()
  const { profile, save } = useProfile()
  const navigate = useNavigate()
  // a handle claimed before signing up arrives here and is prefilled
  const [params] = useSearchParams()

  const [step, setStep] = useState(0)
  const [username, setUsername] = useState(() => cleanHandle(params.get('handle')))
  // Nothing is prefilled: a new page holds only what its owner types.
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [sections, setSections] = useState<string[]>(['products', 'links', 'connect'])
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  if (!session) return <Navigate to="/login" replace />
  if (session.onboarded) return <Navigate to="/dashboard" replace />

  const current = STEPS[step].key
  const handle = username.trim().toLowerCase()
  const handleValid = /^[a-z0-9-_]{3,24}$/.test(handle) && !RESERVED.has(handle)

  const toggleSection = (key: string) => {
    setError('')
    setSections((values) => (values.includes(key) ? values.filter((value) => value !== key) : [...values, key]))
  }

  const next = async () => {
    setError('')
    if (current === 'handle' && !handleValid) {
      setError('Pick 3–24 lowercase letters, numbers or dashes. Studio words like dashboard are taken.')
      return
    }
    if (current === 'handle') {
      setChecking(true)
      const free = await isHandleAvailable(handle)
      setChecking(false)
      if (!free) {
        setError('That handle is already taken. Try another.')
        return
      }
    }
    if (current === 'page' && name.trim().length < 2) {
      setError('Your page needs a name on it.')
      return
    }
    if (current === 'sections' && sections.length === 0) {
      setError('Pick at least one section — a page with nothing on it helps nobody.')
      return
    }
    if (step < STEPS.length - 1) {
      setStep(step + 1)
      return
    }

    save({
      ...profile,
      name: name.trim(),
      username: handle,
      email: session.email,
      bio: bio.trim(),
      published: true,
    })
    finishOnboarding()
    navigate('/dashboard')
  }

  return (
    <div className="onb-shell">
      <header className="onb-head">
        <Link to="/" className="auth-brand-mark" aria-label="Leenkr home">
          L
        </Link>
        <p className="onb-who">Signed in as {session.email}</p>
      </header>

      <div className="onb-body">
        <ol className="onb-steps" aria-label="Onboarding steps">
          {STEPS.map((item, index) => (
            <li key={item.key} className={index === step ? 'on' : index < step ? 'done' : ''}>
              <span className="onb-step-num">{index < step ? <Check size={12} strokeWidth={3} /> : index + 1}</span>
              {item.label}
            </li>
          ))}
        </ol>

        <div className="onb-card">
          {current === 'handle' ? (
            <div className="panel">
              <h1 className="onb-title">Claim your link</h1>
              <p className="onb-sub">This is the address you’ll put in every bio, caption and email signature.</p>

              <div className="field">
                <label htmlFor="onb-username">Your handle</label>
                <div className="field-row">
                  <span className="prefix">leenkr.com/</span>
                  <input
                    id="onb-username"
                    className="input"
                    autoFocus
                    value={username}
                    autoComplete="off"
                    spellCheck={false}
                    onChange={(event) => {
                      setError('')
                      setUsername(cleanHandle(event.target.value))
                    }}
                  />
                </div>
                <span className="hint">Lowercase letters, numbers and dashes. You can change it later.</span>
              </div>
            </div>
          ) : null}

          {current === 'page' ? (
            <div className="panel">
              <h1 className="onb-title">Put a face on it</h1>
              <p className="onb-sub">Your name and one line about what you make. Both stay editable.</p>

              <div className="field">
                <label htmlFor="onb-name">Display name</label>
                <input
                  id="onb-name"
                  className="input"
                  autoFocus
                  placeholder="Ada Obi"
                  value={name}
                  onChange={(event) => {
                    setError('')
                    setName(event.target.value)
                  }}
                />
              </div>

              <div className="field">
                <label htmlFor="onb-bio">Bio</label>
                <textarea
                  id="onb-bio"
                  className="input"
                  maxLength={240}
                  placeholder="Designer and builder. I make calm interfaces for loud ideas."
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                />
                <span className="counter">{bio.length}/240</span>
              </div>
            </div>
          ) : null}

          {current === 'sections' ? (
            <div className="panel">
              <h1 className="onb-title">What goes on the page?</h1>
              <p className="onb-sub">
                Visitors see one section at a time and switch between them. Pick what you have today.
              </p>

              <div className="onb-choices">
                {SECTIONS.map((item) => {
                  const Icon = item.icon
                  const on = sections.includes(item.key)
                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={on ? 'onb-choice on' : 'onb-choice'}
                      aria-pressed={on}
                      onClick={() => toggleSection(item.key)}
                    >
                      <span className="onb-choice-icon">
                        <Icon size={17} />
                      </span>
                      <span className="onb-choice-body">
                        <span className="onb-choice-title">{item.label}</span>
                        <span className="onb-choice-copy">{item.copy}</span>
                      </span>
                      <span className="onb-choice-check">{on ? <Check size={13} strokeWidth={3} /> : null}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          {error ? <p className="field-error onb-error">{error}</p> : null}

          <div className="onb-foot">
            {step > 0 ? (
              <button type="button" className="btn ghost" onClick={() => setStep(step - 1)}>
                <ArrowLeft size={16} />
                Back
              </button>
            ) : (
              <span />
            )}
            <button type="button" className="btn" onClick={next} disabled={checking}>
              {checking ? 'Checking…' : step === STEPS.length - 1 ? 'Open my studio' : 'Continue'}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
