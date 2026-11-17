import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, KeyRound } from 'lucide-react'
import AuthShell from '../components/AuthShell'
import { useSession } from '../auth'
import { usePageTitle } from '../lib/title'

export default function ResetPassword() {
  usePageTitle('Set a new password · Leenkr')
  const { session, ready, updatePassword } = useSession()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (password.length < 8) {
      setError('Use at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('The two passwords don’t match.')
      return
    }
    setError('')
    setBusy(true)
    const result = await updatePassword(password)
    setBusy(false)
    if (!result.ok) {
      setError(result.error ?? 'Could not save the new password.')
      return
    }
    navigate('/dashboard')
  }

  // The recovery link restores a session before this route renders.
  if (!ready) return <div className="mk-boot" aria-hidden="true" />

  if (!session) {
    return (
      <AuthShell
        eyebrow="Link expired"
        title="Ask for a new link"
        sub="This reset link has already been used or has timed out. Request a fresh one and it will open this page again."
        footer={
          <>
            Remembered it? <Link to="/login">Sign in</Link>
          </>
        }
      >
        <div className="auth-form">
          <p className="auth-hint">
            <KeyRound size={15} /> Reset links last an hour and work once.
          </p>
          <Link className="btn auth-submit" to="/forgot-password">
            Send a new link
            <ArrowRight size={16} />
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      eyebrow="New password"
      title="Set your new password"
      sub={`You’re signed in as ${session.email}. Pick a password you haven’t used before.`}
      footer={
        <>
          Changed your mind? <Link to="/dashboard">Back to the studio</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="reset-password">New password</label>
          <input
            id="reset-password"
            className="input"
            type="password"
            autoComplete="new-password"
            autoFocus
            placeholder="At least 8 characters"
            value={password}
            onChange={(event) => {
              setError('')
              setPassword(event.target.value)
            }}
          />
        </div>

        <div className="field">
          <label htmlFor="reset-confirm">Confirm new password</label>
          <input
            id="reset-confirm"
            className="input"
            type="password"
            autoComplete="new-password"
            placeholder="Type it again"
            value={confirm}
            onChange={(event) => {
              setError('')
              setConfirm(event.target.value)
            }}
          />
          {error ? <p className="field-error">{error}</p> : null}
        </div>

        <button type="submit" className="btn auth-submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save password'}
          <ArrowRight size={16} />
        </button>
      </form>
    </AuthShell>
  )
}
