import type { CompetitorShop, CompetitorSource, GeoPoint, ShopType } from '../types'
import { haversineKm, mulberry32, offsetPoint, seedFromPoint } from './geo'
import { enrichShopWithReviews } from './googleReviews'

const FALLBACK_NAMES: Record<string, string[]> = {
  kirana: ['Shree Kirana', 'Daily Needs Mart', 'Annapurna Stores', 'City Bazaar', 'Fresh Basket', 'Local Mart', 'Gareeb Nawaz Store', 'SuperValue Kirana'],
  garments: ['Style Hub', 'Fashion Point', 'Trendz Wear', 'Cotton House', 'Elite Tailors', 'Urban Closet', 'Festive Fits', 'Look Good'],
  pharma: ['CarePlus Pharmacy', 'MediQuick', 'HealthFirst Chemist', 'Apollo Local', 'Wellness Meds', 'City Chemist', 'LifeCare Drugs'],
  electronics: ['Gadget Zone', 'Mobile World', 'TechNest', 'Smart Mart', 'Byte & Cable', 'Phone Plaza', 'ElectroHub'],
  food: ['Spice Route', 'Bite Corner', 'Tandoor Express', 'Cafe Local', 'Lunch Box', 'Night Cravings', 'Masala Bowl'],
  beauty: ['Glow Studio', 'Pretty Palette', 'Hair & Care', 'Blush Boutique', 'Style Lounge', 'Velvet Beauty'],
  stationery: ['Book Nest', 'Write Right', 'Exam Ready', 'Paper Plane', 'Scholar Store', 'Ink & Ideas'],
}

function threatFromDistance(km: number, rating = 3.8): CompetitorShop['threat'] {
  // Closer + higher ★ ⇒ hotter rivalry (aligned with steal-risk priors)
  const score = Math.exp(-1.35 * km) * 0.68 + ((rating - 3) / 2) * 0.32
  if (score > 0.6 || (km < 0.5 && rating >= 4.2)) return 'high'
  if (score > 0.36 || km < 1.4) return 'medium'
  return 'low'
}

async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    window.clearTimeout(timer)
  }
}

async function fetchOverpass(location: GeoPoint, shopType: ShopType): Promise<CompetitorShop[]> {
  const radius = 2500
  const filters = shopType.overpassTags
    .map((tag) => {
      const [k, v] = tag.split('=')
      return `node["${k}"="${v}"](around:${radius},${location.lat},${location.lng});way["${k}"="${v}"](around:${radius},${location.lat},${location.lng});`
    })
    .join('')

  const query = `[out:json][timeout:8];(${filters});out center 40;`
  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ]

  for (const endpoint of endpoints) {
    try {
      const res = await fetchWithTimeout(
        endpoint,
        {
          method: 'POST',
          body: `data=${encodeURIComponent(query)}`,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
        7000,
      )
      if (!res.ok) continue
      const data = await res.json()
      const elements = Array.isArray(data.elements) ? data.elements : []
      const shops: CompetitorShop[] = []

      for (const el of elements) {
        const lat = el.lat ?? el.center?.lat
        const lng = el.lon ?? el.center?.lon
        if (typeof lat !== 'number' || typeof lng !== 'number') continue
        const distanceKm = haversineKm(location, { lat, lng })
        if (distanceKm < 0.05) continue
        const name = el.tags?.name || el.tags?.brand || `${shopType.label} shop`
        shops.push({
          id: `osm-${el.id}`,
          name,
          lat,
          lng,
          distanceKm: Number(distanceKm.toFixed(2)),
          category: shopType.label,
          rating: Number((3.6 + ((el.id % 14) / 10)).toFixed(1)),
          estimatedFootfall: 40 + (el.id % 180),
          threat: threatFromDistance(
            distanceKm,
            Number((3.6 + ((el.id % 14) / 10)).toFixed(1)),
          ),
        })
      }

      shops.sort((a, b) => a.distanceKm - b.distanceKm)
      const unique = shops.filter(
        (s, i, arr) =>
          arr.findIndex((x) => x.name === s.name && Math.abs(x.distanceKm - s.distanceKm) < 0.05) === i,
      )
      if (unique.length >= 3) return unique.slice(0, 18)
      if (unique.length > 0) return unique
    } catch {
      // try next endpoint / fall through to simulation
    }
  }
  return []
}

function synthesizeCompetitors(location: GeoPoint, shopType: ShopType): CompetitorShop[] {
  const rand = mulberry32(seedFromPoint(location, shopType.id))
  const names = FALLBACK_NAMES[shopType.id] || FALLBACK_NAMES.kirana
  const count = 8 + Math.floor(rand() * 6)
  const out: CompetitorShop[] = []

  for (let i = 0; i < count; i++) {
    const angle = rand() * Math.PI * 2
    const distM = 180 + rand() * 2200
    const pt = offsetPoint(location, Math.cos(angle) * distM, Math.sin(angle) * distM)
    const distanceKm = haversineKm(location, pt)
    const rating = Number((3.5 + rand() * 1.4).toFixed(1))
    out.push({
      id: `syn-${shopType.id}-${i}`,
      name: names[i % names.length],
      lat: pt.lat,
      lng: pt.lng,
      distanceKm: Number(distanceKm.toFixed(2)),
      category: shopType.label,
      rating,
      estimatedFootfall: Math.floor(35 + rand() * 200),
      threat: threatFromDistance(distanceKm, rating),
    })
  }
  return out.sort((a, b) => a.distanceKm - b.distanceKm)
}

function withReviews(
  shops: CompetitorShop[],
  location: GeoPoint,
  shopType: ShopType,
): CompetitorShop[] {
  return shops.map((s) => {
    const enriched = enrichShopWithReviews(s, shopType, location)
    return {
      ...enriched,
      threat: threatFromDistance(enriched.distanceKm, enriched.rating),
    }
  })
}

export async function loadCompetitors(
  location: GeoPoint,
  shopType: ShopType,
): Promise<{ shops: CompetitorShop[]; source: CompetitorSource }> {
  // Real ratings + original review text only when GOOGLE_PLACES_API_KEY is set
  try {
    const { fetchGoogleCompetitors, googlePlacesAvailable } = await import('./googlePlaces')
    if (await googlePlacesAvailable()) {
      const googleShops = await fetchGoogleCompetitors(location, shopType)
      if (googleShops.length >= 2) {
        return { shops: googleShops, source: 'google' }
      }
    }
  } catch {
    /* fall through to OSM — shops may be real, reviews stay model */
  }

  const simulated = synthesizeCompetitors(location, shopType)

  const livePromise = fetchOverpass(location, shopType)
  const timeoutPromise = new Promise<CompetitorShop[]>((resolve) => {
    window.setTimeout(() => resolve([]), 6500)
  })

  const osm = await Promise.race([livePromise, timeoutPromise])
  if (osm.length >= 3) {
    return {
      shops: withReviews(osm.slice(0, 18), location, shopType),
      source: 'osm',
    }
  }

  const merged = [...osm, ...simulated]
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .filter((s, i, arr) => arr.findIndex((x) => x.name === s.name) === i)
    .slice(0, 16)
  return {
    shops: withReviews(merged, location, shopType),
    source: osm.length ? 'osm' : 'simulated',
  }
}
