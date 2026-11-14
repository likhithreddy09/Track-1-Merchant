/** Sarvam AI client — calls go through Vite proxy `/api/sarvam` so the key stays server-side. */

export type SarvamLang =
  | 'en-IN'
  | 'hi-IN'
  | 'te-IN'
  | 'ta-IN'
  | 'mr-IN'
  | 'bn-IN'
  | 'gu-IN'
  | 'kn-IN'
  | 'ml-IN'
  | 'pa-IN'

export const SARVAM_LANGS: { code: SarvamLang; label: string; native: string }[] = [
  { code: 'en-IN', label: 'English', native: 'English' },
  { code: 'hi-IN', label: 'Hindi', native: 'हिन्दी' },
  { code: 'te-IN', label: 'Telugu', native: 'తెలుగు' },
  { code: 'ta-IN', label: 'Tamil', native: 'தமிழ்' },
  { code: 'mr-IN', label: 'Marathi', native: 'मराठी' },
  { code: 'bn-IN', label: 'Bengali', native: 'বাংলা' },
  { code: 'gu-IN', label: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'kn-IN', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml-IN', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'pa-IN', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
]

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

async function sarvamFetch(path: string, body: unknown): Promise<Response> {
  return fetch(`/api/sarvam${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function translateText(
  input: string,
  target: SarvamLang,
  source: SarvamLang | 'auto' = 'auto',
): Promise<string> {
  const text = input.trim()
  if (!text) return text
  if (target === 'en-IN' && source === 'en-IN') return text

  // Mayura max ~1000 chars — chunk long answers
  if (text.length > 900) {
    const parts = splitChunks(text, 900)
    const out: string[] = []
    for (const part of parts) {
      out.push(await translateText(part, target, source))
    }
    return out.join(' ')
  }

  const res = await sarvamFetch('/translate', {
    input: text,
    source_language_code: source,
    target_language_code: target,
    model: 'mayura:v1',
    mode: 'modern-colloquial',
  })

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`Sarvam translate failed (${res.status}): ${err.slice(0, 160)}`)
  }

  const data = (await res.json()) as { translated_text?: string }
  return data.translated_text?.trim() || text
}

export async function chatMerchant(opts: {
  question: string
  lang: SarvamLang
  system: string
  history?: ChatMessage[]
}): Promise<string> {
  const langName = SARVAM_LANGS.find((l) => l.code === opts.lang)?.label || 'English'
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `${opts.system}\n\nAlways reply in ${langName} (${opts.lang}). Keep answers short and practical for a neighbourhood shop owner. Use simple words.`,
    },
    ...(opts.history || []).slice(-6),
    { role: 'user', content: opts.question },
  ]

  const res = await sarvamFetch('/v1/chat/completions', {
    model: 'sarvam-105b-conversations',
    messages,
    temperature: 0.4,
    max_tokens: 450,
  })

  if (!res.ok) {
    // fallback: try flagship model name
    const res2 = await sarvamFetch('/v1/chat/completions', {
      model: 'sarvam-105b',
      messages,
      temperature: 0.4,
      max_tokens: 450,
    })
    if (!res2.ok) {
      const err = await res.text().catch(() => '')
      throw new Error(`Sarvam chat failed (${res.status}): ${err.slice(0, 160)}`)
    }
    const data2 = (await res2.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    return data2.choices?.[0]?.message?.content?.trim() || ''
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  return data.choices?.[0]?.message?.content?.trim() || ''
}

function splitChunks(text: string, size: number): string[] {
  const parts: string[] = []
  let i = 0
  while (i < text.length) {
    parts.push(text.slice(i, i + size))
    i += size
  }
  return parts
}

export function buildMerchantSystem(ctx: {
  shopName?: string
  shopLabel: string
  shopId?: string
  place: string
  people: number
  households: number
  rivals: number
  topRival?: string
  heroSkus?: string[]
}): string {
  const skus = (ctx.heroSkus || []).slice(0, 3).join(', ')
  const typeHint =
    ctx.shopId === 'electronics'
      ? 'This is an electronics / mobile accessories shop. Talk about warranty, sealed boxes, EMI, cables, earphones, cases — never kirana / grocery / festival shelf / small-pack advice.'
      : `Stay inside ${ctx.shopLabel} category advice only. Never switch to a different shop type.`
  return [
    `You are Paytm Neighbourhood Merchant AI — a co-pilot for an Indian ${ctx.shopLabel} merchant.`,
    `Shop: ${ctx.shopName || 'Merchant'} (${ctx.shopLabel}) in ${ctx.place}.`,
    `Catchment: ~${ctx.people.toLocaleString('en-IN')} people, ${ctx.households.toLocaleString('en-IN')} households, ${ctx.rivals} rivals nearby.`,
    ctx.topRival ? `Notable rival: ${ctx.topRival}.` : '',
    skus ? `Hero SKUs this week: ${skus}.` : '',
    typeHint,
    'Help with rivals, reviews, demand, and inventory exchange deals.',
    'When asked how to beat a rival: give 3–4 concrete actions for THIS shop type only.',
    'Do not invent exact live Google data — use the numbers given.',
    'Never use markdown asterisks or code fences. Write plain sentences. Put key numbers in plain text.',
  ]
    .filter(Boolean)
    .join(' ')
}

/** Strip markdown leftovers from model replies for clean UI. */
export function cleanChatText(raw: string): string {
  return raw
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Highlight numbers / ★ in reply for nicer bubbles (safe HTML). */
export function formatChatHtml(raw: string): string {
  const plain = cleanChatText(raw)
  const esc = plain
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return esc
    .replace(
      /(★?\s?\d{1,3}(?:,\d{2,3})*(?:\.\d+)?%?)/g,
      '<strong class="mai-num">$1</strong>',
    )
    .replace(/\n/g, '<br />')
}

let currentAudio: HTMLAudioElement | null = null

export function stopSpeaking() {
  currentAudio?.pause()
  currentAudio = null
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

/** Sarvam Bulbul TTS — falls back to browser speechSynthesis. */
export async function speakText(text: string, lang: SarvamLang): Promise<void> {
  stopSpeaking()
  const clean = cleanChatText(text).slice(0, 2400)
  if (!clean) return

  try {
    // bulbul:v3 — speaker must be a valid v3 voice (meera is invalid)
    const speaker =
      lang === 'hi-IN' || lang === 'en-IN'
        ? 'priya'
        : lang === 'te-IN' || lang === 'ta-IN' || lang === 'kn-IN' || lang === 'ml-IN'
          ? 'kavitha'
          : 'shubh'
    const res = await sarvamFetch('/text-to-speech', {
      text: clean,
      language_code: lang,
      model: 'bulbul:v3',
      speaker,
      speech_sample_rate: 22050,
      pace: 1.0,
    })
    if (res.ok) {
      const data = (await res.json()) as { audios?: string[]; audio?: string }
      const b64 = data.audios?.[0] || data.audio
      if (b64) {
        const audio = new Audio(`data:audio/wav;base64,${b64}`)
        currentAudio = audio
        await audio.play()
        return
      }
    }
  } catch {
    // fall through to browser TTS
  }

  if (!('speechSynthesis' in window)) return
  const utter = new SpeechSynthesisUtterance(clean)
  utter.lang = lang
  const voices = window.speechSynthesis.getVoices()
  const match =
    voices.find((v) => v.lang === lang) ||
    voices.find((v) => v.lang.startsWith(lang.slice(0, 2))) ||
    voices.find((v) => /India|Indian/i.test(v.name))
  if (match) utter.voice = match
  utter.rate = 1
  window.speechSynthesis.speak(utter)
}

/** Record mic → Sarvam Saaras STT. Returns transcript or null. */
export async function listenOnce(lang: SarvamLang, maxMs = 8000): Promise<string | null> {
  if (!navigator.mediaDevices?.getUserMedia) return null

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : ''
  const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
  const chunks: BlobPart[] = []

  const done = new Promise<Blob>((resolve) => {
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data)
    }
    recorder.onstop = () => resolve(new Blob(chunks, { type: mime || 'audio/webm' }))
  })

  recorder.start()
  await new Promise((r) => window.setTimeout(r, maxMs))
  if (recorder.state !== 'inactive') recorder.stop()
  stream.getTracks().forEach((t) => t.stop())

  const blob = await done
  if (blob.size < 800) return null

  const form = new FormData()
  form.append('file', blob, 'voice.webm')
  form.append('model', 'saaras:v4')
  form.append('language_code', lang)

  const res = await fetch('/api/sarvam/speech-to-text', {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    // Browser SpeechRecognition fallback
    return listenBrowser(lang)
  }
  const data = (await res.json()) as { transcript?: string; text?: string }
  return (data.transcript || data.text || '').trim() || null
}

type BrowserRec = {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onresult: ((e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
}

function listenBrowser(lang: SarvamLang): Promise<string | null> {
  return new Promise((resolve) => {
    const w = window as unknown as {
      SpeechRecognition?: new () => BrowserRec
      webkitSpeechRecognition?: new () => BrowserRec
    }
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SR) {
      resolve(null)
      return
    }
    const rec = new SR()
    rec.lang = lang
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.onresult = (e) => {
      resolve(e.results[0]?.[0]?.transcript?.trim() || null)
    }
    rec.onerror = () => resolve(null)
    rec.start()
    window.setTimeout(() => {
      try {
        rec.stop()
      } catch {
        /* ignore */
      }
    }, 7000)
  })
}

/** Press-and-hold friendly recorder that stops when caller invokes stop(). */
export function createVoiceSession(lang: SarvamLang): {
  stop: () => Promise<string | null>
} {
  let recorder: MediaRecorder | null = null
  let stream: MediaStream | null = null
  const chunks: BlobPart[] = []
  let stopped = false

  const ready = (async () => {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : ''
    recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data)
    }
    recorder.start(200)
  })()

  return {
    async stop() {
      if (stopped) return null
      stopped = true
      await ready
      const blob = await new Promise<Blob>((resolve) => {
        if (!recorder) {
          resolve(new Blob())
          return
        }
        recorder.onstop = () =>
          resolve(new Blob(chunks, { type: recorder?.mimeType || 'audio/webm' }))
        if (recorder.state !== 'inactive') recorder.stop()
        else resolve(new Blob(chunks, { type: 'audio/webm' }))
      })
      stream?.getTracks().forEach((t) => t.stop())
      if (blob.size < 600) return listenBrowser(lang)

      const form = new FormData()
      form.append('file', blob, 'voice.webm')
      form.append('model', 'saaras:v4')
      form.append('language_code', lang)
      try {
        const res = await fetch('/api/sarvam/speech-to-text', { method: 'POST', body: form })
        if (!res.ok) return listenBrowser(lang)
        const data = (await res.json()) as { transcript?: string; text?: string }
        return (data.transcript || data.text || '').trim() || (await listenBrowser(lang))
      } catch {
        return listenBrowser(lang)
      }
    },
  }
}
