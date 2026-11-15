import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Plan = 'free' | 'pro' | 'creator'

export type Session = {
  email: string
  plan: Plan
  onboarded: boolean
}

const SESSION_KEY = 'leenkr.session.v1'

// There is no backend yet, so every sign-in lands on the same demo creator.
export const DEMO_PROFILE = {
  name: 'Collins Nzagha',
  username: 'collinsnzagha',
  email: 'collins@leenkr.com',
  bio: 'Designer and builder. I make calm interfaces for loud ideas, and sell the kits that come out of the work.',
}

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Session>
    if (typeof parsed.email !== 'string' || !parsed.email) return null
    return {
      email: parsed.email,
      plan: parsed.plan === 'pro' || parsed.plan === 'creator' ? parsed.plan : 'free',
      onboarded: Boolean(parsed.onboarded),
    }
  } catch {
    return null
  }
}

type Auth = {
  session: Session | null
  signIn: (email: string, plan?: Plan) => void
  signUp: (email: string, plan?: Plan) => void
  finishOnboarding: () => void
  signOut: () => void
}

const SessionContext = createContext<Auth | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => loadSession())

  useEffect(() => {
    try {
      if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
      else localStorage.removeItem(SESSION_KEY)
    } catch {
      // Storage blocked — the session still holds for this visit.
    }
  }, [session])

  const signIn = useCallback((email: string, plan: Plan = 'free') => {
    setSession({ email: email.trim(), plan, onboarded: true })
  }, [])

  const signUp = useCallback((email: string, plan: Plan = 'free') => {
    setSession({ email: email.trim(), plan, onboarded: false })
  }, [])

  const finishOnboarding = useCallback(() => {
    setSession((current) => (current ? { ...current, onboarded: true } : current))
  }, [])

  const signOut = useCallback(() => setSession(null), [])

  const value = useMemo(
    () => ({ session, signIn, signUp, finishOnboarding, signOut }),
    [session, signIn, signUp, finishOnboarding, signOut],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const store = useContext(SessionContext)
  if (!store) throw new Error('useSession must be used inside SessionProvider')
  return store
}
