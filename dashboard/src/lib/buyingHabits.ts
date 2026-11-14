import type {
  AreaBuyingHabits,
  CompetitorShop,
  DemographicSnapshot,
  PlaceInfo,
  ShopType,
} from '../types'
import { chatMerchant, cleanChatText } from './sarvam'

function clamp(n: number, a = 0, b = 100) {
  return Math.max(a, Math.min(b, Math.round(n)))
}

function scoreFromText(texts: string[]) {
  const blob = texts.join(' ').toLowerCase()
  const count = (re: RegExp) => (blob.match(re) || []).length
  return {
    price: count(
      /\b(cheap|cheaper|price|costly|expensive|mrp|afford|value|rate|paisa|sasta|mehnga|discounted)\b/g,
    ),
    offer: count(
      /\b(offer|deal|discount|cashback|combo|freebie|sale|promo|coupon|bogo|scheme)\b/g,
    ),
    quality: count(
      /\b(quality|fresh|genuine|expiry|brand|hygiene|clean|taste|packaging|original)\b/g,
    ),
    convenience: count(
      /\b(quick|fast|nearby|convenient|delivery|queue|wait|billing|timing|open late|parking)\b/g,
    ),
  }
}

function localHabits(
  competitors: CompetitorShop[],
  demo: DemographicSnapshot,
  place: PlaceInfo,
  shopType: ShopType,
): AreaBuyingHabits {
  const snippets = competitors.flatMap((c) => c.reviews?.snippets?.map((s) => s.text) || [])
  const praise = competitors.map((c) => c.reviews?.topPraise || '')
  const complain = competitors.map((c) => c.reviews?.topComplaint || '')
  const live = competitors.some((c) => c.reviews?.live)
  const counts = scoreFromText([...snippets, ...praise, ...complain])

  const priceThemeAvg =
    competitors.reduce((a, c) => {
      const t = c.reviews?.themes.find((x) => x.key === 'price')?.score || 3.5
      return a + t
    }, 0) / Math.max(1, competitors.length)

  // Low price theme score from rivals ⇒ neighbourhood complains about price ⇒ price sensitive
  let priceSensitive = clamp(38 + (4.6 - priceThemeAvg) * 18 + counts.price * 6)
  let offerSensitive = clamp(34 + counts.offer * 8 + (demo.childrenPercent > 18 ? 8 : 0))
  let qualitySensitive = clamp(36 + counts.quality * 7 + demo.seniorsPercent * 0.6)
  let convenienceSensitive = clamp(
    40 + counts.convenience * 7 + (demo.workingAgePercent > 55 ? 10 : 0) + (demo.peoplePerKm2 > 12000 ? 6 : 0),
  )

  // Dense urban + working-age → more convenience / offer; mixed residential → price
  if (demo.densifyLabel.toLowerCase().includes('dense')) {
    convenienceSensitive = clamp(convenienceSensitive + 8)
    offerSensitive = clamp(offerSensitive + 5)
  }
  if (shopType.id === 'kirana') priceSensitive = clamp(priceSensitive + 6)
  if (shopType.id === 'garments' || shopType.id === 'beauty') offerSensitive = clamp(offerSensitive + 8)

  const ranked: { key: AreaBuyingHabits['dominantTrait']; n: number }[] = [
    { key: 'price', n: priceSensitive },
    { key: 'offer', n: offerSensitive },
    { key: 'quality', n: qualitySensitive },
    { key: 'convenience', n: convenienceSensitive },
  ].sort((a, b) => b.n - a.n)

  const dominant = ranked[0].key
  const traitLabel =
    dominant === 'price'
      ? 'price-sensitive'
      : dominant === 'offer'
        ? 'offer / deal-sensitive'
        : dominant === 'quality'
          ? 'quality-sensitive'
          : 'convenience-sensitive'

  const evidence = [
    live
      ? `Using ${snippets.length} original Google review lines from nearby shops.`
      : `Using review-theme model on ${competitors.length} nearby shops (add Google Places key for live text).`,
    `Price theme avg ★${priceThemeAvg.toFixed(1)} across rivals.`,
    `${demo.households.toLocaleString('en-IN')} HH · working-age ${demo.workingAgePercent}% · ${demo.densifyLabel}.`,
  ]

  const skuA = shopType.stockSkus[0]
  const skuB = shopType.stockSkus[1]
  const isElec = shopType.id === 'electronics'

  const actions =
    dominant === 'price'
      ? isElec
        ? [
            `Post EMI + price-match on ${skuA} / ${skuB} in big font.`,
            'Match rivals on 5 accessories — don’t blanket-discount phones.',
            'Show UPI cashback clearly at billing.',
          ]
        : [
            'Pin MRP + “neighbourhood price” tags on top 8 staples.',
            'Match rivals on 5 hero SKUs; don’t blanket-discount the whole shop.',
            'Show UPI cashback clearly at billing.',
          ]
      : dominant === 'offer'
        ? isElec
          ? [
              `Bundle ${skuA} + ${skuB} as a weekend combo.`,
              'WhatsApp accessory deals to regulars before Sat peak.',
              'Attach free case / cable with phone sales.',
            ]
          : [
              'Run a weekly combo / BOGO on 2–3 hero SKUs.',
              'Post festival offers on WhatsApp to regulars.',
              'Bundle slow movers with fast sellers.',
            ]
        : dominant === 'quality'
          ? isElec
            ? [
                'Train staff on specs / warranty — demo before upsell.',
                'Display EMI + sealed-box trust cues at the counter.',
                `Keep ${skuA} fully stocked — rivals often miss this gap.`,
              ]
            : [
                'Highlight fresh date / sealed packs near entrance.',
                'Ask happy buyers for a Google review after purchase.',
                'Remove near-expiry from front shelf today.',
              ]
          : isElec
            ? [
                'Express accessory billing for the 6–9 PM rush.',
                `Pre-stage ${skuA} and ${skuB} before evening peak.`,
                'Offer WhatsApp “in stock?” replies in under 2 minutes.',
              ]
            : [
                'Open a second billing counter in evening rush.',
                'Pre-pack peak SKUs for 6–9 PM.',
                'Enable WhatsApp pre-order for regulars.',
              ]

  return {
    priceSensitive,
    offerSensitive,
    qualitySensitive,
    convenienceSensitive,
    dominantTrait: dominant,
    summary: `${place.neighbourhood} shoppers look ${traitLabel} for ${shopType.label.toLowerCase()}.`,
    decision: `Lead with ${traitLabel} plays this week — that is the strongest signal from local reviews + catchment.`,
    actions,
    evidence,
    source: 'local',
    reviewSource: live ? 'google_live' : 'model',
  }
}

function parseSarvamJson(raw: string): Partial<AreaBuyingHabits> | null {
  const cleaned = cleanChatText(raw)
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0]) as Partial<AreaBuyingHabits>
  } catch {
    return null
  }
}

/**
 * Score buying habits from reviews, then ask Sarvam for a merchant decision.
 */
export async function analyzeAreaBuyingHabits(input: {
  competitors: CompetitorShop[]
  demo: DemographicSnapshot
  place: PlaceInfo
  shopType: ShopType
  shopName: string
}): Promise<AreaBuyingHabits> {
  const base = localHabits(input.competitors, input.demo, input.place, input.shopType)
  const live = base.reviewSource === 'google_live'
  const sampleReviews = input.competitors
    .flatMap((c) =>
      (c.reviews?.snippets || []).slice(0, 2).map((s) => `“${s.text.slice(0, 160)}” (★${s.rating} · ${c.name})`),
    )
    .slice(0, 12)

  const prompt = [
    `Analyse buying habits for ${input.shopName} (${input.shopType.label}) in ${input.place.neighbourhood}, ${input.place.city}.`,
    `Catchment: ${input.demo.totalPeople} people, ${input.demo.households} households, working-age ${input.demo.workingAgePercent}%, kids ${input.demo.childrenPercent}%, seniors ${input.demo.seniorsPercent}%.`,
    `Local scores so far — price:${base.priceSensitive} offer:${base.offerSensitive} quality:${base.qualitySensitive} convenience:${base.convenienceSensitive}.`,
    sampleReviews.length
      ? `Review evidence:\n${sampleReviews.join('\n')}`
      : `Rival themes: ${input.competitors
          .slice(0, 5)
          .map((c) => `${c.name}: praise=${c.reviews?.topPraise}; complain=${c.reviews?.topComplaint}`)
          .join(' | ')}`,
    'Reply ONLY JSON with keys: priceSensitive,offerSensitive,qualitySensitive,convenienceSensitive,dominantTrait,summary,decision,actions (3 short strings),evidence (2-3 short strings).',
    'Scores 0-100 integers. dominantTrait one of price|offer|quality|convenience. Practical for Indian neighbourhood shop.',
  ].join('\n')

  try {
    const reply = await chatMerchant({
      question: prompt,
      lang: 'en-IN',
      system: `You are a retail strategist for Indian ${input.shopType.label} neighbourhood shops. Stay inside this shop type — no wrong-category advice. Use review evidence. Never invent fake Google star counts. Return JSON only.`,
    })
    const parsed = parseSarvamJson(reply)
    if (!parsed) return { ...base, source: live ? 'sarvam+google' : 'sarvam+model' }

    const merged: AreaBuyingHabits = {
      priceSensitive: clamp(Number(parsed.priceSensitive ?? base.priceSensitive)),
      offerSensitive: clamp(Number(parsed.offerSensitive ?? base.offerSensitive)),
      qualitySensitive: clamp(Number(parsed.qualitySensitive ?? base.qualitySensitive)),
      convenienceSensitive: clamp(Number(parsed.convenienceSensitive ?? base.convenienceSensitive)),
      dominantTrait: (['price', 'offer', 'quality', 'convenience'] as const).includes(
        parsed.dominantTrait as AreaBuyingHabits['dominantTrait'],
      )
        ? (parsed.dominantTrait as AreaBuyingHabits['dominantTrait'])
        : base.dominantTrait,
      summary: String(parsed.summary || base.summary),
      decision: String(parsed.decision || base.decision),
      actions: Array.isArray(parsed.actions) && parsed.actions.length
        ? parsed.actions.map(String).slice(0, 4)
        : base.actions,
      evidence: Array.isArray(parsed.evidence) && parsed.evidence.length
        ? parsed.evidence.map(String).slice(0, 4)
        : base.evidence,
      source: live ? 'sarvam+google' : 'sarvam+model',
      reviewSource: base.reviewSource,
    }
    return merged
  } catch {
    return base
  }
}
