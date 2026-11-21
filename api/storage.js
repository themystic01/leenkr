import crypto from 'node:crypto'

/**
 * File service for product files.
 *
 * The R2 bucket is private: nothing here ever returns a public URL. Uploads are
 * signed only for the creator who owns the page, and downloads are signed only
 * for a free product or a paid order that carries the matching download token.
 *
 * Needs these environment variables (Vercel → Settings → Environment Variables):
 *   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
 * Without them every call answers 501 and the studio says storage isn't set up.
 */

const REQUIRED = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET',
]

function configured() {
  return REQUIRED.every((name) => Boolean(process.env[name]))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
      if (raw.length > 200_000) reject(new Error('Body too large'))
    })
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {})
      } catch {
        reject(new Error('Invalid JSON'))
      }
    })
    req.on('error', reject)
  })
}

async function supabase(path, { method = 'GET', token, body } = {}) {
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: service,
      authorization: `Bearer ${service}`,
      'content-type': 'application/json',
      prefer: 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!response.ok) return null
  return response.json()
}

async function signedInUser(authorization) {
  const token = authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return null
  const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY,
      authorization: `Bearer ${token}`,
    },
  })
  if (!response.ok) return null
  const user = await response.json().catch(() => null)
  return user && user.id ? user : null
}

/* ------------------------------ AWS SigV4 ------------------------------- */

function rfc3986(value) {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  )
}

function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function hmac(key, value) {
  return crypto.createHmac('sha256', key).update(value).digest()
}

function presign({ method, key, expires }) {
  const host = `${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  const bucket = process.env.R2_BUCKET
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secret = process.env.R2_SECRET_ACCESS_KEY

  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const dateStamp = amzDate.slice(0, 8)
  const scope = `${dateStamp}/auto/s3/aws4_request`
  const canonicalUri = `/${bucket}/${key.split('/').map(rfc3986).join('/')}`

  const query = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${accessKeyId}/${scope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expires),
    'X-Amz-SignedHeaders': 'host',
  }
  const canonicalQuery = Object.keys(query)
    .sort()
    .map((name) => `${rfc3986(name)}=${rfc3986(query[name])}`)
    .join('&')

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuery,
    `host:${host}\n`,
    'host',
    'UNSIGNED-PAYLOAD',
  ].join('\n')

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    scope,
    hash(canonicalRequest),
  ].join('\n')

  const signingKey = hmac(
    hmac(hmac(hmac(`AWS4${secret}`, dateStamp), 'auto'), 's3'),
    'aws4_request',
  )
  const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex')

  return `https://${host}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`
}

/* -------------------------------- routes -------------------------------- */

function safeName(name) {
  return String(name || 'file')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'file'
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST' })
    return
  }
  if (!configured()) {
    res.status(501).json({ error: 'FILE_STORAGE_NOT_CONFIGURED' })
    return
  }

  let body
  try {
    body = await readBody(req)
  } catch (error) {
    res.status(400).json({ error: error.message })
    return
  }

  try {
    if (body.action === 'upload-url') {
      const user = await signedInUser(req.headers.authorization)
      if (!user) {
        res.status(401).json({ error: 'Sign in again to upload files.' })
        return
      }
      const pages = await supabase(
        `pages?id=eq.${encodeURIComponent(body.pageId)}&select=id,owner_id,suspended_at`,
      )
      const page = Array.isArray(pages) ? pages[0] : null
      if (!page || page.owner_id !== user.id) {
        res.status(403).json({ error: 'That page is not yours.' })
        return
      }
      if (page.suspended_at) {
        res.status(403).json({ error: 'This page is suspended.' })
        return
      }
      const key = `${page.id}/${crypto.randomUUID()}-${safeName(body.fileName)}`
      res.status(200).json({ url: presign({ method: 'PUT', key, expires: 900 }), key })
      return
    }

    if (body.action === 'download-url') {
      const products = await supabase(
        `page_products?id=eq.${encodeURIComponent(body.productId)}&select=id,is_free,page_id,pages!inner(published,suspended_at)`,
      )
      const product = Array.isArray(products) ? products[0] : null
      if (!product) {
        res.status(404).json({ error: 'Product not found.' })
        return
      }
      const page = Array.isArray(product.pages) ? product.pages[0] : product.pages
      if (!page?.published || page.suspended_at) {
        res.status(404).json({ error: 'This page is not live.' })
        return
      }

      if (!product.is_free) {
        const token = String(body.token || '')
        if (!/^[0-9a-f-]{36}$/i.test(token)) {
          res.status(402).json({ error: 'payment_required' })
          return
        }
        const orders = await supabase(
          `page_orders?product_id=eq.${encodeURIComponent(body.productId)}&download_token=eq.${token}&status=eq.paid&select=id`,
        )
        if (!Array.isArray(orders) || orders.length === 0) {
          res.status(402).json({ error: 'payment_required' })
          return
        }
      }

      const files = await supabase(
        `product_files?product_id=eq.${encodeURIComponent(body.productId)}&select=file_key`,
      )
      const file = Array.isArray(files) ? files[0] : null
      if (!file?.file_key) {
        res.status(404).json({ error: 'This product has no file yet.' })
        return
      }

      res.status(200).json({ url: presign({ method: 'GET', key: file.file_key, expires: 300 }) })
      return
    }

    res.status(400).json({ error: 'Unknown action' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
