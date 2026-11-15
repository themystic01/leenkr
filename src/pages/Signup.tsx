import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import AuthShell from '../components/AuthShell'
import { DEMO_PROFILE, useSession } from '../auth'
import { usePageTitle } from '../lib/title'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Signup() {
  usePageTitle('Create your page · Leenkr')
  const { signUp } = useSession()
  const navigate = useNavigate()
  const [name, setName] = useState(DEMO_PROFILE.name)
  const [email, setEmail] = useState(DEMO_PROFILE.email)
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const found: Record<string, string> = {}
    if (name.trim().length < 2) found.name = 'Tell us what to call you.'
    if (!EMAIL_PATTERN.test(email.trim())) found.email = 'Enter a valid email address.'
    if (password.length < 8) found.password = 'Use at least 8 characters.'
    setErrors(found)
    if (Object.keys(found).length > 0) return

    signUp(email)
    navigate('/onboarding')
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
            placeholder="At least 8 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {errors.password ? <p className="field-error">{errors.password}</p> : null}
        </div>

        <button type="submit" className="btn auth-submit">
          Create account
          <ArrowRight size={16} />
        </button>

        <p className="auth-hint">
          Next you pick your handle and your page goes live. You can change everything later.
        </p>
      </form>
    </AuthShell>
  )
}
