import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { backend, hasBackend } from './lib/supabase'

export type Plan = 'free' | 'pro' | 'creator'

export type Session = {
  email: string
  /** The name typed at sign-up, so onboarding does not ask for it twice. */
  name?: string
  plan: Plan
  onboarded: boolean
  userId: string
}

type AuthUser = { id: string; email?: string; user_metadata?: { name?: string } }

const SESSION_KEY = 'leenkr.session.v1'

// There is no backend configured, so every sign-in lands on the same demo creator.
export const DEMO_PROFILE = {
  name: 'Ada Obi',
  username: 'adaobi',
  email: 'hello@leenkr.app',
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
  signUp: (email: string, password: string, name?: string) => Promise<AuthResult>
  resetPassword: (email: string) => Promise<AuthResult>
  updatePassword: (password: string) => Promise<AuthResult>
  finishOnboarding: () => void
  signOut: () => void
}

const SessionContext = createContext<Auth | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => loadSession())
  const [ready, setReady] = useState(!hasBackend)

  // A Supabase user is onboarded once their page exists, or once this browser
  // has already walked them through the setup.
  const readSession = useCallback(async (user: AuthUser): Promise<Session> => {
    let onboarded = readOnboarded(user.id)
    if (backend && !onboarded) {
      const { data } = await backend.from('pages').select('id').eq('owner_id', user.id).maybeSingle()
      onboarded = Boolean(data)
    }
    return {
      email: user.email ?? '',
      name: user.user_metadata?.name ?? '',
      plan: 'free',
      onboarded,
      userId: user.id,
    }
  }, [])

  useEffect(() => {
    if (!backend) {
      setReady(true)
      return
    }

    let alive = true
    const apply = (user: AuthUser | null) => {
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
      // refreshed or revoked token in step with the UI. INITIAL_SESSION and
      // SIGNED_IN are what a confirmation link produces on the way back in.
      if (
        event === 'INITIAL_SESSION' ||
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'SIGNED_OUT'
      ) {
        apply(next?.user ?? null)
      }
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
    async (email: string, password: string, name?: string): Promise<AuthResult> => {
      const displayName = name?.trim() || undefined
      if (!backend) {
        setSession({ email: email.trim(), name: displayName, plan: 'free', onboarded: false, userId: 'demo' })
        return { ok: true }
      }

      const { data, error } = await backend.auth.signUp({
        email: email.trim(),
        password,
        // The confirmation link must come back to the app, not to Supabase's
        // default page. This path has to be on the project's redirect allowlist.
        // The name rides in the user's metadata so onboarding can prefill it.
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding`,
          data: { name: displayName },
        },
      })
      if (error) return { ok: false, error: error.message }
      // With email confirmation on, there is no session until the link is used.
      if (!data.session || !data.user) return { ok: true, needsConfirmation: true }

      setSession(await readSession(data.user))
      return { ok: true }
    },
    [readSession],
  )

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    if (!backend) return { ok: false, error: 'Password reset needs the backend configured.' }
    const { error } = await backend.auth.resetPasswordForEmail(email.trim(), {
      // The recovery link comes back to a page that can set a new password.
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  }, [])

  const updatePassword = useCallback(
    async (password: string): Promise<AuthResult> => {
      if (!backend) return { ok: false, error: 'Password reset needs the backend configured.' }
      const { data, error } = await backend.auth.updateUser({ password })
      if (error) return { ok: false, error: error.message }
      // A reset should also end any session someone else may still be holding.
      await backend.auth.signOut({ scope: 'others' })
      if (data.user) setSession(await readSession(data.user))
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
    () => ({
      session,
      ready,
      signIn,
      signUp,
      resetPassword,
      updatePassword,
      finishOnboarding,
      signOut,
    }),
    [session, ready, signIn, signUp, resetPassword, updatePassword, finishOnboarding, signOut],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const store = useContext(SessionContext)
  if (!store) throw new Error('useSession must be used inside SessionProvider')
  return store
}
