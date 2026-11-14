import type {
  CompetitorShop,
  GoogleReviewProfile,
  ReviewSnippet,
  ReviewThemeScore,
  ShopType,
} from '../types'
import { mulberry32, seedFromPoint } from './geo'
import type { GeoPoint } from '../types'
import { shopFrontPhoto } from './shopPhotos'

const THEME_KEYS = [
  'service',
  'price',
  'quality',
  'wait',
  'cleanliness',
  'assortment',
] as const

type ThemeBank = Record<(typeof THEME_KEYS)[number], string[]>

const PRAISE_BY_TYPE: Record<string, ThemeBank> = {
  kirana: {
    service: ['staff remembers regulars', 'quick billing', 'helpful product advice'],
    price: ['fair MRP vs local market', 'UPI cashback visible', 'transparent price tags'],
    quality: ['fresh stock dating', 'trusted brands only', 'packaging intact'],
    wait: ['queue under 3 minutes', 'express counter works', 'WhatsApp pre-order ready'],
    cleanliness: ['aisles clear', 'fridge wiped daily', 'bright LED lighting'],
    assortment: ['rarely out of top staples', 'local + national brands', 'evening rush shelf ready'],
  },
  electronics: {
    service: ['staff explains specs clearly', 'demo before you buy', 'helpful accessory advice'],
    price: ['price match on phones', 'EMI options shown upfront', 'bundle deals on chargers'],
    quality: ['sealed original boxes', 'warranty card always given', 'genuine accessories only'],
    wait: ['fast billing at peak', 'repair token system', 'quick accessory checkout'],
    cleanliness: ['clean glass counters', 'neat cable display', 'bright demo wall'],
    assortment: ['cables always in stock', 'wide earphone range', 'phone cases for latest models'],
  },
  pharma: {
    service: ['pharmacist guidance', 'remembers chronic patients', 'polite counselling'],
    price: ['generic alternatives offered', 'clear MRP tags', 'senior discounts'],
    quality: ['cold chain for vaccines', 'batch/expiry checked', 'trusted brands'],
    wait: ['fast OTC billing', 'separate chronic counter', 'home delivery option'],
    cleanliness: ['clean shelves', 'organised medicine racks', 'hygienic billing desk'],
    assortment: ['chronic meds in stock', 'ORS + vitamins depth', 'baby care section'],
  },
  garments: {
    service: ['trial room help', 'honest size advice', 'alteration support'],
    price: ['festive combo deals', 'clear discount tags', 'exchange policy'],
    quality: ['good stitching', 'fabric feels premium', 'no colour fade'],
    wait: ['quick billing', 'trial rooms free fast', 'WhatsApp new arrivals'],
    cleanliness: ['neat displays', 'clean trial rooms', 'bright store lighting'],
    assortment: ['sizes for all', 'festive collection ready', 'kids + ethnic range'],
  },
  food: {
    service: ['friendly staff', 'order accuracy', 'custom spice level'],
    price: ['value combos', 'transparent menu prices', 'UPI offers'],
    quality: ['freshly cooked', 'hygienic kitchen', 'consistent taste'],
    wait: ['fast lunch service', 'token system', 'delivery on time'],
    cleanliness: ['clean tables', 'tidy counter', 'wash area maintained'],
    assortment: ['full menu available', 'dessert + drinks', 'family packs'],
  },
  beauty: {
    service: ['skin advice', 'shade matching help', 'polite staff'],
    price: ['combo kits', 'clear MRP', 'festive gift packs'],
    quality: ['sealed packs', 'authentic brands', 'no expired stock'],
    wait: ['quick billing', 'demo without rush', 'appointment slots'],
    cleanliness: ['clean counters', 'hygienic testers', 'bright mirrors'],
    assortment: ['full shade range', 'hair + skin depth', 'gifting sets'],
  },
  stationery: {
    service: ['exam guidance', 'helps pick sets', 'student-friendly'],
    price: ['bulk notebook deals', 'clear price tags', 'back-to-school offers'],
    quality: ['good paper quality', 'working pens', 'durable geometry boxes'],
    wait: ['fast counter', 'pre-packed exam kits', 'school list ready'],
    cleanliness: ['neat shelves', 'sorted by class', 'bright lighting'],
    assortment: ['full exam range', 'art supplies depth', 'project materials'],
  },
}

const COMPLAINTS_BY_TYPE: Record<string, ThemeBank> = {
  kirana: {
    service: ['billing slow at peak', 'staff on phone', 'hard to find staff'],
    price: ['marked above nearby shop', 'weak festive deals', 'hidden add-on charges'],
    quality: ['near-expiry stock', 'bruised produce', 'warm fridge items'],
    wait: ['evening queue spills outside', 'single billing counter', 'slow card machine'],
    cleanliness: ['sticky floor near entrance', 'overflowing cartons', 'dim lighting'],
    assortment: ['top SKU stockouts', 'thin cold-drink depth', 'weak private-label depth'],
  },
  electronics: {
    service: ['staff push expensive models', 'poor after-sales follow-up', 'no demo patience'],
    price: ['accessories overpriced', 'EMI charges unclear', 'no price match'],
    quality: ['used/open-box sold as new', 'missing warranty card', 'fake chargers reported'],
    wait: ['long repair wait', 'billing queue at evening', 'slow accessory search'],
    cleanliness: ['tangled cable bins', 'dusty demo phones', 'cluttered counter'],
    assortment: ['no Type-C stock', 'old phone case models only', 'earphones often out'],
  },
  pharma: {
    service: ['rushed counselling', 'hard to ask questions', 'no pharmacist at counter'],
    price: ['higher than nearby chemist', 'no generic option offered', 'unclear MRP'],
    quality: ['near-expiry strips', 'broken blister packs', 'cold items warm'],
    wait: ['long evening queue', 'single billing window', 'slow insurance billing'],
    cleanliness: ['dusty racks', 'messy billing desk', 'poor fridge labels'],
    assortment: ['chronic meds stockout', 'no ORS/vitamins depth', 'baby care missing'],
  },
  garments: {
    service: ['no trial help', 'pressure selling', 'rude on returns'],
    price: ['hidden alteration charges', 'weak exchange policy', 'MRP vs offer confusion'],
    quality: ['loose stitching', 'colour fade', 'wrong size tags'],
    wait: ['trial rooms busy', 'slow billing', 'festive crowd chaos'],
    cleanliness: ['messy piles', 'dirty trial rooms', 'dim lighting'],
    assortment: ['size gaps', 'thin festive stock', 'no kids range'],
  },
  food: {
    service: ['order mistakes', 'slow table attention', 'rude at peak'],
    price: ['combo not value', 'extra charges', 'portion small for price'],
    quality: ['oily / stale taste', 'hygiene doubts', 'inconsistent spice'],
    wait: ['long lunch wait', 'delivery late', 'kitchen bottleneck'],
    cleanliness: ['sticky tables', 'dirty cutlery', 'messy counter'],
    assortment: ['items marked unavailable', 'no family packs', 'drinks stockout'],
  },
  beauty: {
    service: ['no shade help', 'testers refused', 'pushy upsell'],
    price: ['testers charged', 'weak combo value', 'MRP unclear'],
    quality: ['expired creams', 'seal broken', 'doubt on authenticity'],
    wait: ['slow billing', 'no appointment honour', 'crowd at weekend'],
    cleanliness: ['dirty testers', 'messy counters', 'poor lighting'],
    assortment: ['shade gaps', 'hair care thin', 'no gift sets'],
  },
  stationery: {
    service: ['no exam guidance', 'staff unavailable', 'wrong notebook sold'],
    price: ['bulk not cheaper', 'unclear tags', 'no school-list packs'],
    quality: ['leaking pens', 'poor paper', 'broken geometry sets'],
    wait: ['exam rush chaos', 'slow billing', 'no pre-packs'],
    cleanliness: ['messy shelves', 'unsorted stock', 'dim corner'],
    assortment: ['A4 stockout', 'art supplies missing', 'project items thin'],
  },
}

function themeBank(shopType: ShopType, kind: 'praise' | 'complaint'): ThemeBank {
  const map = kind === 'praise' ? PRAISE_BY_TYPE : COMPLAINTS_BY_TYPE
  return map[shopType.id] || map.kirana
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

/**
 * Google-review-style profile: deterministic from pin + shop identity.
 * Mirrors how Places ratings + review volume + theme tags behave.
 * (Live Google Places API can replace this when a key is available.)
 */
export function buildGoogleReviewProfile(
  shop: CompetitorShop,
  shopType: ShopType,
  location: GeoPoint,
): GoogleReviewProfile {
  const rand = mulberry32(seedFromPoint(location, `grev-${shop.id}`))

  // Rating: slightly regress-to-mean around category, nudged by threat/distance
  const base = 3.55 + rand() * 1.25
  const proximityBump = shop.distanceKm < 0.55 ? 0.12 : shop.distanceKm > 1.8 ? -0.08 : 0
  const rating = Number(clamp(base + proximityBump, 3.1, 4.9).toFixed(1))

  // Review volume: power-law-ish — popular closer shops get more reviews
  const volume =
    Math.round(
      Math.pow(10, 1.4 + rand() * 2.1) * (shop.distanceKm < 0.8 ? 1.35 : 1) * (rating / 4),
    ) + Math.floor(rand() * 40)

  // Bias one strength + one weakness per shop so every pin doesn’t look the same
  const weakKey = THEME_KEYS[Math.floor(rand() * THEME_KEYS.length)]
  const strongKey = THEME_KEYS[Math.floor(rand() * THEME_KEYS.length)]
  const themes: ReviewThemeScore[] = THEME_KEYS.map((key) => {
    let score = 2.8 + rand() * 2.1 + (rating - 4) * 0.45
    if (key === weakKey) score -= 0.85 + rand() * 0.4
    if (key === strongKey && key !== weakKey) score += 0.7 + rand() * 0.35
    return {
      key,
      label: key[0].toUpperCase() + key.slice(1),
      score: Number(clamp(score, 2.2, 4.95).toFixed(2)),
    }
  })

  // Star histogram that sums ≈ volume (Dirichlet on 5 bins, bias to rating)
  const starBias = [0.04, 0.08, 0.14, 0.28, 0.46]
  const tilt = Math.round(rating) - 1
  const weights = starBias.map((w, i) => w * (1 + (i === tilt ? 0.55 : 0) + rand() * 0.15))
  const wSum = weights.reduce((a, b) => a + b, 0)
  let left = volume
  const stars = weights.map((w, i) => {
    if (i === 4) return Math.max(0, left)
    const n = Math.round((w / wSum) * volume)
    left -= n
    return Math.max(0, n)
  })

  const sorted = [...themes].sort((a, b) => b.score - a.score)
  const best = sorted[0]
  const worst = sorted[sorted.length - 1]
  const praisePool = themeBank(shopType, 'praise')[best.key as (typeof THEME_KEYS)[number]]
  const complainPool = themeBank(shopType, 'complaint')[worst.key as (typeof THEME_KEYS)[number]]

  const topPraise = praisePool[Math.floor(rand() * praisePool.length)]
  const topComplaint = complainPool[Math.floor(rand() * complainPool.length)]

  // Sentiment = weighted star mean mapped 0–100
  const starMean =
    stars.reduce((a, n, i) => a + n * (i + 1), 0) / Math.max(1, stars.reduce((a, b) => a + b, 0))
  const sentiment = Math.round(clamp(((starMean - 1) / 4) * 100, 8, 98))

  // Recent 30d velocity
  const recentReviews = Math.max(2, Math.round(volume * (0.04 + rand() * 0.09)))

  return {
    rating,
    reviewCount: volume,
    recentReviews30d: recentReviews,
    sentiment,
    stars: {
      1: stars[0],
      2: stars[1],
      3: stars[2],
      4: stars[3],
      5: stars[4],
    },
    themes,
    topPraise,
    topComplaint,
    sourceLabel: 'Google-style review model',
    categoryHint: shopType.label,
    snippets: [],
    live: false,
  }
}

function themeScoresFromSnippets(snippets: ReviewSnippet[]): ReviewThemeScore[] {
  const blob = snippets.map((s) => s.text).join(' ').toLowerCase()
  const hit = (words: string[]) => words.reduce((n, w) => n + (blob.includes(w) ? 1 : 0), 0)
  const mk = (key: string, label: string, words: string[], base: number) => {
    const score = Number(clamp(base + hit(words) * 0.35, 2.2, 4.95).toFixed(2))
    return { key, label, score }
  }
  return [
    mk('service', 'Service', ['staff', 'service', 'helpful', 'rude', 'billing'], 3.4),
    mk('price', 'Price', ['price', 'cheap', 'expensive', 'costly', 'mrp', 'deal', 'discount'], 3.3),
    mk('quality', 'Quality', ['fresh', 'quality', 'expiry', 'genuine', 'brand'], 3.5),
    mk('wait', 'Wait', ['queue', 'wait', 'slow', 'fast', 'quick'], 3.4),
    mk('cleanliness', 'Cleanliness', ['clean', 'dirty', 'hygiene', 'smell'], 3.5),
    mk('assortment', 'Assortment', ['stock', 'variety', 'available', 'out of'], 3.4),
  ]
}

/**
 * Build profile from live Google Places rating + original review texts.
 */
export function profileFromPlaceReviews(input: {
  rating: number
  reviewCount: number
  snippets: ReviewSnippet[]
  shopType: ShopType
  live?: boolean
}): GoogleReviewProfile {
  const rating = Number(clamp(input.rating, 1, 5).toFixed(1))
  const volume = Math.max(input.reviewCount, input.snippets.length)
  const themes =
    input.snippets.length >= 2
      ? themeScoresFromSnippets(input.snippets)
      : THEME_KEYS.map((key) => ({
          key,
          label: key[0].toUpperCase() + key.slice(1),
          score: Number(clamp(3.2 + (rating - 3.8) * 0.5, 2.4, 4.8).toFixed(2)),
        }))

  const sorted = [...themes].sort((a, b) => b.score - a.score)
  const best = sorted[0]
  const worst = sorted[sorted.length - 1]

  const byRating = [...input.snippets].sort((a, b) => b.rating - a.rating)
  const praisePool = themeBank(input.shopType, 'praise')[best.key as (typeof THEME_KEYS)[number]]
  const complainPool = themeBank(input.shopType, 'complaint')[worst.key as (typeof THEME_KEYS)[number]]
  const topPraise =
    byRating.find((s) => s.rating >= 4)?.text.slice(0, 120) ||
    praisePool[0] ||
    'customers like the experience'
  const topComplaint =
    [...input.snippets].sort((a, b) => a.rating - b.rating).find((s) => s.rating <= 3)?.text.slice(0, 120) ||
    complainPool[0] ||
    'mixed feedback on peak-hour service'

  const avgSnippet =
    input.snippets.length > 0
      ? input.snippets.reduce((a, s) => a + s.rating, 0) / input.snippets.length
      : rating
  const sentiment = Math.round(clamp(((avgSnippet - 1) / 4) * 100, 8, 98))

  const stars = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  if (input.snippets.length) {
    input.snippets.forEach((s) => {
      const k = Math.min(5, Math.max(1, Math.round(s.rating))) as 1 | 2 | 3 | 4 | 5
      stars[k] += 1
    })
  } else {
    const tilt = Math.round(rating)
    stars[tilt as 1 | 2 | 3 | 4 | 5] = Math.max(1, Math.round(volume * 0.45))
    stars[5] += Math.max(0, Math.round(volume * 0.25))
    stars[4] += Math.max(0, Math.round(volume * 0.2))
  }

  return {
    rating,
    reviewCount: volume,
    recentReviews30d: Math.max(2, Math.round(volume * 0.06)),
    sentiment,
    stars,
    themes,
    topPraise,
    topComplaint,
    sourceLabel: input.live ? 'Google Places (live)' : 'Google-style review model',
    categoryHint: input.shopType.label,
    snippets: input.snippets,
    live: Boolean(input.live),
  }
}

export function enrichShopWithReviews(
  shop: CompetitorShop,
  shopType: ShopType,
  location: GeoPoint,
): CompetitorShop {
  const reviews = buildGoogleReviewProfile(shop, shopType, location)
  // Footfall proxy from review velocity + rating (log scale)
  const footfall = Math.round(
    28 + Math.log10(reviews.reviewCount + 10) * 55 + reviews.recentReviews30d * 1.8,
  )
  return {
    ...shop,
    rating: reviews.rating,
    estimatedFootfall: footfall,
    reviews,
    photoUrl: shop.photoUrl || shopFrontPhoto(shop, shopType),
  }
}

/**
 * Short COPY / BEAT lines from theme gaps — varied by shop type + SKU, not one generic script.
 */
export function buildRivalPlaybook(
  rival: GoogleReviewProfile,
  shopType?: ShopType,
  youBias: { service?: number; price?: number } = {},
): { copy: string[]; beat: string[]; scorecard: string } {
  const sorted = [...rival.themes].sort((a, b) => b.score - a.score)
  const strengths = sorted.slice(0, 2)
  const weaknesses = [...sorted].reverse().slice(0, 2)
  const id = shopType?.id || 'kirana'
  const skus = shopType?.stockSkus || ['hero SKUs']
  const a = skus[0]
  const b = skus[1] || skus[0]
  const praise = clipQuote(rival.topPraise, 36)
  const complain = clipQuote(rival.topComplaint, 36)

  const copyByTheme: Record<string, string> = {
    service:
      id === 'electronics'
        ? `Match their demo patience — “${praise}”.`
        : `Greet + advise like them — “${praise}”.`,
    assortment:
      id === 'electronics'
        ? `Keep ${a} + ${b} on the front glass like they do.`
        : `Front-shelf ${a} / ${b} the way they depth-stock.`,
    wait: id === 'electronics' ? `Express accessory billing in peak.` : `Second counter in evening rush.`,
    price:
      id === 'electronics'
        ? `Show EMI + UPI price on ${a} in big font.`
        : `Clear MRP tags on ${a} — no hidden add-ons.`,
    quality:
      id === 'electronics'
        ? `Hand sealed box + warranty before payment.`
        : `Show fresh date / sealed packs near door.`,
    cleanliness: `Keep billing desk as clean as their reviews expect.`,
  }

  const beatByTheme: Record<string, string> = {
    wait:
      id === 'electronics'
        ? `Token for repairs; skip queue for ${b}.`
        : `Open lane 2 at peak — beat their wait.`,
    price:
      id === 'electronics'
        ? `Price-match ${a}; post EMI board.`
        : `Beat ${a} / ${b} price vs them; pin tags.`,
    service:
      id === 'electronics'
        ? `Soft demo, no hard upsell — their reviews slip here.`
        : `Remember regulars by name — they lose on “${complain}”.`,
    assortment: `Stock ${a} when they go thin — steal the walk-in.`,
    quality:
      id === 'electronics'
        ? `Sealed + warranty guarantee; ask ★ after sale.`
        : `Fresher pack than them on ${a}; ask for a review.`,
    cleanliness: `Lit, clean window this week — easy ★ vs them.`,
  }

  const copy = strengths.map((t) => copyByTheme[t.key] || `Match their ${t.label.toLowerCase()} bar.`)
  const beat = weaknesses.map((t) => beatByTheme[t.key] || `Win on ${t.label.toLowerCase()} this week.`)

  if ((youBias.price || 0) > 0) {
    beat.push(id === 'electronics' ? `Board “match ${a} price” this week.` : `Price-match board for ${a}.`)
  }

  const scorecard = `★ ${rival.rating} · ${rival.reviewCount.toLocaleString()} ${
    rival.live ? 'Google' : 'model'
  } reviews · ${rival.recentReviews30d} in 30d`

  return { copy, beat, scorecard }
}

function clipQuote(text: string, max: number) {
  const t = text.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1).trim()}…`
}
