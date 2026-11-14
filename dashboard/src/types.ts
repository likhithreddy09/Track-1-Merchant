export type ShopTypeId =
  | 'kirana'
  | 'garments'
  | 'pharma'
  | 'electronics'
  | 'food'
  | 'beauty'
  | 'stationery'

export interface ShopType {
  id: ShopTypeId
  label: string
  icon: string
  overpassTags: string[]
  targetAges: string[]
  targetSegments: string[]
  stockSkus: string[]
  demandKeywords: string[]
}

export interface GeoPoint {
  lat: number
  lng: number
}

export interface PlaceInfo {
  label: string
  neighbourhood: string
  city: string
  state: string
}

export interface ReviewThemeScore {
  key: string
  label: string
  score: number
}

export interface ReviewSnippet {
  author: string
  rating: number
  text: string
  relativeTime: string
}

export interface GoogleReviewProfile {
  rating: number
  reviewCount: number
  recentReviews30d: number
  sentiment: number
  stars: { 1: number; 2: number; 3: number; 4: number; 5: number }
  themes: ReviewThemeScore[]
  topPraise: string
  topComplaint: string
  sourceLabel: string
  categoryHint: string
  /** Original review texts when Google Places is live */
  snippets?: ReviewSnippet[]
  live?: boolean
}

/** Where rival pins came from — reviews are only real when source === 'google' */
export type CompetitorSource = 'google' | 'osm' | 'simulated'

export interface CompetitorShop {
  id: string
  name: string
  lat: number
  lng: number
  distanceKm: number
  category: string
  threat: 'high' | 'medium' | 'low'
  rating: number
  estimatedFootfall: number
  reviews?: GoogleReviewProfile
  /** Shop-front photo (Unsplash / Places) — no map API key needed */
  photoUrl?: string
  /** Google Maps place URL when from Places API */
  placeUrl?: string
}

/** Area buying-habit scores + Sarvam merchant decision */
export interface AreaBuyingHabits {
  priceSensitive: number
  offerSensitive: number
  qualitySensitive: number
  convenienceSensitive: number
  dominantTrait: 'price' | 'offer' | 'quality' | 'convenience'
  summary: string
  decision: string
  actions: string[]
  evidence: string[]
  source: 'sarvam+google' | 'sarvam+model' | 'local'
  reviewSource: 'google_live' | 'model'
}

export interface AgeBucket {
  label: string
  min: number
  max: number
  percent: number
  count: number
}

export interface CatchmentRing {
  label: string
  people: number
  households: number
  weight: number
}

export interface DemographicSnapshot {
  totalPeople: number
  households: number
  householdSize: number
  peoplePerKm2: number
  populationCi95: number
  modelConfidence: number
  workingAgePercent: number
  childrenPercent: number
  seniorsPercent: number
  densifyLabel: 'Dense urban pocket' | 'Busy neighbourhood' | 'Mixed residential belt' | 'Moderate catchment' | string
  ageBuckets: AgeBucket[]
  livePulse: number
  catchmentRings: CatchmentRing[]
  methodNote: string
}

export interface TargetSegment {
  title: string
  share: number
  why: string
  opportunity: 'high' | 'medium' | 'low'
}

export interface AiInsight {
  id: string
  tone: 'opportunity' | 'warning' | 'action' | 'info'
  title: string
  body: string
  confidence: number
}

export interface InventoryListing {
  id: string
  shopName: string
  distanceKm: number
  sku: string
  qty: number
  unitPrice: number
  type: 'surplus' | 'shortage'
  urgency: 'high' | 'medium' | 'low'
  matchScore: number
  reason: string
  /** Merchant-listed ageing / expiry stock */
  mine?: boolean
  daysToExpiry?: number | null
  daysNotSelling?: number
  motive?: 'expiring' | 'slow' | 'overstock' | 'season_end'
}

export interface CompetitorIntel {
  shop: CompetitorShop
  stealRisk: number
  pricePressure: number
  overlapScore: number
  peakHours: string
  strength: string
  weakness: string
  aiBrief: string
  moveNow: string
  stats: { label: string; value: string }[]
  reviewScorecard: string
  copyFromRival: string[]
  beatRival: string[]
  themeBars: ReviewThemeScore[]
}

export interface SessionState {
  location: GeoPoint
  place: PlaceInfo
  shopType: ShopType
  shopName: string
}
