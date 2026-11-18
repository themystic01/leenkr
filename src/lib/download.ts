import { recordDownload } from './api'
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
 * Asks the file service for a short-lived link first — it re-checks the paid
 * order there, so the bucket stays private — and only then records the download.
 * Counting after the handoff means a storage outage never inflates the number.
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
    return { ok: false, error: error instanceof Error ? error.message : 'Download failed.' }
  }

  const counted = await recordDownload(productId, token)
  if (!counted.ok) {
    return {
      ok: false,
      error:
        counted.error === 'payment_required'
          ? 'Buy this product to download the file.'
          : counted.error,
    }
  }

  window.open(url, '_blank', 'noopener')
  return { ok: true }
}
