import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { backend, hasBackend } from './lib/supabase'

export type Plan = 'free' | 'pro' | 'creator'

export type Session = {
  email: string
  plan: Plan
  onboarded: boolean
  userId: string
}

const SESSION_KEY = 'leenkr.session.v1'

// There is no backend configured, so every sign-in lands on the same demo creator.
export const DEMO_PROFILE = {
  name: 'Collins Nzagha',
  username: 'collinsnzagha',
  email: 'collins@leenkr.com',
  bio: 'Designer and builder. I make calm interfaces for loud ideas, and sell the kits that come out of the work.',
}

function onboardedKey(userId: string) {
  return `leenkr.onboarded.${userId}`
}

function readOnboarded(userId: string): boolean {
  try {
    return localStorage.getItem(onboardedKey(userId)) === '1'
  } catch {
    return false
  }
}

function rememberOnboarded(userId: string) {
  try {
    localStorage.setItem(onboardedKey(userId), '1')
  } catch {
    // Storage blocked — onboarding still finishes for this visit.
  }
}

function loadSession(): Session | null {
  if (hasBackend) return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Session>
    if (typeof parsed.email !== 'string' || !parsed.email) return null
    return {
      email: parsed.email,
      plan: parsed.plan === 'pro' || parsed.plan === 'creator' ? parsed.plan : 'free',
      onboarded: Boolean(parsed.onboarded),
      userId: 'demo',
    }
  } catch {
    return null
  }
}

export type AuthResult = { ok: boolean; error?: string; needsConfirmation?: boolean }

type Auth = {
  session: Session | null
  /** False while a stored Supabase session is still being restored. */
  ready: boolean
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (email: string, password: string) => Promise<AuthResult>
  finishOnboarding: () => void
  signOut: () => void
}

const SessionContext = createContext<Auth | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => loadSession())
  const [ready, setReady] = useState(!hasBackend)

  // A Supabase user is onboarded once their page exists, or once this browser
  // has already walked them through the setup.
  const readSession = useCallback(async (user: { id: string; email?: string }): Promise<Session> => {
    let onboarded = readOnboarded(user.id)
    if (backend && !onboarded) {
      const { data } = await backend.from('pages').select('id').eq('owner_id', user.id).maybeSingle()
      onboarded = Boolean(data)
    }
    return { email: user.email ?? '', plan: 'free', onboarded, userId: user.id }
  }, [])

  useEffect(() => {
    if (!backend) {
      setReady(true)
      return
    }

    let alive = true
    const apply = (user: { id: string; email?: string } | null) => {
      if (!user) {
        if (alive) {
          setSession(null)
          setReady(true)
        }
        return
      }
      void readSession(user).then((next) => {
        if (!alive) return
        setSession(next)
        setReady(true)
      })
    }

    backend.auth
      .getSession()
      .then(({ data }) => apply(data.session?.user ?? null))
      .catch(() => alive && setReady(true))

    const { data: subscription } = backend.auth.onAuthStateChange((event, next) => {
      // Signing in and out is handled by the actions themselves; this keeps a
      // refreshed or revoked token in step with the UI.
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_OUT') apply(next?.user ?? null)
    })

    return () => {
      alive = false
      subscription.subscription.unsubscribe()
    }
  }, [readSession])

  // The demo build keeps its session on this device, as before.
  useEffect(() => {
    if (hasBackend) return
    try {
      if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
      else localStorage.removeItem(SESSION_KEY)
    } catch {
      // Storage blocked — the session still holds for this visit.
    }
  }, [session])

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      if (!backend) {
        setSession({ email: email.trim(), plan: 'free', onboarded: true, userId: 'demo' })
        return { ok: true }
      }

      const { data, error } = await backend.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) return { ok: false, error: error.message }
      if (data.user) setSession(await readSession(data.user))
      return { ok: true }
    },
    [readSession],
  )

  const signUp = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      if (!backend) {
        setSession({ email: email.trim(), plan: 'free', onboarded: false, userId: 'demo' })
        return { ok: true }
      }

      const { data, error } = await backend.auth.signUp({ email: email.trim(), password })
      if (error) return { ok: false, error: error.message }
      // With email confirmation on, there is no session until the link is used.
      if (!data.session || !data.user) return { ok: true, needsConfirmation: true }

      setSession(await readSession(data.user))
      return { ok: true }
    },
    [readSession],
  )

  const finishOnboarding = useCallback(() => {
    setSession((current) => {
      if (!current) return current
      rememberOnboarded(current.userId)
      return { ...current, onboarded: true }
    })
  }, [])

  const signOut = useCallback(() => {
    if (backend) void backend.auth.signOut()
    setSession(null)
  }, [])

  const value = useMemo(
    () => ({ session, ready, signIn, signUp, finishOnboarding, signOut }),
    [session, ready, signIn, signUp, finishOnboarding, signOut],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const store = useContext(SessionContext)
  if (!store) throw new Error('useSession must be used inside SessionProvider')
  return store
}
