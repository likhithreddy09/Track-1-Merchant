export default async function handler(req, res) {
  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) {
    res.status(501).json({ error: 'GOOGLE_PLACES_API_KEY not configured' })
    return
  }

  const parts = req.query.path
  const path = Array.isArray(parts) ? parts.join('/') : parts || ''
  const target = new URL(`https://maps.googleapis.com/${path}`)

  for (const [k, v] of Object.entries(req.query)) {
    if (k === 'path') continue
    if (Array.isArray(v)) v.forEach((item) => target.searchParams.append(k, item))
    else if (v != null) target.searchParams.set(k, String(v))
  }
  target.searchParams.set('key', key)

  try {
    const upstream = await fetch(target.toString(), { method: 'GET' })
    const buf = Buffer.from(await upstream.arrayBuffer())
    const ct = upstream.headers.get('content-type')
    if (ct) res.setHeader('Content-Type', ct)
    res.status(upstream.status).send(buf)
  } catch (err) {
    res.status(502).json({ error: 'Google proxy failed', detail: String(err?.message || err) })
  }
}
