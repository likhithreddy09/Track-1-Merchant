import type {
  AiInsight,
  CompetitorIntel,
  CompetitorShop,
  DemographicSnapshot,
  InventoryListing,
  PlaceInfo,
  ShopType,
  TargetSegment,
} from '../types'
import { mulberry32, seedFromPoint } from './geo'
import type { GeoPoint } from '../types'
import { buildGoogleReviewProfile, buildRivalPlaybook } from './googleReviews'

function clip(text: string, max: number) {
  const t = text.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1).trim()}…`
}

export function buildCompetitorIntel(
  shop: CompetitorShop,
  shopType: ShopType,
  _demo: DemographicSnapshot,
  location: GeoPoint,
): CompetitorIntel {
  const rand = mulberry32(seedFromPoint(location, shop.id))
  const reviews = shop.reviews || buildGoogleReviewProfile(shop, shopType, location)
  const playbook = buildRivalPlaybook(reviews, shopType)

  // Steal risk: logistic blend of proximity, rating, review volume, sentiment
  const prox = Math.exp(-1.4 * shop.distanceKm)
  const ratingLift = (reviews.rating - 3.2) / 1.8
  const volumeLift = Math.min(1, Math.log10(reviews.reviewCount + 1) / 3.2)
  const raw =
    0.42 * prox + 0.28 * ratingLift + 0.18 * volumeLift + 0.12 * (reviews.sentiment / 100)
  const stealRisk = Math.min(98, Math.max(12, Math.round(100 * (1 / (1 + Math.exp(-3.2 * (raw - 0.45)))) + rand() * 4)))

  const priceTheme = reviews.themes.find((t) => t.key === 'price')?.score || 3.5
  const pricePressure = Math.min(95, Math.round(28 + (5 - priceTheme) * 14 + prox * 22 + rand() * 8))
  const overlapScore = Math.min(
    99,
    Math.round(48 + prox * 30 + (shop.threat === 'high' ? 14 : 6) + rand() * 10),
  )
  const peaks = ['7–10 AM', '12–2 PM', '6–9 PM', 'Weekend noon']
  const peakHours = peaks[Math.floor(rand() * peaks.length)]

  const bestTheme = [...reviews.themes].sort((a, b) => b.score - a.score)[0]
  const worstTheme = [...reviews.themes].sort((a, b) => a.score - b.score)[0]
  const sku = shopType.stockSkus[0]
  const shortName = shop.name.split(/[\s,/]+/)[0]

  const strength = `Strong on ${bestTheme.label.toLowerCase()} — “${clip(reviews.topPraise, 40)}”.`
  const weakness = `Weak on ${worstTheme.label.toLowerCase()} — “${clip(reviews.topComplaint, 40)}”.`

  // One short move — shop-specific, no filler
  const moveNow =
    shop.threat === 'high' || stealRisk >= 65
      ? `${playbook.beat[0]} Do it before ${peakHours} vs ${shortName}.`
      : shop.distanceKm < 0.6
        ? `${playbook.beat[0]} They’re only ${shop.distanceKm} km away.`
        : `${playbook.beat[0]} Keep ${sku} ready for ${peakHours}.`

  return {
    shop: { ...shop, reviews, rating: reviews.rating },
    stealRisk,
    pricePressure,
    overlapScore,
    peakHours,
    strength,
    weakness,
    aiBrief: `${shop.name} · ${shop.distanceKm} km · ★${reviews.rating} · steal ${stealRisk}% · peak ${peakHours}`,
    moveNow,
    reviewScorecard: playbook.scorecard,
    copyFromRival: playbook.copy,
    beatRival: playbook.beat,
    themeBars: reviews.themes,
    stats: [
      { label: 'Distance', value: `${shop.distanceKm} km` },
      { label: 'Threat', value: shop.threat },
      { label: 'Google ★', value: `${reviews.rating}` },
      { label: 'Reviews', value: reviews.reviewCount.toLocaleString() },
      { label: 'Sentiment', value: `${reviews.sentiment}/100` },
      { label: '30d reviews', value: `${reviews.recentReviews30d}` },
      { label: 'Footfall', value: `~${shop.estimatedFootfall}/day` },
      { label: 'Steal risk', value: `${stealRisk}%` },
    ],
  }
}

export function buildAiInsights(input: {
  shopType: ShopType
  place: PlaceInfo
  demo: DemographicSnapshot
  competitors: CompetitorShop[]
  segments: TargetSegment[]
  location: GeoPoint
}): AiInsight[] {
  const { shopType, place, demo, competitors, segments, location } = input
  const rand = mulberry32(seedFromPoint(location, `${shopType.id}-ai`))
  const nearbyHigh = competitors.filter((c) => c.threat === 'high').length
  const avgDist =
    competitors.reduce((a, b) => a + b.distanceKm, 0) / Math.max(competitors.length, 1)
  const topSegment = [...segments].sort((a, b) => b.share - a.share)[0]
  const weakSegment = segments.find((s) => s.opportunity === 'low')
  const tomorrowLift = Math.round(8 + rand() * 18)
  const confidence = Math.round(72 + rand() * 22)

  const insights: AiInsight[] = [
    {
      id: 'catchment',
      tone: 'info',
      title: `${demo.densifyLabel} around ${place.neighbourhood}`,
      body: `Gravity catchment (2.0 km): ${demo.totalPeople.toLocaleString()} ± ${demo.populationCi95.toLocaleString()} people (95% CI) · ${demo.households.toLocaleString()} HH (μ ${demo.householdSize}) · ${demo.peoplePerKm2.toLocaleString()}/km². ${demo.methodNote}`,
      confidence: demo.modelConfidence,
    },
    {
      id: 'competition',
      tone: nearbyHigh >= 3 ? 'warning' : 'info',
      title:
        nearbyHigh >= 3
          ? `${nearbyHigh} close competitors within walking distance`
          : `Competition is manageable nearby`,
      body:
        nearbyHigh >= 3
          ? `Average rival sits ${avgDist.toFixed(2)} km away (★ avg ${(
              competitors.reduce((a, c) => a + c.rating, 0) / Math.max(competitors.length, 1)
            ).toFixed(1)}). Differentiate on speed, UPI offers and review gaps — not only price.`
          : `Only ${nearbyHigh} high-threat shops are very close. Push promo into underserved pockets of your ${demo.households.toLocaleString()} HH catchment.`,
      confidence: Math.min(96, confidence + 4),
    },
    {
      id: 'target',
      tone: 'opportunity',
      title: `Primary target: ${topSegment?.title || shopType.targetSegments[0]}`,
      body: `${topSegment?.why || ''} Put this segment first on the window and top shelf.`,
      confidence: Math.round(70 + rand() * 20),
    },
  ]

  if (weakSegment) {
    insights.push({
      id: 'avoid',
      tone: 'warning',
      title: `Do not overstock for “${weakSegment.title}”`,
      body: `${weakSegment.why} Reallocate budget to higher-opportunity segments.`,
      confidence: Math.round(68 + rand() * 18),
    })
  }

  insights.push({
    id: 'action',
    tone: 'action',
    title: `Next 24h action for ${shopType.label}`,
    body: `Expected ${tomorrowLift}% lift in ${shopType.demandKeywords[0]}. Keep ${shopType.stockSkus[0]} + ${shopType.stockSkus[1]} ready · pulse ~${demo.livePulse} · open Inventory Exchange if shelf is thin.`,
    confidence: Math.min(96, Math.round(74 + rand() * 16 + demo.modelConfidence * 0.05)),
  })

  const topRival = [...competitors].sort((a, b) => b.rating - a.rating)[0]
  if (topRival?.reviews) {
    const pb = buildRivalPlaybook(topRival.reviews, shopType)
    insights.push({
      id: 'reviews',
      tone: 'opportunity',
      title: `Beat “${topRival.name}” on reviews`,
      body: `They hold ★${topRival.rating} from ${topRival.reviews.reviewCount.toLocaleString()} reviews. ${pb.copy[0]} ${pb.beat[0]}`,
      confidence: Math.min(93, Math.round(70 + Math.log10(topRival.reviews.reviewCount + 1) * 8)),
    })
  }

  return insights
}

export function buildInventoryListings(input: {
  shopType: ShopType
  competitors: CompetitorShop[]
  location: GeoPoint
  demo: DemographicSnapshot
}): InventoryListing[] {
  const { shopType, competitors, location, demo } = input
  const rand = mulberry32(seedFromPoint(location, `${shopType.id}-inv`))
  const skus = shopType.stockSkus
  const listings: InventoryListing[] = []

  const pool = competitors.slice(0, 10)
  pool.forEach((shop, i) => {
    const sku = skus[i % skus.length]
    const isSurplus = rand() > 0.42
    const qty = Math.floor(8 + rand() * 40)
    const urgency: InventoryListing['urgency'] =
      shop.threat === 'high' || rand() > 0.7 ? 'high' : rand() > 0.45 ? 'medium' : 'low'
    const unitPrice = Math.round((20 + rand() * 180) * (shopType.id === 'electronics' ? 2.2 : 1))
    // Match score: demand prior + distance decay + urgency + HH density factor
    const hhFactor = Math.min(12, Math.log10(demo.households + 10) * 4)
    const demandBias = demo.workingAgePercent > 55 ? 7 : 2
    const distScore = Math.max(0, 14 * Math.exp(-0.9 * shop.distanceKm))
    const matchScore = Math.min(
      99,
      Math.round(
        48 +
          demandBias +
          hhFactor +
          distScore +
          (isSurplus ? 10 : 5) +
          (urgency === 'high' ? 12 : urgency === 'medium' ? 7 : 2) +
          rand() * 5,
      ),
    )

    const hhDemand = Math.max(1, Math.round(demo.households * (0.002 + rand() * 0.004)))
    listings.push({
      id: `inv-${shop.id}-${i}`,
      shopName: shop.name,
      distanceKm: Number(shop.distanceKm.toFixed(2)),
      sku,
      qty: Math.max(qty, isSurplus ? hhDemand : Math.round(qty * 0.8)),
      unitPrice,
      type: isSurplus ? 'surplus' : 'shortage',
      urgency,
      matchScore,
      reason: isSurplus
        ? `Excess ${sku} · ~${hhDemand} HH demand · ${shop.distanceKm.toFixed(2)} km · ${urgency}.`
        : `${shop.name} short on ${sku} · ${shop.distanceKm.toFixed(2)} km · sell into local gap.`,
    })
  })

  // Ensure a clear two-sided board for demo
  listings.forEach((l, i) => {
    l.type = i % 2 === 0 ? 'surplus' : 'shortage'
    const hh = Math.max(1, Math.round(demo.households * 0.003))
    const value = l.qty * l.unitPrice
    l.reason =
      l.type === 'surplus'
        ? `${l.shopName} excess ${l.sku} · ~${hh} HH pull · ${l.distanceKm} km · match ${l.matchScore}%.`
        : `${l.shopName} needs ${l.sku} · unlock ₹${value.toLocaleString('en-IN')} · ${l.distanceKm} km.`
  })

  return listings.sort((a, b) => b.matchScore - a.matchScore || a.distanceKm - b.distanceKm)
}

export function answerMerchantQuestion(
  question: string,
  ctx: {
    shopType: ShopType
    place: PlaceInfo
    demo: DemographicSnapshot
    competitors: CompetitorShop[]
    insights: AiInsight[]
  },
): string {
  const q = question.toLowerCase()
  const rival = [...ctx.competitors].sort((a, b) => a.distanceKm - b.distanceKm)[0]
  const topRated = [...ctx.competitors].sort((a, b) => b.rating - a.rating)[0]
  // Beat / copy first so “how to beat them” never falls into a thin rival one-liner
  if (q.includes('copy') || q.includes('beat') || q.includes('improve') || q.includes('learn') || q.includes('how to win') || q.includes('defeat')) {
    const target = topRated || rival
    if (!target) {
      return `Open the Map tab, tap a rival pin, then ask again — I’ll give copy vs beat moves for that shop.`
    }
    const r =
      target.reviews ||
      buildGoogleReviewProfile(target, ctx.shopType, { lat: target.lat, lng: target.lng })
    const playbook = buildRivalPlaybook(r, ctx.shopType)
    const skuA = ctx.shopType.stockSkus[0]
    const skuB = ctx.shopType.stockSkus[1]
    return [
      `To beat “${target.name}” (★${target.rating}, ${target.distanceKm} km):`,
      `1) ${playbook.beat[0]}`,
      `2) ${playbook.beat[1] || playbook.copy[0]}`,
      `3) Keep ${skuA} and ${skuB} in full stock this week so customers don’t walk to them.`,
      `4) Ask 3 happy buyers for a Google review after purchase.`,
      `Open their pin on the Map for the full playbook.`,
    ].join(' ')
  }
  if (q.includes('biggest') || q.includes('strongest') || q.includes('top rival')) {
    if (!topRated) return `Still mapping rivals around ${ctx.place.neighbourhood}.`
    const r = topRated.reviews || buildGoogleReviewProfile(topRated, ctx.shopType, {
      lat: topRated.lat,
      lng: topRated.lng,
    })
    const playbook = buildRivalPlaybook(r, ctx.shopType)
    return `Biggest rating threat: “${topRated.name}” ★${topRated.rating} (${r.reviewCount.toLocaleString()} reviews) · ${topRated.distanceKm} km · threat ${topRated.threat}. Copy: ${playbook.copy[0]} Beat: ${playbook.beat[0]} Open their map pin for the full playbook.`
  }
  if (q.includes('compet') || q.includes('rival') || q.includes('nearby shop') || q.includes('review') || q.includes('google')) {
    if (!rival) return `I am still mapping rivals around ${ctx.place.neighbourhood}.`
    const r = rival.reviews || buildGoogleReviewProfile(rival, ctx.shopType, {
      lat: rival.lat,
      lng: rival.lng,
    })
    const playbook = buildRivalPlaybook(r, ctx.shopType)
    return `Closest rival “${rival.name}” (${rival.distanceKm} km) ★${r.rating}. ${playbook.copy[0]} ${playbook.beat[0]} ${ctx.competitors.length} shops scored nearby.`
  }
  if (q.includes('age') || q.includes('people') || q.includes('demographic') || q.includes('customer') || q.includes('household')) {
    return `Around ${ctx.place.neighbourhood}: ~${ctx.demo.households.toLocaleString('en-IN')} households and ${ctx.demo.totalPeople.toLocaleString('en-IN')} people (±${ctx.demo.populationCi95.toLocaleString('en-IN')}). Working-age ${ctx.demo.workingAgePercent}%, kids ${ctx.demo.childrenPercent}%, seniors ${ctx.demo.seniorsPercent}%. For your ${ctx.shopType.label}, sell first to ${ctx.shopType.targetSegments[0]}, then ${ctx.shopType.targetSegments[1]}. Stock ${ctx.shopType.stockSkus[0]} and ${ctx.shopType.stockSkus[1]} this week.`
  }
  // EDI / EMI — must never fall through to catchment maths
  if (
    /\bedi\b/.test(q) ||
    /\bemi\b/.test(q) ||
    q.includes('daily cut') ||
    q.includes('loan cut') ||
    q.includes('settlement') ||
    q.includes('equated daily')
  ) {
    const skuA = ctx.shopType.stockSkus[0]
    const skuB = ctx.shopType.stockSkus[1]
    return [
      `EDI (Equated Daily Instalment) is the daily cut Paytm takes from your settlement to repay a merchant loan.`,
      `EMI usually means the same idea for monthly loans — here we focus on the daily EDI cut.`,
      `If shelves are full of slow stock, cash is locked but EDI still falls due.`,
      `In Neighbourhood: open Inventory → Cover EDI → sell ${skuA} / ${skuB} (or other idle SKUs) to a nearby buyer → confirm.`,
      `Sale cash helps cover today’s EDI before settlement.`,
    ].join(' ')
  }
  if (q.includes('stock') || q.includes('inventory') || q.includes('buy') || q.includes('sell') || q.includes('deal') || q.includes('exchange')) {
    return `Open Inventory → Cover EDI. Prioritise ${ctx.shopType.stockSkus[0]} and ${ctx.shopType.stockSkus[1]}. Sell to a nearby buyer — cash can cover today’s EDI cut.`
  }
  if (q.includes('tomorrow') || q.includes('forecast') || q.includes('week') || q.includes('weekend')) {
    return `Near-term: ${ctx.shopType.demandKeywords[0]} is the lead signal. Live pulse ~${ctx.demo.livePulse}. Check This week on Overview — weekends usually peak for ${ctx.shopType.label.toLowerCase()}.`
  }
  if (q.includes('steal risk')) {
    const r = rival || topRated
    return r
      ? `Steal risk is higher when a rival is close and highly rated. Closest watch: “${r.name}” at ${r.distanceKm} km ★${r.rating}. Tap their map pin for one gap + one move.`
      : `Steal risk rises with closer, higher-rated rivals. Tap a pin on the Map for the score.`
  }
  if (q.includes('catchment') || q.includes('how many people') || (q.includes('gravity') && q.includes('ring'))) {
    return `Around ${ctx.place.neighbourhood}: about ${ctx.demo.totalPeople.toLocaleString('en-IN')} people (±${ctx.demo.populationCi95.toLocaleString('en-IN')}) and ${ctx.demo.households.toLocaleString('en-IN')} households within ~2 km.`
  }
  // Never dump formula / insight maths as a chat answer
  return `Ask me about EDI, rivals, households, or idle stock — or tap a demo question below. For Cover EDI: Inventory → sell slow stock → cash pays today’s daily cut.`
}
