export const config = {
  api: { bodyParser: false },
}

async function readRawBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks)
}

export default async function handler(req, res) {
  const key = process.env.SARVAM_API_KEY
  if (!key) {
    res.status(500).json({ error: 'SARVAM_API_KEY not configured' })
    return
  }

  const parts = req.query.path
  const path = Array.isArray(parts) ? parts.join('/') : parts || ''
  const url = `https://api.sarvam.ai/${path}`

  const headers = { 'api-subscription-key': key }
  const contentType = req.headers['content-type']
  if (contentType) headers['Content-Type'] = contentType

  const init = { method: req.method, headers }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await readRawBody(req)
  }

  try {
    const upstream = await fetch(url, init)
    const buf = Buffer.from(await upstream.arrayBuffer())
    const ct = upstream.headers.get('content-type')
    if (ct) res.setHeader('Content-Type', ct)
    res.status(upstream.status).send(buf)
  } catch (err) {
    res.status(502).json({ error: 'Sarvam proxy failed', detail: String(err?.message || err) })
  }
}
