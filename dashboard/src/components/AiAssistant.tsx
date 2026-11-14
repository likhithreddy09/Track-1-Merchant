import { useEffect, useMemo, useRef, useState } from 'react'
import type { AiInsight, CompetitorShop, DemographicSnapshot, PlaceInfo, ShopType } from '../types'
import { answerMerchantQuestion } from '../lib/aiEngine'
import { buildGoogleReviewProfile, buildRivalPlaybook } from '../lib/googleReviews'
import {
  SARVAM_LANGS,
  buildMerchantSystem,
  chatMerchant,
  cleanChatText,
  createVoiceSession,
  formatChatHtml,
  speakText,
  stopSpeaking,
  translateText,
  type SarvamLang,
} from '../lib/sarvam'

const KILLER_QS = [
  'How many households nearby — and who should I sell to?',
  'Who is my biggest rival and what should I copy vs beat?',
  'How much cash can I unlock from slow stock today?',
] as const

type VoicePhase = 'idle' | 'listening' | 'thinking' | 'speaking'

export function AiAssistant({
  shopType,
  place,
  demo,
  competitors,
  insights,
  shopName,
}: {
  shopType: ShopType
  place: PlaceInfo
  demo: DemographicSnapshot
  competitors: CompetitorShop[]
  insights: AiInsight[]
  shopName?: string
}) {
  const [open, setOpen] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [thinking, setThinking] = useState(false)
  const [lang, setLang] = useState<SarvamLang>('hi-IN')
  const [prompts, setPrompts] = useState<string[]>([...KILLER_QS])
  const [voicePhase, setVoicePhase] = useState<VoicePhase>('idle')
  const [voiceCaption, setVoiceCaption] = useState('ऑर्ब टैप करें और बोलें')
  const threadRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const voiceRef = useRef<ReturnType<typeof createVoiceSession> | null>(null)
  const voiceBusy = useRef(false)

  const topRival = useMemo(() => {
    const list = [...competitors].sort((a, b) => a.distanceKm - b.distanceKm)
    return list[0]?.name
  }, [competitors])

  const langNative = SARVAM_LANGS.find((l) => l.code === lang)?.native || 'English'

  const welcomeEn = useMemo(
    () =>
      `Namaste! Merchant AI is ready for your ${shopType.label.toLowerCase()} in ${place.neighbourhood}. About ${demo.totalPeople.toLocaleString('en-IN')} people · ${demo.households.toLocaleString('en-IN')} households · ${competitors.length} rivals. Tap a question below — each has a ready answer for demo.`,
    [shopType.label, place.neighbourhood, demo.totalPeople, demo.households, competitors.length],
  )

  const killerAnswers = useMemo(() => {
    const rival = [...competitors].sort((a, b) => b.rating - a.rating)[0]
    const closest = [...competitors].sort((a, b) => a.distanceKm - b.distanceKm)[0]
    const skuA = shopType.stockSkus[0]
    const skuB = shopType.stockSkus[1]
    const idleEstimate = Math.round(demo.households * 0.35 + 4200)
    return {
      [KILLER_QS[0]]: `Around ${place.neighbourhood}: ~${demo.households.toLocaleString('en-IN')} households (± CI) and ${demo.totalPeople.toLocaleString('en-IN')} people. Working-age ${demo.workingAgePercent}%, kids ${demo.childrenPercent}%, seniors ${demo.seniorsPercent}%. For your ${shopType.label}, sell first to ${shopType.targetSegments[0]} — then ${shopType.targetSegments[1]}. Next step: stock ${skuA} and ${skuB} for this week’s ${shopType.demandKeywords[0]}.`,
      [KILLER_QS[1]]: rival
        ? (() => {
            const r =
              rival.reviews ||
              buildGoogleReviewProfile(rival, shopType, { lat: rival.lat, lng: rival.lng })
            const playbook = buildRivalPlaybook(r, shopType)
            return `Biggest rating threat: “${rival.name}” ★${rival.rating} at ${rival.distanceKm} km (threat ${rival.threat}). Copy: ${playbook.copy[0]} Beat: ${playbook.beat[0]} Keep ${skuA} and ${skuB} fully stocked. ${
              closest && closest.id !== rival.id
                ? `Also watch closest shop “${closest.name}” (${closest.distanceKm} km).`
                : ''
            } Next: fix one weakness this week — don’t only discount.`
          })()
        : `Still mapping rivals around ${place.neighbourhood}. Next step: open the Map tab and wait for pins — then ask again.`,
      [KILLER_QS[2]]: `Roughly ₹${idleEstimate.toLocaleString('en-IN')} can sit locked in slow / near-expiry SKUs for a ${shopType.label.toLowerCase()} like yours. Priority clears: ${skuA} and ${skuB}. If today’s Paytm EDI looks tight, open Inventory → Cover EMI → sell stock ahead of settlement. Next step: pick the top unlock item → confirm sale.`,
    } as Record<string, string>
  }, [competitors, demo, place.neighbourhood, shopType])

  const [messages, setMessages] = useState<{ role: 'ai' | 'you'; text: string }[]>([
    { role: 'ai', text: welcomeEn },
  ])

  const system = useMemo(
    () =>
      buildMerchantSystem({
        shopName,
        shopLabel: shopType.label,
        shopId: shopType.id,
        place: `${place.neighbourhood}, ${place.city}`,
        people: demo.totalPeople,
        households: demo.households,
        rivals: competitors.length,
        topRival,
        heroSkus: shopType.stockSkus,
      }),
    [shopName, shopType.label, shopType.id, shopType.stockSkus, place.neighbourhood, place.city, demo.totalPeople, demo.households, competitors.length, topRival],
  )

  useEffect(() => {
    const el = threadRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, thinking, open])

  useEffect(() => {
    let cancelled = false
    async function localizeWelcome() {
      try {
        const text = lang === 'en-IN' ? welcomeEn : await translateText(welcomeEn, lang, 'en-IN')
        if (cancelled) return
        setMessages([{ role: 'ai', text: cleanChatText(text) }])
        if (lang === 'en-IN') setPrompts([...KILLER_QS])
        else {
          const translated = await Promise.all(KILLER_QS.map((p) => translateText(p, lang, 'en-IN')))
          if (!cancelled) setPrompts(translated.map(cleanChatText))
        }
      } catch {
        if (!cancelled) {
          setMessages([{ role: 'ai', text: welcomeEn }])
          setPrompts([...KILLER_QS])
        }
      }
    }
    localizeWelcome()
    return () => {
      cancelled = true
    }
  }, [lang, welcomeEn])

  useEffect(() => {
    if (!open || voiceOpen) return
    const t = window.setTimeout(() => inputRef.current?.focus(), 160)
    return () => window.clearTimeout(t)
  }, [open, voiceOpen])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (voiceOpen) closeVoice()
        else setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [voiceOpen])

  useEffect(
    () => () => {
      stopSpeaking()
      voiceRef.current = null
    },
    [],
  )

  function matchKillerAnswer(q: string): string | null {
    const norm = q.trim().toLowerCase()
    for (const key of KILLER_QS) {
      if (norm === key.toLowerCase()) return killerAnswers[key]
    }
    // Match translated chip → English answer by index
    const idx = prompts.findIndex((p) => p.trim().toLowerCase() === norm)
    if (idx >= 0 && idx < KILLER_QS.length) return killerAnswers[KILLER_QS[idx]]
    return null
  }

  async function localize(text: string): Promise<string> {
    try {
      return cleanChatText(lang === 'en-IN' ? text : await translateText(text, lang, 'en-IN'))
    } catch {
      return cleanChatText(text)
    }
  }

  async function getReply(q: string): Promise<string> {
    const seeded = matchKillerAnswer(q)
    if (seeded) return localize(seeded)

    const local = answerMerchantQuestion(q, { shopType, place, demo, competitors, insights })
    const ql = q.toLowerCase()
    // Keep beat / rival / catchment answers deterministic + shop-type aware (don't let chat invent kirana fluff)
    const preferLocal =
      /beat|copy|rival|compet|household|biggest|strongest|demographic|how to win|defeat|steal risk|catchment|nearby/.test(
        ql,
      ) && !local.startsWith('Based on')
    if (preferLocal) return localize(local)

    try {
      const reply = await chatMerchant({ question: q, lang, system })
      if (reply) return cleanChatText(reply)
      throw new Error('empty')
    } catch {
      return localize(local)
    }
  }

  async function ask(raw?: string) {
    const q = (raw ?? question).trim()
    if (!q || thinking) return
    setMessages((prev) => [...prev, { role: 'you', text: cleanChatText(q) }])
    setQuestion('')
    setThinking(true)
    try {
      const replyText = await getReply(q)
      setMessages((prev) => [...prev, { role: 'ai', text: replyText }])
    } finally {
      setThinking(false)
    }
  }

  const voiceGreet =
    lang === 'hi-IN'
      ? 'नमस्ते! आज मैं आपकी क्या मदद कर सकता हूँ?'
      : lang === 'en-IN'
        ? 'Hi! What can I do for you today?'
        : 'नमस्ते! आज मैं आपकी क्या मदद कर सकता हूँ?'

  async function openVoice() {
    setOpen(false)
    setVoiceOpen(true)
    voiceBusy.current = true
    setVoicePhase('speaking')
    setVoiceCaption(voiceGreet)
    stopSpeaking()
    try {
      // Always greet in Hindi for demo warmth when Hindi (default)
      await speakText(
        lang === 'en-IN' ? 'Hi! What can I do for you today?' : voiceGreet,
        lang === 'en-IN' ? 'en-IN' : 'hi-IN',
      )
    } catch {
      /* ignore TTS errors */
    } finally {
      voiceBusy.current = false
      setVoicePhase('idle')
      setVoiceCaption(lang === 'hi-IN' ? 'ऑर्ब टैप करें और बोलें' : `Speak in ${langNative} · tap the orb`)
    }
  }

  function closeVoice() {
    voiceBusy.current = false
    voiceRef.current = null
    stopSpeaking()
    setVoicePhase('idle')
    setVoiceOpen(false)
  }

  async function toggleVoiceOrb() {
    if (voiceBusy.current && voicePhase !== 'listening') return

    // Stop speaking → idle
    if (voicePhase === 'speaking') {
      stopSpeaking()
      setVoicePhase('idle')
      setVoiceCaption(lang === 'hi-IN' ? 'फिर से पूछने के लिए टैप करें' : 'Tap to ask again')
      return
    }

    // Stop listening → process
    if (voicePhase === 'listening' && voiceRef.current) {
      voiceBusy.current = true
      setVoicePhase('thinking')
      setVoiceCaption(lang === 'hi-IN' ? 'समझ रहा हूँ…' : 'Got it… thinking')
      const session = voiceRef.current
      voiceRef.current = null
      try {
        const heard = await session.stop()
        if (!heard) {
          setVoicePhase('idle')
          setVoiceCaption(lang === 'hi-IN' ? 'सुनाई नहीं दिया — फिर टैप करें' : 'Didn’t catch that — tap again')
          voiceBusy.current = false
          return
        }
        setVoiceCaption(heard)
        setMessages((prev) => [...prev, { role: 'you', text: cleanChatText(heard) }])
        const reply = await getReply(heard)
        setMessages((prev) => [...prev, { role: 'ai', text: reply }])
        setVoicePhase('speaking')
        setVoiceCaption(reply)
        await speakText(reply, lang)
        if (voiceBusy.current) {
          setVoicePhase('idle')
          setVoiceCaption(lang === 'hi-IN' ? 'फिर से पूछने के लिए टैप करें' : 'Tap to ask again')
        }
      } catch {
        setVoicePhase('idle')
        setVoiceCaption(lang === 'hi-IN' ? 'कुछ गड़बड़ हुई — फिर कोशिश करें' : 'Something failed — try again')
      } finally {
        voiceBusy.current = false
      }
      return
    }

    // Start listening
    if (voicePhase === 'idle' || voicePhase === 'thinking') {
      try {
        stopSpeaking()
        voiceRef.current = createVoiceSession(lang)
        setVoicePhase('listening')
        setVoiceCaption(lang === 'hi-IN' ? 'सुन रहा हूँ… बोलकर फिर टैप करें' : 'Listening… tap when done')
      } catch {
        setVoicePhase('idle')
        setVoiceCaption(lang === 'hi-IN' ? 'माइक की अनुमति दें' : 'Allow mic to talk')
      }
    }
  }

  return (
    <div className={`mai-float ${open ? 'open' : ''} ${voiceOpen ? 'voice-on' : ''}`}>
      {open && !voiceOpen && (
        <div className="mai-panel" role="dialog" aria-label="Ask AI">
          <div className="mai-panel-hd">
            <div>
              <strong>Ask AI</strong>
              <span className="mai-hd-sub">{langNative}</span>
            </div>
            <div className="mai-hd-actions">
              <button type="button" className="mai-voice-launch" onClick={openVoice}>
                Voice
              </button>
              <button type="button" className="mai-close" onClick={() => setOpen(false)} aria-label="Close">
                ×
              </button>
            </div>
          </div>

          <div className="mai-panel-bd">
            <div className="mai-lang">
              <label htmlFor="mai-lang">Language</label>
              <select id="mai-lang" value={lang} onChange={(e) => setLang(e.target.value as SarvamLang)}>
                {SARVAM_LANGS.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.native} · {l.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="chat-thread mai-thread" ref={threadRef}>
              {messages.map((m, i) => (
                <div key={`${m.role}-${i}`} className={`mai-msg-row ${m.role}`}>
                  <div className={`mai-bubble-msg ${m.role}`}>
                    <p dangerouslySetInnerHTML={{ __html: formatChatHtml(m.text) }} />
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="mai-msg-row ai">
                  <div className="mai-bubble-msg ai">
                    <p className="thinking-dots">Thinking…</p>
                  </div>
                </div>
              )}
            </div>

            <div className="chat-chips mai-killer">
              <p className="mai-killer-label">3 demo questions · ready answers</p>
              {prompts.map((p, i) => (
                <button key={`${i}-${p}`} type="button" className="chip-btn" onClick={() => ask(p)}>
                  {p}
                </button>
              ))}
            </div>

            <div className="mai-composer">
              <input
                ref={inputRef}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={`Message in ${langNative}…`}
                onKeyDown={(e) => e.key === 'Enter' && ask()}
              />
              <button type="button" className="mai-send" onClick={() => ask()} disabled={thinking || !question.trim()}>
                ↑
              </button>
            </div>
          </div>
        </div>
      )}

      {voiceOpen && (
        <div className="mai-voice" role="dialog" aria-label="Voice Ask AI">
          <div className="mai-voice-top">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as SarvamLang)}
              aria-label="Voice language"
            >
              {SARVAM_LANGS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.native}
                </option>
              ))}
            </select>
            <button type="button" className="mai-voice-x" onClick={closeVoice} aria-label="Close voice">
              ×
            </button>
          </div>

          <button
            type="button"
            className={`mai-orb ${voicePhase}`}
            onClick={() => void toggleVoiceOrb()}
            aria-label="Voice orb"
          >
            <span className="mai-orb-ring r1" />
            <span className="mai-orb-ring r2" />
            <span className="mai-orb-ring r3" />
            <span className="mai-orb-core">
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
          </button>

          <p className={`mai-voice-phase ${voicePhase}`}>
            {voicePhase === 'listening'
              ? lang === 'hi-IN'
                ? 'सुन रहा हूँ'
                : 'Listening'
              : voicePhase === 'thinking'
                ? lang === 'hi-IN'
                  ? 'सोच रहा हूँ'
                  : 'Thinking'
                : voicePhase === 'speaking'
                  ? lang === 'hi-IN'
                    ? 'बोल रहा हूँ'
                    : 'Speaking'
                  : lang === 'hi-IN'
                    ? 'तैयार'
                    : 'Ready'}
          </p>
          <p className="mai-voice-caption">{voiceCaption}</p>
          <p className="mai-voice-tip">
            {lang === 'hi-IN' ? 'बोलने के लिए ऑर्ब टैप करें · भेजने के लिए फिर टैप' : 'Tap orb to talk · tap again to send'}
          </p>
        </div>
      )}

      {!voiceOpen && (
        <div className="mai-fab-row">
          <button
            type="button"
            className="mai-fab-voice"
            onClick={openVoice}
            aria-label="Voice Ask AI"
            title="Voice"
          >
            <span className="mai-fab-wave" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </button>
          <button
            type="button"
            className={`mai-bubble ${open ? 'on' : ''}`}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? 'Close Ask AI' : 'Open Ask AI'}
          >
            {open ? <span className="mai-bubble-x">×</span> : <span className="mai-bubble-label">Ask AI</span>}
          </button>
        </div>
      )}
    </div>
  )
}
