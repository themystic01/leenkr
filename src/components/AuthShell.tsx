import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { hasBackend } from '../lib/supabase'

// Shared frame for sign in and sign up: brand panel on the left, form on the right.
export default function AuthShell({
  eyebrow,
  title,
  sub,
  children,
  footer,
}: {
  eyebrow: string
  title: string
  sub: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="auth-shell">
      <aside className="auth-brand">
        <Link to="/" className="auth-brand-mark" aria-label="Leenkr home">
          L
        </Link>
        <div className="auth-brand-copy">
          <p className="auth-quote">Everything you make, behind one link.</p>
          <p className="auth-quote-sub">
            Products, links and your inbox on a page people can actually buy from.
          </p>
        </div>
        <ul className="auth-list">
          <li>Sell digital products without a storefront</li>
          <li>One switch instead of four competing links</li>
          <li>Email, bookings and collabs in the same place</li>
        </ul>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="auth-title">{title}</h1>
          <p className="auth-sub">{sub}</p>
          {children}
          <div className="auth-foot">{footer}</div>
        </div>
        {hasBackend ? null : (
          <p className="auth-note">
            Preview build — sessions live on this device, and you land on the demo creator profile.
          </p>
        )}
      </main>
    </div>
  )
}
