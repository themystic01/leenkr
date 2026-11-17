import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, MailCheck } from 'lucide-react'
import AuthShell from '../components/AuthShell'
import { useSession } from '../auth'
import { usePageTitle } from '../lib/title'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ForgotPassword() {
  usePageTitle('Reset your password · Leenkr')
  const { resetPassword } = useSession()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Enter the email address you signed up with.')
      return
    }
    setError('')
    setBusy(true)
    const result = await resetPassword(email)
    setBusy(false)
    if (!result.ok) {
      setError(result.error ?? 'Could not send the reset link.')
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <AuthShell
        eyebrow="Check your inbox"
        title="Reset link sent"
        sub={`If ${email.trim()} has a Leenkr account, a link to choose a new password is on its way.`}
        footer={
          <>
            Remembered it? <Link to="/login">Sign in</Link>
          </>
        }
      >
        <div className="auth-form">
          <p className="auth-hint">
            <MailCheck size={15} /> The link is good for an hour and can only be used once.
          </p>
          <Link className="btn auth-submit" to="/login">
            Back to sign in
            <ArrowRight size={16} />
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      eyebrow="Forgot password"
      title="Choose a new password"
      sub="We’ll email you a link that opens a page where you can set a new one."
      footer={
        <>
          Remembered it? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="forgot-email">Email</label>
          <input
            id="forgot-email"
            className="input"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="you@studio.com"
            value={email}
            onChange={(event) => {
              setError('')
              setEmail(event.target.value)
            }}
          />
          {error ? <p className="field-error">{error}</p> : null}
        </div>

        <button type="submit" className="btn auth-submit" disabled={busy}>
          {busy ? 'Sending…' : 'Send reset link'}
          <ArrowRight size={16} />
        </button>

        <p className="auth-hint">
          The link opens Leenkr with a short-lived session, so you can set the new password right
          here.
        </p>
      </form>
    </AuthShell>
  )
}
