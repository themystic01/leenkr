import { useEffect } from 'react'

// Each top-level screen names its own tab; leaving restores the previous title.
export function usePageTitle(title: string) {
  useEffect(() => {
    const previous = document.title
    document.title = title
    return () => {
      document.title = previous
    }
  }, [title])
}
