import type { CompetitorShop, GeoPoint, GoogleReviewProfile, ReviewSnippet, ShopType, ShopTypeId } from '../types'
import { haversineKm } from './geo'
import { profileFromPlaceReviews } from './googleReviews'

const GOOGLE_TYPES: Record<ShopTypeId, string[]> = {
  kirana: ['convenience_store', 'supermarket', 'grocery_or_supermarket'],
  garments: ['clothing_store', 'shoe_store'],
  pharma: ['pharmacy', 'drugstore'],
  electronics: ['electronics_store', 'cell_phone_store'],
  food: ['restaurant', 'meal_takeaway', 'cafe'],
  beauty: ['beauty_salon', 'hair_care'],
  stationery: ['book_store', 'store'],
}

type NearbyResult = {
  place_id: string
  name: string
  geometry?: { location?: { lat: number; lng: number } }
  rating?: number
  user_ratings_total?: number
  vicinity?: string
  types?: string[]
}

type DetailsResult = {
  place_id?: string
  name?: string
  rating?: number
  user_ratings_total?: number
  url?: string
  reviews?: {
    author_name?: string
    rating?: number
    text?: string
    relative_time_description?: string
    time?: number
  }[]
  geometry?: { location?: { lat: number; lng: number } }
}

function threatFromDistance(km: number, rating = 3.8): CompetitorShop['threat'] {
  const score = Math.exp(-1.35 * km) * 0.68 + ((rating - 3) / 2) * 0.32
  if (score > 0.6 || (km < 0.5 && rating >= 4.2)) return 'high'
  if (score > 0.36 || km < 1.4) return 'medium'
  return 'low'
}

async function googleGet(pathAndQuery: string): Promise<Response> {
  return fetch(`/api/google${pathAndQuery}`)
}

/** True when Vite has a Google Places key and the API responds. */
export async function googlePlacesAvailable(): Promise<boolean> {
  try {
    const res = await googleGet(
      '/maps/api/place/nearbysearch/json?location=17.4948,78.3996&radius=200&type=store',
    )
    if (!res.ok) return false
    const data = (await res.json()) as { status?: string }
    return data.status === 'OK' || data.status === 'ZERO_RESULTS'
  } catch {
    return false
  }
}

async function nearbySearch(
  location: GeoPoint,
  type: string,
  keyword?: string,
): Promise<NearbyResult[]> {
  const params = new URLSearchParams({
    location: `${location.lat},${location.lng}`,
    radius: '2200',
    type,
  })
  if (keyword) params.set('keyword', keyword)
  const res = await googleGet(`/maps/api/place/nearbysearch/json?${params}`)
  if (!res.ok) return []
  const data = (await res.json()) as { status?: string; results?: NearbyResult[] }
  if (data.status !== 'OK' || !Array.isArray(data.results)) return []
  return data.results
}

async function placeDetails(placeId: string): Promise<DetailsResult | null> {
  const params = new URLSearchParams({
    place_id: placeId,
    fields: 'place_id,name,geometry,rating,user_ratings_total,reviews,url',
    reviews_sort: 'most_relevant',
  })
  const res = await googleGet(`/maps/api/place/details/json?${params}`)
  if (!res.ok) return null
  const data = (await res.json()) as { status?: string; result?: DetailsResult }
  if (data.status !== 'OK' || !data.result) return null
  return data.result
}

function detailsToSnippets(details: DetailsResult): ReviewSnippet[] {
  return (details.reviews || [])
    .filter((r) => (r.text || '').trim().length > 8)
    .slice(0, 5)
    .map((r) => ({
      author: r.author_name || 'Local reviewer',
      rating: Number(r.rating || 0),
      text: (r.text || '').trim(),
      relativeTime: r.relative_time_description || '',
    }))
}

/**
 * Live Google Places rivals + original review text (requires GOOGLE_PLACES_API_KEY).
 */
export async function fetchGoogleCompetitors(
  location: GeoPoint,
  shopType: ShopType,
): Promise<CompetitorShop[]> {
  const types = GOOGLE_TYPES[shopType.id] || ['store']
  const keyword = shopType.label.split('/')[0].trim()

  const batches = await Promise.all(
    types.slice(0, 2).map((t) => nearbySearch(location, t, keyword)),
  )
  const seen = new Set<string>()
  const nearby: NearbyResult[] = []
  for (const batch of batches) {
    for (const row of batch) {
      if (!row.place_id || seen.has(row.place_id)) continue
      seen.add(row.place_id)
      nearby.push(row)
    }
  }

  nearby.sort((a, b) => {
    const da = haversineKm(location, {
      lat: a.geometry?.location?.lat || location.lat,
      lng: a.geometry?.location?.lng || location.lng,
    })
    const db = haversineKm(location, {
      lat: b.geometry?.location?.lat || location.lat,
      lng: b.geometry?.location?.lng || location.lng,
    })
    return da - db
  })

  const top = nearby.slice(0, 10)
  const shops: CompetitorShop[] = []

  // Details in small parallel batches to stay under rate limits
  for (let i = 0; i < top.length; i += 3) {
    const chunk = top.slice(i, i + 3)
    const details = await Promise.all(chunk.map((n) => placeDetails(n.place_id)))
    details.forEach((d, idx) => {
      const base = chunk[idx]
      const lat = d?.geometry?.location?.lat ?? base.geometry?.location?.lat
      const lng = d?.geometry?.location?.lng ?? base.geometry?.location?.lng
      if (typeof lat !== 'number' || typeof lng !== 'number') return
      const distanceKm = Number(haversineKm(location, { lat, lng }).toFixed(2))
      if (distanceKm < 0.04) return

      const snippets = d ? detailsToSnippets(d) : []
      const rating = Number((d?.rating ?? base.rating ?? 3.8).toFixed(1))
      const reviewCount = d?.user_ratings_total ?? base.user_ratings_total ?? snippets.length
      const reviews: GoogleReviewProfile = profileFromPlaceReviews({
        rating,
        reviewCount,
        snippets,
        shopType,
        live: true,
      })

      shops.push({
        id: `gplace-${base.place_id}`,
        name: d?.name || base.name || shopType.label,
        lat,
        lng,
        distanceKm,
        category: shopType.label,
        rating: reviews.rating,
        estimatedFootfall: Math.round(
          28 + Math.log10(reviews.reviewCount + 10) * 55 + reviews.recentReviews30d * 1.8,
        ),
        threat: threatFromDistance(distanceKm, reviews.rating),
        reviews,
        placeUrl: d?.url,
      })
    })
  }

  return shops.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 16)
}
