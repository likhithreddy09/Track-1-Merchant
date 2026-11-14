import type { AreaBuyingHabits, DemographicSnapshot, ShopType } from '../types'

export type SalesPhase = 'past' | 'today' | 'future'

export type SalesPoint = {
  key: string
  label: string
  /** Demand index 0–100 */
  index: number
  phase: SalesPhase
  /** Short reasons this slot is high/low */
  factors: string[]
}

export type SalesTimeline = {
  points: SalesPoint[]
  peakPast: SalesPoint
  peakFuture: SalesPoint
  peakHourLabel: string
  explain: string
  factorsUsed: { label: string; effect: string }[]
}

const PAST = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
const FUTURE = ['Mon+', 'Tue+', 'Wed+', 'Thu+', 'Fri+', 'Sat+', 'Sun+'] as const
const FUTURE_LABEL = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

function clamp(n: number, a = 28, b = 99) {
  return Math.max(a, Math.min(b, Math.round(n)))
}

function shopHourPeak(shopType: ShopType): { label: string; hours: string } {
  switch (shopType.id) {
    case 'electronics':
      return { label: 'Eve accessory rush', hours: '6–9 PM' }
    case 'food':
      return { label: 'Lunch + dinner', hours: '12–2 & 7–10 PM' }
    case 'pharma':
      return { label: 'Morning + eve refill', hours: '8–11 AM & 6–8 PM' }
    case 'garments':
      return { label: 'Weekend browse', hours: 'Sat–Sun 4–8 PM' }
    case 'stationery':
      return { label: 'After-school / exam', hours: '3–7 PM' }
    default:
      return { label: 'Evening essentials', hours: '6–9 PM' }
  }
}

/**
 * Past 7d + today + next 7d demand index shaped by habits, density, age mix, shop type.
 */
export function buildSalesTimeline(input: {
  seed: number
  shopType: ShopType
  habits: AreaBuyingHabits
  demo: DemographicSnapshot
}): SalesTimeline {
  const { seed, shopType, habits, demo } = input
  const hour = shopHourPeak(shopType)
  const weekendLift =
    8 +
    (habits.dominantTrait === 'offer' ? 6 : 0) +
    (shopType.id === 'electronics' || shopType.id === 'garments' ? 5 : 0)
  const weekdayEve =
    4 +
    (habits.convenienceSensitive > 48 ? 7 : 0) +
    (demo.workingAgePercent > 55 ? 6 : 0)
  const qualityPad = habits.qualitySensitive > 50 ? 4 : 0
  const densePad = demo.peoplePerKm2 > 12000 ? 5 : 0
  const kidPad = demo.childrenPercent > 25 && shopType.id !== 'pharma' ? 3 : 0

  const driverScore =
    habits.dominantTrait === 'price'
      ? habits.priceSensitive
      : habits.dominantTrait === 'offer'
        ? habits.offerSensitive
        : habits.dominantTrait === 'quality'
          ? habits.qualitySensitive
          : habits.convenienceSensitive

  const factorsUsed = [
    { label: 'Buyer driver', effect: `${habits.dominantTrait} leads at ${driverScore}/100` },
    { label: 'Catchment', effect: `${demo.workingAgePercent}% working-age · ${demo.densifyLabel}` },
    { label: 'Shop type', effect: `${shopType.label} · ${shopType.demandKeywords[0]}` },
    { label: 'Typical peak hour', effect: `${hour.hours} (${hour.label})` },
  ]

  function dayIndex(i: number, phase: SalesPhase): { index: number; factors: string[] } {
    const jitter = (((seed * 7919 + i * 31 + (phase === 'future' ? 17 : 3)) % 11) - 5) * 1.2
    const weekend = i >= 5
    const factors: string[] = []
    let n = 58 + jitter + densePad + qualityPad * 0.5

    if (weekend) {
      n += weekendLift + kidPad
      factors.push('Weekend footfall')
      if (habits.dominantTrait === 'offer') factors.push('Deal hunters')
      if (shopType.id === 'electronics') factors.push('Gadget browse')
    } else {
      n += weekdayEve * (i === 4 ? 1.15 : 0.55)
      if (i === 4) factors.push('Friday prep')
      if (demo.workingAgePercent > 55) factors.push('Office commute buyers')
      if (habits.convenienceSensitive >= habits.priceSensitive) factors.push('Speed / stock')
    }

    if (phase === 'future') {
      // Mild forward lift from stocking advice + seasonal keyword
      n += 3 + (habits.offerSensitive > 45 ? 2 : 0)
      factors.push('Stock-ahead plan')
      if (shopType.demandKeywords[0]) factors.push(shopType.demandKeywords[0])
    }
    if (phase === 'past' && i === 6) factors.push('Last Sun base')
    if (habits.qualitySensitive > 50 && weekend) factors.push('Trust / warranty ask')

    return { index: clamp(n), factors: factors.slice(0, 3) }
  }

  const past: SalesPoint[] = PAST.map((label, i) => {
    const { index, factors } = dayIndex(i, 'past')
    return { key: `p-${label}`, label, index, phase: 'past' as const, factors }
  })

  const todayJ = dayIndex(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1, 'today')
  const today: SalesPoint = {
    key: 'today',
    label: 'Today',
    index: clamp(todayJ.index + 2),
    phase: 'today',
    factors: [hour.label, hour.hours, ...todayJ.factors].slice(0, 3),
  }

  const future: SalesPoint[] = FUTURE.map((key, i) => {
    const { index, factors } = dayIndex(i, 'future')
    return {
      key,
      label: FUTURE_LABEL[i],
      index: clamp(index),
      phase: 'future' as const,
      factors,
    }
  })

  const points = [...past, today, ...future]
  const peakPast = past.reduce((a, b) => (b.index > a.index ? b : a))
  const peakFuture = future.reduce((a, b) => (b.index > a.index ? b : a))

  const explain = [
    `Past week peaked on ${peakPast.label} (index ${peakPast.index}) — mainly ${peakPast.factors.join(', ') || 'local footfall'}.`,
    `Next week looks strongest on ${peakFuture.label} (index ${peakFuture.index}).`,
    `Within a day, expect ${hour.hours} (${hour.label}) for ${shopType.label.toLowerCase()}.`,
    `Stock ${shopType.stockSkus[0]} and ${shopType.stockSkus[1]} before that window.`,
  ].join(' ')

  return {
    points,
    peakPast,
    peakFuture,
    peakHourLabel: hour.hours,
    explain,
    factorsUsed,
  }
}
