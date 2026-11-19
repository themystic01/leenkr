import { backend } from './supabase'

/** The private bucket key plus the details shown in the studio. */
export type UploadedFile = { key: string; name: string; size: number; type: string }

// 512 MB covers video courses without letting a typo upload a disc image.
export const MAX_FILE_BYTES = 512 * 1024 * 1024

export class StorageUnavailable extends Error {}

/** The token the browser sent belongs to a session the auth server has ended. */
class StaleSession extends Error {}

type Endpoint = { action: 'upload-url'; pageId: string; fileName: string; fileType: string; fileSize: number } | {
  action: 'download-url'
  productId: string
  token: string | null
}

async function storedToken(): Promise<string | null> {
  const { data } = (await backend?.auth.getSession()) ?? { data: { session: null } }
  return data.session?.access_token ?? null
}

async function refreshedToken(): Promise<string | null> {
  const { data } = (await backend?.auth.refreshSession()) ?? { data: { session: null } }
  return data.session?.access_token ?? null
}

async function send(body: Endpoint, accessToken: string | null): Promise<{ url: string; key?: string }> {
  let response: Response
  try {
    response = await fetch('/api/storage', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(body),
    })
  } catch {
    throw new StorageUnavailable('The file service is unreachable.')
  }

  // Vite's dev server answers /api with the app shell, so a non-JSON reply
  // means the signing endpoint has not been deployed or run.
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    throw new StorageUnavailable('FILE_STORAGE_NOT_CONFIGURED')
  }

  const payload = (await response.json()) as { url?: string; key?: string; error?: string }
  if (!response.ok || !payload.url) {
    if (response.status === 501) throw new StorageUnavailable('FILE_STORAGE_NOT_CONFIGURED')
    if (response.status === 401) throw new StaleSession(payload.error ?? 'Sign in again.')
    throw new Error(payload.error ?? 'The file service refused the request.')
  }
  return { url: payload.url, key: payload.key }
}

async function callStorage(body: Endpoint): Promise<{ url: string; key?: string }> {
  const first = await storedToken()
  try {
    return await send(body, first)
  } catch (error) {
    if (!(error instanceof StaleSession)) throw error
  }

  // A tab can outlive its session: signing out or resetting the password in
  // another tab ends the session while this one still holds its token. Try one
  // refresh, and if the session is really gone, clear it so the app asks the
  // creator to sign in again instead of failing at the upload screen.
  const next = await refreshedToken()
  if (next) return send(body, next)

  await backend?.auth.signOut({ scope: 'local' })
  throw new Error('Your session ended, so the upload stopped. Sign in again and retry.')
}

/** Uploads the product's file straight to R2 through a short-lived presigned URL. */
export async function uploadProductFile(file: File, pageId: string): Promise<UploadedFile> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('That file is larger than 512 MB.')
  }

  const signed = await callStorage({
    action: 'upload-url',
    pageId,
    fileName: file.name,
    fileType: file.type || 'application/octet-stream',
    fileSize: file.size,
  })

  const upload = await fetch(signed.url, {
    method: 'PUT',
    headers: { 'content-type': file.type || 'application/octet-stream' },
    body: file,
  })
  if (!upload.ok) throw new Error('The upload did not finish. Try again.')

  return {
    key: signed.key ?? '',
    name: file.name,
    size: file.size,
    type: file.type || 'application/octet-stream',
  }
}

/**
 * Asks for a download link. The server checks the paid order (or that the
 * product is free) before it signs anything, so the bucket stays private.
 */
export async function getDownloadUrl(productId: string, token: string | null): Promise<string> {
  const signed = await callStorage({ action: 'download-url', productId, token })
  return signed.url
}
