// Handles are lowercase letters, numbers, dashes and underscores, 3–24 long.
// Typed or pasted input is cleaned the same way everywhere so a handle claimed
// on the marketing hero arrives at onboarding unchanged.
export const MAX_HANDLE = 24

export function cleanHandle(value: string | null | undefined) {
  return (value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '')
    .slice(0, MAX_HANDLE)
}
