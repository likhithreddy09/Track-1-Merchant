import type { AgeBucket, DemographicSnapshot, GeoPoint, PlaceInfo } from '../types'
import { locationKey, mulberry32, seedFromPoint, snapPoint } from './geo'

/** Area of a ring between r0 and r1 (km), km² */
function ringAreaKm2(r0: number, r1: number): number {
  return Math.PI * (r1 * r1 - r0 * r0)
}

function decayWeight(dKm: number, lambda: number): number {
  return Math.exp(-lambda * dKm)
}

/** Census-anchored urban people/km² priors for major Indian cities (trade-area scale). */
const CITY_DENSITY: Record<string, number> = {
  mumbai: 28000,
  delhi: 12000,
  'new delhi': 12000,
  bengaluru: 11000,
  bangalore: 11000,
  hyderabad: 10500,
  secunderabad: 10500,
  chennai: 12000,
  kolkata: 22000,
  pune: 9000,
  ahmedabad: 11000,
  jaipur: 8500,
  surat: 12000,
  lucknow: 8500,
  kanpur: 9000,
  nagpur: 8000,
  indore: 8500,
  thane: 18000,
  bhopal: 7500,
  visakhapatnam: 7000,
  patna: 10000,
  vadodara: 8000,
  ghaziabad: 11000,
  ludhiana: 9000,
  agra: 8000,
  nashik: 7500,
  faridabad: 10000,
  meerut: 8500,
  rajkot: 8000,
  varanasi: 9500,
  srinagar: 7000,
  amritsar: 8000,
  chandigarh: 9000,
  coimbatore: 8000,
  kochi: 7500,
  cochin: 7500,
  thiruvananthapuram: 7000,
  guwahati: 6500,
  bhubaneswar: 7000,
  mysuru: 7000,
  mysore: 7000,
  gurgaon: 9000,
  gurugram: 9000,
  noida: 8500,
  'greater noida': 6000,
  navi: 9000,
  howrah: 20000,
}

/** Fixed India urban age structure by city tier (Census/NFHS-shaped). No random jitter. */
const AGE_METRO = [
  { label: '0–4', min: 0, max: 4, w: 0.068 },
  { label: '5–17', min: 5, max: 17, w: 0.155 },
  { label: '18–24', min: 18, max: 24, w: 0.125 },
  { label: '25–34', min: 25, max: 34, w: 0.188 },
  { label: '35–44', min: 35, max: 44, w: 0.158 },
  { label: '45–60', min: 45, max: 60, w: 0.172 },
  { label: '60+', min: 60, max: 90, w: 0.134 },
]

const AGE_CITY = [
  { label: '0–4', min: 0, max: 4, w: 0.075 },
  { label: '5–17', min: 5, max: 17, w: 0.172 },
  { label: '18–24', min: 18, max: 24, w: 0.118 },
  { label: '25–34', min: 25, max: 34, w: 0.172 },
  { label: '35–44', min: 35, max: 44, w: 0.148 },
  { label: '45–60', min: 45, max: 60, w: 0.178 },
  { label: '60+', min: 60, max: 90, w: 0.137 },
]

const AGE_TOWN = [
  { label: '0–4', min: 0, max: 4, w: 0.082 },
  { label: '5–17', min: 5, max: 17, w: 0.185 },
  { label: '18–24', min: 18, max: 24, w: 0.112 },
  { label: '25–34', min: 25, max: 34, w: 0.162 },
  { label: '35–44', min: 35, max: 44, w: 0.142 },
  { label: '45–60', min: 45, max: 60, w: 0.175 },
  { label: '60+', min: 60, max: 90, w: 0.142 },
]

const METRO_NAMES = new Set([
  'mumbai',
  'delhi',
  'new delhi',
  'bengaluru',
  'bangalore',
  'hyderabad',
  'chennai',
  'kolkata',
  'pune',
  'ahmedabad',
  'gurgaon',
  'gurugram',
  'noida',
  'thane',
  'howrah',
  'secunderabad',
])

type DensityPrior = {
  peoplePerKm2: number
  householdSize: number
  densityClass: DemographicSnapshot['densifyLabel']
  metroFactor: number
  tier: 'metro' | 'city' | 'town'
  cityHit: boolean
}

function normalizeCity(city: string): string {
  return city.toLowerCase().replace(/\s+/g, ' ').trim()
}

function densityPrior(place: PlaceInfo, location: GeoPoint): DensityPrior {
  const city = normalizeCity(place.city)
  const text = `${place.neighbourhood} ${place.city} ${place.state}`.toLowerCase()
  const cityHit = Object.prototype.hasOwnProperty.call(CITY_DENSITY, city)
  const metro = METRO_NAMES.has(city) || /mumbai|delhi|bengaluru|bangalore|hyderabad|chennai|kolkata/.test(text)

  let peoplePerKm2 = cityHit ? CITY_DENSITY[city] : metro ? 12000 : 7800

  // Locality texture (deterministic multipliers — no RNG)
  if (/sector|phase|hitech|hi-tech|it park|financial|cbd|market|bazaar|chowk/.test(text)) {
    peoplePerKm2 *= 1.18
  } else if (/colony|nagar|enclave|puram|pally|palli|layout|township/.test(text)) {
    peoplePerKm2 *= 1.1
  } else if (/village|gram|mandal|taluk|rural|outskirts|farm|forest/.test(text)) {
    peoplePerKm2 *= 0.58
  }

  // Latitude soft prior across India (deterministic)
  const latFactor = 0.96 + Math.min(0.08, Math.max(0, (location.lat - 12) * 0.003))
  peoplePerKm2 = Math.round(peoplePerKm2 * latFactor)

  // HH size — NFHS/Census urban anchors by tier
  const householdSize = metro ? 3.72 : cityHit ? 3.95 : 4.18
  const tier: DensityPrior['tier'] = metro ? 'metro' : cityHit ? 'city' : 'town'

  const densityClass: DemographicSnapshot['densifyLabel'] =
    peoplePerKm2 > 18000
      ? 'Dense urban pocket'
      : peoplePerKm2 > 11000
        ? 'Busy neighbourhood'
        : peoplePerKm2 > 7000
          ? 'Mixed residential belt'
          : 'Moderate catchment'

  return {
    peoplePerKm2,
    householdSize,
    densityClass,
    metroFactor: metro ? 1.08 : 1,
    tier,
    cityHit,
  }
}

function ageTable(tier: DensityPrior['tier']) {
  if (tier === 'metro') return AGE_METRO
  if (tier === 'city') return AGE_CITY
  return AGE_TOWN
}

function hourFactor(date = new Date()): number {
  const h = date.getHours() + date.getMinutes() / 60
  if (h < 7) return 0.32
  if (h < 11) return 0.72
  if (h < 14) return 0.98
  if (h < 17) return 0.82
  if (h < 21) return 1.18
  return 0.48
}

const memoryCache = new Map<string, DemographicSnapshot>()

function cacheKey(location: GeoPoint, place: PlaceInfo, mapBoost = 1): string {
  return `${locationKey(location)}|${normalizeCity(place.city)}|${place.neighbourhood}|b${mapBoost.toFixed(3)}`
}

function readSession(key: string): DemographicSnapshot | null {
  try {
    const raw = sessionStorage.getItem(`demo-catchment:${key}`)
    if (!raw) return null
    return JSON.parse(raw) as DemographicSnapshot
  } catch {
    return null
  }
}

function writeSession(key: string, value: DemographicSnapshot) {
  try {
    sessionStorage.setItem(`demo-catchment:${key}`, JSON.stringify(value))
  } catch {
    /* ignore quota */
  }
}

/**
 * Deterministic gravity catchment for a snapped pin.
 * Same location (≈110 m grid) + same place labels → identical people / HH / age every time.
 *
 * N̂ = Σ dens(r)·Area(r)·e^(−λd)   λ=0.85   rings 0.5/1/1.5/2 km
 * HĤ = N̂ / μ_hh
 */
export function buildDemographics(
  location: GeoPoint,
  place: PlaceInfo,
  options?: { mapBoost?: number },
): DemographicSnapshot {
  const snapped = snapPoint(location)
  const mapBoost = options?.mapBoost ?? 1
  const key = cacheKey(snapped, place, mapBoost)
  const hit = memoryCache.get(key) || readSession(key)
  if (hit) return hit

  const prior = densityPrior(place, snapped)
  const dens = Math.round(prior.peoplePerKm2 * mapBoost)

  const rings = [
    { r0: 0, r1: 0.5, mid: 0.25 },
    { r0: 0.5, r1: 1.0, mid: 0.75 },
    { r0: 1.0, r1: 1.5, mid: 1.25 },
    { r0: 1.5, r1: 2.0, mid: 1.75 },
  ]
  const lambda = 0.85

  let expectedPeople = 0
  const ringBreakdown: DemographicSnapshot['catchmentRings'] = []

  for (const ring of rings) {
    const area = ringAreaKm2(ring.r0, ring.r1)
    const w = decayWeight(ring.mid, lambda)
    const localDens = dens * (1.16 - ring.mid * 0.11) * prior.metroFactor
    const people = localDens * area * w
    expectedPeople += people
    ringBreakdown.push({
      label: `${ring.r0.toFixed(1)}–${ring.r1.toFixed(1)} km`,
      people: Math.round(people),
      households: Math.round(people / prior.householdSize),
      weight: Number(w.toFixed(3)),
    })
  }

  // No random noise — pure formula for stable demos
  const totalPeople = Math.max(1200, Math.round(expectedPeople))
  const households = Math.max(280, Math.round(totalPeople / prior.householdSize))

  // Model uncertainty band (deterministic from N, not RNG)
  const phi = prior.cityHit ? 14 : prior.tier === 'metro' ? 16 : 22
  const se = Math.sqrt(totalPeople * phi)
  const ci95 = Math.round(1.96 * se)

  const mix = ageTable(prior.tier)
  const ageBuckets: AgeBucket[] = mix.map((b) => {
    const percent = Number((b.w * 100).toFixed(1))
    return {
      label: b.label,
      min: b.min,
      max: b.max,
      percent,
      count: Math.round((percent / 100) * totalPeople),
    }
  })
  const ageSum = ageBuckets.reduce((a, b) => a + b.count, 0)
  if (ageBuckets.length && ageSum !== totalPeople) {
    ageBuckets[ageBuckets.length - 1].count += totalPeople - ageSum
  }

  const childrenPercent = Number(
    ageBuckets.filter((b) => b.max <= 17).reduce((a, b) => a + b.percent, 0).toFixed(1),
  )
  const workingAgePercent = Number(
    ageBuckets
      .filter((b) => b.min >= 18 && b.max <= 60)
      .reduce((a, b) => a + b.percent, 0)
      .toFixed(1),
  )
  const seniorsPercent = Number(
    ageBuckets.filter((b) => b.min >= 60).reduce((a, b) => a + b.percent, 0).toFixed(1),
  )

  // Live pulse: deterministic from location + 5-min clock bucket
  const minuteBucket = Math.floor(new Date().getMinutes() / 5)
  const pulseRand = mulberry32(seedFromPoint(snapped, `pulse-${new Date().getHours()}-${minuteBucket}`))
  const participate = 0.015 + pulseRand() * 0.004
  const livePulse = Math.max(
    18,
    Math.round(totalPeople * participate * hourFactor()),
  )

  const modelConfidence = Math.min(
    96,
    Math.round(
      72 +
        (prior.cityHit ? 12 : 0) +
        (prior.tier === 'metro' ? 6 : 0) +
        (mapBoost !== 1 ? 5 : 0) +
        (dens > 12000 ? 2 : 0),
    ),
  )

  const snap = {
    totalPeople,
    households,
    householdSize: prior.householdSize,
    peoplePerKm2: dens,
    populationCi95: ci95,
    modelConfidence,
    workingAgePercent,
    childrenPercent,
    seniorsPercent,
    densifyLabel: prior.densityClass,
    ageBuckets,
    livePulse,
    catchmentRings: ringBreakdown,
    methodNote:
      mapBoost !== 1
        ? `N̂ = Σ dens(r)·Area(r)·e^(−λd) · λ=0.85 · city prior + OSM building boost ×${mapBoost.toFixed(2)} · HH = N/μ_hh · pinned ${snapped.lat},${snapped.lng}`
        : `N̂ = Σ dens(r)·Area(r)·e^(−λd) · λ=0.85 · city-calibrated dens · fixed age table · HH = N/μ_hh · pinned ${snapped.lat},${snapped.lng}`,
  }

  memoryCache.set(key, snap)
  writeSession(key, snap)
  return snap
}

/**
 * Refine density using live OpenStreetMap building count in 1 km.
 * Same pin → same Overpass-derived boost (cached). Falls back silently.
 */
export async function enrichDemographicsFromMap(
  location: GeoPoint,
  place: PlaceInfo,
): Promise<DemographicSnapshot> {
  const snapped = snapPoint(location)
  const boostKey = `mapboost:${locationKey(snapped)}`
  let mapBoost = 1

  try {
    const cachedBoost = sessionStorage.getItem(boostKey)
    if (cachedBoost) {
      mapBoost = Number(cachedBoost) || 1
    } else {
      mapBoost = await fetchBuildingBoost(snapped)
      sessionStorage.setItem(boostKey, String(mapBoost))
    }
  } catch {
    mapBoost = 1
  }

  return buildDemographics(snapped, place, { mapBoost })
}

async function fetchBuildingBoost(location: GeoPoint): Promise<number> {
  const query = `[out:json][timeout:6];way["building"](around:1000,${location.lat},${location.lng});out count;`
  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ]

  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController()
      const timer = window.setTimeout(() => controller.abort(), 6500)
      const res = await fetch(endpoint, {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: controller.signal,
      })
      window.clearTimeout(timer)
      if (!res.ok) continue
      const data = await res.json()
      const el = Array.isArray(data.elements) ? data.elements[0] : null
      const ways = Number(el?.tags?.ways || el?.tags?.total || 0)
      if (!Number.isFinite(ways) || ways <= 0) continue
      // ~800–4500 buildings / km² typical urban → map to 0.82–1.28 dens boost
      const perKm2 = ways / (Math.PI * 1 * 1)
      const boost = Math.min(1.28, Math.max(0.82, 0.78 + perKm2 / 9000))
      return Number(boost.toFixed(3))
    } catch {
      /* try next */
    }
  }
  return 1
}

/** Deterministic pulse for the current 5-minute window (same pin → same number). */
export function nextLivePulse(current: number, totalPeople: number, location?: GeoPoint): number {
  if (!location) return current
  const snapped = snapPoint(location)
  const minuteBucket = Math.floor(new Date().getMinutes() / 5)
  const pulseRand = mulberry32(seedFromPoint(snapped, `pulse-${new Date().getHours()}-${minuteBucket}`))
  const participate = 0.015 + pulseRand() * 0.004
  return Math.max(18, Math.round(totalPeople * participate * hourFactor()))
}
