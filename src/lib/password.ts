// One place for the password rule so sign up, reset and settings can't drift.
// Supabase's own minimum is 8 too (Auth → Providers → Email).
export const PASSWORD_MIN = 8

/** Returns the message to show, or null when the password is acceptable. */
export function passwordProblem(password: string): string | null {
  if (password.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`
  return null
}
