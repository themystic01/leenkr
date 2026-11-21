import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import AuthShell from '../components/AuthShell'
import PasswordInput from '../components/PasswordInput'
import { DEMO_PROFILE, useSession } from '../auth'
import { PASSWORD_MIN, passwordProblem } from '../lib/password'
import { hasBackend } from '../lib/supabase'
import { usePageTitle } from '../lib/title'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login() {
  usePageTitle('Sign in · Leenkr')
  const { signIn } = useSession()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const found: Record<string, string> = {}
    if (!EMAIL_PATTERN.test(email.trim())) found.email = 'Enter a valid email address.'
    const passwordError = passwordProblem(password)
    if (passwordError) found.password = passwordError
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setBusy(true)
    const result = await signIn(email, password)
    setBusy(false)
    if (!result.ok) {
      setErrors({ form: result.error ?? 'That email and password did not match.' })
      return
    }
    navigate('/dashboard')
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to your studio"
      sub="Pick up where you left off — your page, products and settings are where you left them."
      footer={
        <>
          New to Leenkr? <Link to="/signup">Create an account</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
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
          <label htmlFor="login-password">Password</label>
          <PasswordInput
            id="login-password"
            autoComplete="current-password"
            placeholder={`At least ${PASSWORD_MIN} characters`}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {errors.password ? <p className="field-error">{errors.password}</p> : null}
          <Link className="auth-forgot" to="/forgot-password">
            Forgot password?
          </Link>
        </div>

        {errors.form ? <p className="field-error">{errors.form}</p> : null}

        <button type="submit" className="btn auth-submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
          <ArrowRight size={16} />
        </button>

        <p className="auth-hint">
          {hasBackend
            ? 'Your page, products and settings are saved to your account.'
            : `Any email and any ${PASSWORD_MIN}-character password signs you in — this demo runs on the ${DEMO_PROFILE.name} profile.`}
        </p>
      </form>
    </AuthShell>
  )
}
