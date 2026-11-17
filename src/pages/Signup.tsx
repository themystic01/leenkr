import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, MailCheck } from 'lucide-react'
import AuthShell from '../components/AuthShell'
import { useSession } from '../auth'
import { PASSWORD_MIN, passwordProblem } from '../lib/password'
import { usePageTitle } from '../lib/title'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Signup() {
  usePageTitle('Create your page · Leenkr')
  const { signUp } = useSession()
  const navigate = useNavigate()
  // a handle claimed on the marketing hero rides along to the onboarding step
  const [params] = useSearchParams()
  const handle = params.get('handle') ?? ''
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const found: Record<string, string> = {}
    if (name.trim().length < 2) found.name = 'Tell us what to call you.'
    if (!EMAIL_PATTERN.test(email.trim())) found.email = 'Enter a valid email address.'
    const passwordError = passwordProblem(password)
    if (passwordError) found.password = passwordError
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setBusy(true)
    const result = await signUp(email, password)
    setBusy(false)
    if (!result.ok) {
      setErrors({ form: result.error ?? 'Could not create the account.' })
      return
    }
    if (result.needsConfirmation) {
      setConfirming(true)
      return
    }
    navigate(handle ? `/onboarding?handle=${encodeURIComponent(handle)}` : '/onboarding')
  }

  if (confirming) {
    return (
      <AuthShell
        eyebrow="One more step"
        title="Confirm your email"
        sub={`We sent a link to ${email.trim()}. Open it, then sign in to claim your handle.`}
        footer={
          <>
            Already confirmed? <Link to="/login">Sign in</Link>
          </>
        }
      >
        <div className="auth-form">
          <p className="auth-hint">
            <MailCheck size={15} /> The link expires in an hour. Check spam if it hasn’t arrived.
          </p>
          <Link className="btn auth-submit" to="/login">
            Go to sign in
            <ArrowRight size={16} />
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      eyebrow="Start free"
      title="Create your Leenkr page"
      sub="Takes about a minute. No card, no storefront to configure — just your page, your products and one link."
      footer={
        <>
          Already have a page? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="signup-name">Your name</label>
          <input
            id="signup-name"
            className="input"
            autoComplete="name"
            placeholder="Collins Nzagha"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          {errors.name ? <p className="field-error">{errors.name}</p> : null}
        </div>

        <div className="field">
          <label htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            className="input"
            type="email"
            autoComplete="email"
            placeholder="you@studio.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {errors.email ? <p className="field-error">{errors.email}</p> : null}
        </div>

        <div className="field">
          <label htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            className="input"
            type="password"
            autoComplete="new-password"
            placeholder={`At least ${PASSWORD_MIN} characters`}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {errors.password ? <p className="field-error">{errors.password}</p> : null}
        </div>

        {errors.form ? <p className="field-error">{errors.form}</p> : null}

        <button type="submit" className="btn auth-submit" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
          <ArrowRight size={16} />
        </button>

        <p className="auth-hint">
          Next you pick your handle and your page goes live. You can change everything later.
        </p>
      </form>
    </AuthShell>
  )
}
