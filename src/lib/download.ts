import { StorageUnavailable, getDownloadUrl } from './storage'

export type DownloadResult = { ok: true } | { ok: false; error: string }

const TOKEN_PREFIX = 'leenkr.order.'

export function savedOrderToken(productId: string): string | null {
  try {
    return localStorage.getItem(`${TOKEN_PREFIX}${productId}`)
  } catch {
    return null
  }
}

export function rememberOrderToken(productId: string, token: string) {
  try {
    localStorage.setItem(`${TOKEN_PREFIX}${productId}`, token)
  } catch {
    // Private browsing — the receipt still works for this visit.
  }
}

/**
 * Asks the file service for a short-lived link. It re-checks the paid order (or
 * that the product is free) before signing anything, so the bucket stays private.
 */
export async function startDownload(productId: string, token: string | null): Promise<DownloadResult> {
  let url: string
  try {
    url = await getDownloadUrl(productId, token)
  } catch (error) {
    if (error instanceof StorageUnavailable) {
      return {
        ok: false,
        error:
          'File storage is not connected yet. Add the R2 credentials to the deployment to hand out downloads.',
      }
    }
    const message = error instanceof Error ? error.message : ''
    if (message === 'payment_required') {
      return { ok: false, error: 'Buy this product to download the file.' }
    }
    return { ok: false, error: message || 'Download failed.' }
  }

  window.open(url, '_blank', 'noopener')
  return { ok: true }
}
