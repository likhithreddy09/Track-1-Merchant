import type { GeoPoint, PlaceInfo, ShopType } from '../types'
import { mulberry32, seedFromPoint } from './geo'

export type DemandPocketKind =
  | 'pg'
  | 'restaurant'
  | 'college'
  | 'office'
  | 'hospital'
  | 'temple'
  | 'market'

export interface DemandPocket {
  id: string
  kind: DemandPocketKind
  label: string
  distanceKm: number
  demandLift: number
  buys: string[]
  why: string
  peak: string
}

export interface MerchantStockDraft {
  sku: string
  qty: number
  unitPrice: number
  /** Days until expiry; null = no expiry / N/A */
  daysToExpiry: number | null
  /** How many days the SKU sat without selling */
  daysNotSelling: number
  motive: 'expiring' | 'slow' | 'overstock' | 'season_end'
}

export interface StockMatchSuggestion {
  id: string
  buyerLabel: string
  distanceKm: number
  matchScore: number
  urgency: 'high' | 'medium' | 'low'
  reason: string
  pocketKind: DemandPocketKind | 'shop'
}

const KIND_COPY: Record<
  DemandPocketKind,
  { label: (n: number) => string; buys: string[]; why: string; peak: string }
> = {
  pg: {
    label: (n) => `${n} PGs / hostels nearby`,
    buys: ['Maggi / noodles', 'Ready snacks', 'Cold drinks', 'Milk / curd', 'Personal care packs'],
    why: 'PG residents cook light + buy late — dinner & night snack demand stays high.',
    peak: '7–11 PM',
  },
  restaurant: {
    label: (n) => `${n} restaurants / QSR nearby`,
    buys: ['Cooking oil', 'Onions / staples', 'Tissue / disposables', 'Cold drinks', 'Spice packs'],
    why: 'Kitchen restock + dinner rush — restaurants take bulk staples before evening service.',
    peak: '4–8 PM',
  },
  college: {
    label: (n) => `${n} colleges / coaching nearby`,
    buys: ['Notebooks', 'Snacks', 'Cold drinks', 'Pens', 'Instant noodles'],
    why: 'Student footfall spikes between classes — cheap packs move fast.',
    peak: '12–2 PM · 4–6 PM',
  },
  office: {
    label: (n) => `${n} offices / coworking nearby`,
    buys: ['Tea / coffee packs', 'Biscuits', 'Water / juice', 'Stationery', 'Quick lunch SKUs'],
    why: 'Office lunch + pantry refill — weekday midday demand is reliable.',
    peak: '11 AM–2 PM',
  },
  hospital: {
    label: (n) => `${n} clinics / hospitals nearby`,
    buys: ['ORS', 'Water bottles', 'Sanitary packs', 'Biscuits', 'OTC basics'],
    why: 'Attendant + patient footfall — essentials and hydration SKUs clear quickly.',
    peak: 'All day',
  },
  temple: {
    label: (n) => `${n} temples / places of worship`,
    buys: ['Prasad packs', 'Oil / ghee', 'Incense', 'Flower packs', 'Sweet boxes'],
    why: 'Devotee traffic lifts festive and daily offering SKUs.',
    peak: 'Morning · evening aarti',
  },
  market: {
    label: (n) => `${n} market / bazaar clusters`,
    buys: ['Daily staples', 'Detergent', 'Atta / rice', 'Snacks', 'Festival packs'],
    why: 'Dense retail belt — nearby shops absorb surplus at thin margins.',
    peak: 'Evening bazaar',
  },
}

/**
 * Hardcoded LocalIQ “neighbourhood demand” model.
 * Seeded from pin + locality text — no external AI API.
 */
export function buildDemandPockets(
  location: GeoPoint,
  place: PlaceInfo,
  shopType: ShopType,
): DemandPocket[] {
  const rand = mulberry32(seedFromPoint(location, `pockets-${place.neighbourhood}`))
  const text = `${place.neighbourhood} ${place.city} ${place.label}`.toLowerCase()

  const kinds: DemandPocketKind[] = ['pg', 'restaurant', 'college', 'office', 'hospital', 'temple', 'market']
  const pockets: DemandPocket[] = []

  for (const kind of kinds) {
    // Locality text bias + seeded presence
    const textHit =
      (kind === 'pg' && /pg|hostel|paying|student|colony/.test(text)) ||
      (kind === 'restaurant' && /road|market|nagar|circle|food|bazaar/.test(text)) ||
      (kind === 'college' && /college|university|tech|institute|school/.test(text)) ||
      (kind === 'office' && /tech|park|sector|hitech|financial|it /.test(text)) ||
      (kind === 'hospital' && /hospital|clinic|medical|care/.test(text)) ||
      (kind === 'temple' && /temple|mandir|mosque|church/.test(text)) ||
      (kind === 'market' && /market|bazaar|chowk|gandhi|main/.test(text))

    const present = textHit || rand() > 0.42
    if (!present) continue

    const count = 1 + Math.floor(rand() * (textHit ? 5 : 3))
    const distanceKm = Number((0.15 + rand() * 1.6).toFixed(2))
    const lift = Math.round(12 + count * 6 + (textHit ? 10 : 0) + rand() * 14)
    const meta = KIND_COPY[kind]

    // Prefer buys that overlap shop SKUs when possible
    const buys = meta.buys.map((b, i) => {
      const sku = shopType.stockSkus[i % shopType.stockSkus.length]
      return rand() > 0.45 ? sku : b
    })

    pockets.push({
      id: `pocket-${kind}`,
      kind,
      label: meta.label(count),
      distanceKm,
      demandLift: Math.min(92, lift),
      buys: [...new Set(buys)].slice(0, 4),
      why: meta.why,
      peak: meta.peak,
    })
  }

  return pockets.sort((a, b) => b.demandLift - a.demandLift || a.distanceKm - b.distanceKm).slice(0, 5)
}

function motiveUrgency(
  draft: MerchantStockDraft,
): InventoryUrgency {
  if (draft.daysToExpiry != null && draft.daysToExpiry <= 7) return 'high'
  if (draft.daysNotSelling >= 21) return 'high'
  if (draft.motive === 'expiring' || draft.motive === 'season_end') return 'high'
  if (draft.daysToExpiry != null && draft.daysToExpiry <= 21) return 'medium'
  if (draft.daysNotSelling >= 10) return 'medium'
  return 'low'
}

type InventoryUrgency = 'high' | 'medium' | 'low'

/**
 * Hardcoded matcher: expiry + slow-moving + nearby demand pockets + rival shops.
 */
export function matchMerchantStock(input: {
  draft: MerchantStockDraft
  pockets: DemandPocket[]
  nearbyShopNames: string[]
  shopName: string
}): StockMatchSuggestion[] {
  const { draft, pockets, nearbyShopNames, shopName } = input
  const skuLower = draft.sku.toLowerCase()
  const urgency = motiveUrgency(draft)
  const suggestions: StockMatchSuggestion[] = []

  // Expiry / slow penalty → higher urgency score
  const expiryBoost =
    draft.daysToExpiry == null
      ? 0
      : draft.daysToExpiry <= 5
        ? 22
        : draft.daysToExpiry <= 14
          ? 14
          : draft.daysToExpiry <= 30
            ? 8
            : 2
  const slowBoost = Math.min(18, Math.round(draft.daysNotSelling * 0.7))

  for (const pocket of pockets) {
    const buyHit = pocket.buys.some(
      (b) =>
        skuLower.includes(b.toLowerCase().slice(0, 6)) ||
        b.toLowerCase().includes(skuLower.slice(0, 6)) ||
        skuLower.split(/\s+/).some((w) => w.length > 3 && b.toLowerCase().includes(w)),
    )
    const kindBonus =
      pocket.kind === 'pg' && /maggi|noodle|snack|drink|milk|detergent|atta|oil|biscuit/.test(skuLower)
        ? 16
        : pocket.kind === 'restaurant' && /oil|spice|tissue|drink|onion|atta|rice|pack/.test(skuLower)
          ? 16
          : pocket.kind === 'college' && /note|pen|snack|drink|maggi|gel/.test(skuLower)
            ? 14
            : pocket.kind === 'office' && /tea|coffee|biscuit|water|cable|pen/.test(skuLower)
              ? 12
              : buyHit
                ? 18
                : 4

    const matchScore = Math.min(
      99,
      Math.round(
        42 +
          kindBonus +
          expiryBoost +
          slowBoost +
          pocket.demandLift * 0.18 -
          pocket.distanceKm * 6,
      ),
    )

    if (matchScore < 48) continue

    const expiryBit =
      draft.daysToExpiry != null
        ? `expires in ${draft.daysToExpiry}d`
        : draft.daysNotSelling > 0
          ? `unsold ${draft.daysNotSelling}d`
          : draft.motive

    suggestions.push({
      id: `sug-${pocket.id}-${draft.sku}`,
      buyerLabel: pocket.label,
      distanceKm: pocket.distanceKm,
      matchScore,
      urgency: matchScore >= 78 || urgency === 'high' ? 'high' : urgency,
      pocketKind: pocket.kind,
      reason: `${pocket.why} Peak ${pocket.peak}. Your “${draft.sku}” (${expiryBit}) fits their basket — offer to shops serving this pocket.`,
    })
  }

  // Nearby merchant absorbers
  nearbyShopNames.slice(0, 4).forEach((name, i) => {
    const dist = Number((0.2 + i * 0.28 + (i % 2) * 0.11).toFixed(2))
    const matchScore = Math.min(
      96,
      Math.round(50 + expiryBoost + slowBoost * 0.8 - dist * 5 + (3 - i) * 4),
    )
    suggestions.push({
      id: `sug-shop-${i}-${draft.sku}`,
      buyerLabel: name,
      distanceKm: dist,
      matchScore,
      urgency,
      pocketKind: 'shop',
      reason: `${name} can absorb “${draft.sku}” from ${shopName} — local refill beats distributor when stock is ageing.`,
    })
  })

  return suggestions.sort((a, b) => b.matchScore - a.matchScore || a.distanceKm - b.distanceKm).slice(0, 6)
}

/** Estimated cash unlocked if this match closes (shelf value × match × urgency). */
export function unlockRupees(
  shelfValue: number,
  matchScore: number,
  urgency: 'high' | 'medium' | 'low' = 'medium',
): number {
  const urgencyBoost = urgency === 'high' ? 0.92 : urgency === 'medium' ? 0.82 : 0.7
  return Math.max(0, Math.round(shelfValue * (matchScore / 100) * urgencyBoost))
}

export function motiveLabel(m: MerchantStockDraft['motive']): string {
  switch (m) {
    case 'expiring':
      return 'Near expiry'
    case 'slow':
      return 'Not selling'
    case 'overstock':
      return 'Overstock'
    case 'season_end':
      return 'Season ended'
  }
}

export interface DetectedShelfRisk extends MerchantStockDraft {
  id: string
  riskLabel: string
  hint: string
}

/**
 * Auto-detect ageing / slow / near-expiry SKUs from shop type (hardcoded LocalIQ).
 * No manual entry required — merchant can still add extras.
 */
export function detectAgeingStock(
  location: GeoPoint,
  shopType: ShopType,
  shopName: string,
): DetectedShelfRisk[] {
  const rand = mulberry32(seedFromPoint(location, `shelf-${shopType.id}`))
  const skus = shopType.stockSkus
  // Clothes / gadgets / stationery don't "expire" like milk — use season / slow / overstock
  const perishable = shopType.id === 'kirana' || shopType.id === 'food' || shopType.id === 'pharma'
  const motives: MerchantStockDraft['motive'][] = perishable
    ? ['expiring', 'slow', 'overstock', 'season_end']
    : ['slow', 'overstock', 'season_end', 'season_end']
  const out: DetectedShelfRisk[] = []

  const priceMul =
    shopType.id === 'electronics' ? 4.2 : shopType.id === 'garments' ? 3.1 : shopType.id === 'pharma' ? 1.6 : 1

  const count = Math.min(4, Math.max(3, skus.length - 1))
  for (let i = 0; i < count; i++) {
    const sku = skus[i % skus.length]
    const motive = motives[Math.floor(rand() * motives.length)]
    const daysToExpiry =
      perishable && (motive === 'expiring' || motive === 'slow')
        ? Math.round(4 + rand() * 20)
        : perishable && motive === 'overstock'
          ? Math.round(25 + rand() * 40)
          : null
    const daysNotSelling = Math.round(
      motive === 'slow' || motive === 'season_end' ? 12 + rand() * 28 : 5 + rand() * 12,
    )
    const qty = Math.round(6 + rand() * (shopType.id === 'garments' ? 28 : 36))
    const unitPrice = Math.round((22 + rand() * 110) * priceMul)

    const riskLabel =
      daysToExpiry != null && daysToExpiry <= 10
        ? 'Expiry risk'
        : daysNotSelling >= 20
          ? 'Slow mover'
          : motive === 'season_end'
            ? 'Season end'
            : motiveLabel(motive)

    out.push({
      id: `auto-${shopType.id}-${i}`,
      sku,
      qty,
      unitPrice,
      daysToExpiry,
      daysNotSelling,
      motive,
      riskLabel,
      hint: `${riskLabel} on your shelf · ${shopName} · flagged for local trade near demand pockets.`,
    })
  }

  return out.sort((a, b) => {
    const sa = (a.daysToExpiry ?? 99) + (40 - Math.min(40, a.daysNotSelling))
    const sb = (b.daysToExpiry ?? 99) + (40 - Math.min(40, b.daysNotSelling))
    return sa - sb
  })
}
