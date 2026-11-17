import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Both variables are public by design: the URL and the publishable key ship in
// the browser bundle, and row level security is what keeps data apart.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const hasBackend = Boolean(url && key)

// Without the two variables the app runs on the local demo store, so a fresh
// clone still works before anyone touches Supabase.
export const backend: SupabaseClient | null = hasBackend
  ? createClient(url as string, key as string, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null

if (import.meta.env.DEV && !hasBackend) {
  console.info('[leenkr] No VITE_SUPABASE_* variables — running on the local demo store.')
}
