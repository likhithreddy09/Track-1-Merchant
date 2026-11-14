import type { GeoPoint } from '../types'
import { haversineKm, mulberry32, offsetPoint, seedFromPoint } from './geo'

export type DarkStoreBrand = 'Zepto' | 'Blinkit' | 'Instamart' | 'BB Now'

export interface DarkStore {
  id: string
  brand: DarkStoreBrand
  lat: number
  lng: number
  distanceKm: number
  etaMin: number
  /** Area where 10-min delivery pulls basket orders away (metres) */
  zoneM: number
  hitsSkus: string[]
  fightBack: string
}

const BRANDS: { brand: DarkStoreBrand; eta: number; hits: string[]; fight: string }[] = [
  {
    brand: 'Zepto',
    eta: 10,
    hits: ['Milk & bread', 'Snacks', 'Cold drinks'],
    fight: 'Take WhatsApp orders and deliver free within 500 m — beat 10 min on trust.',
  },
  {
    brand: 'Blinkit',
    eta: 10,
    hits: ['Staples', 'Personal care', 'Instant food'],
    fight: 'Match MRP on top staples and pin price tags — app fees make you cheaper.',
  },
  {
    brand: 'Instamart',
    eta: 15,
    hits: ['Fruits & veg', 'Dairy', 'Household'],
    fight: 'Keep fresh dairy stocked for 6–9 AM — their slots are busiest then.',
  },
  {
    brand: 'BB Now',
    eta: 15,
    hits: ['Atta & rice', 'Oil', 'Pulses'],
    fight: 'Offer loose / custom quantities and monthly udhaar — apps can’t.',
  },
]

/** Quick-commerce dark stores near the shop (estimated positions for demo). */
export function buildDarkStores(center: GeoPoint): DarkStore[] {
  const rand = mulberry32(seedFromPoint(center, 'dark-stores'))
  const count = 3 + Math.floor(rand() * 2)
  const picks = [...BRANDS].sort(() => rand() - 0.5).slice(0, count)

  return picks
    .map((b, i) => {
      const angle = (i / count) * Math.PI * 2 + rand() * 0.9
      const distM = 650 + rand() * 1150
      const p = offsetPoint(center, Math.cos(angle) * distM, Math.sin(angle) * distM)
      return {
        id: `dark-${b.brand}-${i}`,
        brand: b.brand,
        lat: p.lat,
        lng: p.lng,
        distanceKm: Number(haversineKm(center, p).toFixed(2)),
        etaMin: b.eta,
        zoneM: 420 + Math.round(rand() * 180),
        hitsSkus: b.hits,
        fightBack: b.fight,
      }
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
}
