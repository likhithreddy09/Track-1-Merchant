import type { DemographicSnapshot, ShopType, TargetSegment } from '../types'
export { buildDemographics, enrichDemographicsFromMap, nextLivePulse } from './catchmentStats'

export function buildTargetSegments(
  shopType: ShopType,
  demo: DemographicSnapshot,
): TargetSegment[] {
  const byLabel = Object.fromEntries(demo.ageBuckets.map((b) => [b.label, b]))

  const scoreAge = (labels: string[]) =>
    labels.reduce((acc, l) => acc + (byLabel[l]?.percent || 0), 0)

  const hhShare = Math.min(94, Math.round((demo.households / Math.max(demo.totalPeople, 1)) * 100 + 42))
  const segments: TargetSegment[] = []

  if (shopType.id === 'kirana') {
    segments.push(
      {
        title: 'Household grocery buyers',
        share: hhShare,
        why: `${demo.households.toLocaleString()} HH (μ ${demo.householdSize}) in 0.5–2 km gravity · dens ${demo.peoplePerKm2.toLocaleString()}/km².`,
        opportunity: 'high',
      },
      {
        title: 'Working adults 25–44',
        share: Math.round(scoreAge(['25–34', '35–44'])),
        why: `P(25–44|catchment) ≈ ${scoreAge(['25–34', '35–44']).toFixed(1)}% · ~${Math.round((scoreAge(['25–34', '35–44']) / 100) * demo.totalPeople).toLocaleString()} people · evening basket peak.`,
        opportunity: scoreAge(['25–34', '35–44']) > 28 ? 'high' : 'medium',
      },
      {
        title: 'Family with kids',
        share: Math.round(demo.childrenPercent + 8),
        why: `Kids ${demo.childrenPercent}% (~${Math.round((demo.childrenPercent / 100) * demo.totalPeople).toLocaleString()} ppl) → snack/dairy attach high.`,
        opportunity: demo.childrenPercent > 18 ? 'high' : 'medium',
      },
    )
  } else if (shopType.id === 'garments') {
    const young = scoreAge(['18–24', '25–34'])
    const pro = scoreAge(['25–34', '35–44'])
    segments.push(
      {
        title: 'Young fashion buyers 18–34',
        share: Math.round(young),
        why:
          young > 28
            ? `Strong fashion cohort · ~${Math.round((young / 100) * demo.totalPeople).toLocaleString()} people 18–34.`
            : `Moderate youth dens · lean value fashion for ~${Math.round((young / 100) * demo.totalPeople).toLocaleString()} people.`,
        opportunity: young > 28 ? 'high' : 'medium',
      },
      {
        title: 'Working professionals',
        share: Math.round(pro),
        why: `Office + smart casual · ~${Math.round((pro / 100) * demo.totalPeople).toLocaleString()} in 25–44 band.`,
        opportunity: 'high',
      },
      {
        title: 'Kids 2–4 / early childhood',
        share: Math.round((byLabel['0–4']?.percent || 5) * 1.4),
        why:
          (byLabel['0–4']?.percent || 0) < 7
            ? `Toddler share ${byLabel['0–4']?.percent || 0}% — avoid overstocking kidswear.`
            : `Toddler share ${byLabel['0–4']?.percent || 0}% — keep a curated kids line.`,
        opportunity: (byLabel['0–4']?.percent || 0) < 7 ? 'low' : 'medium',
      },
    )
  } else if (shopType.id === 'pharma') {
    segments.push(
      {
        title: 'Families & caregivers',
        share: Math.round(55 + demo.childrenPercent / 2),
        why: `OTC + first-aid · ${demo.households.toLocaleString()} HH catchment + kids ${demo.childrenPercent}%.`,
        opportunity: 'high',
      },
      {
        title: 'Seniors 60+',
        share: Math.round(demo.seniorsPercent),
        why: `~${Math.round((demo.seniorsPercent / 100) * demo.totalPeople).toLocaleString()} seniors · chronic refill + trust repeats.`,
        opportunity: demo.seniorsPercent > 11 ? 'high' : 'medium',
      },
      {
        title: 'Working adults',
        share: Math.round(demo.workingAgePercent * 0.45),
        why: `Working-age ${demo.workingAgePercent}% · vitamins + seasonal illness spikes.`,
        opportunity: 'medium',
      },
    )
  } else {
    segments.push(
      {
        title: shopType.targetSegments[0] || 'Primary buyers',
        share: Math.round(30 + scoreAge(shopType.targetAges.map(mapAgeLabel)) * 0.5),
        why: `${demo.densifyLabel} · ${demo.households.toLocaleString()} HH · aligned to ${shopType.label.toLowerCase()}.`,
        opportunity: 'high',
      },
      {
        title: shopType.targetSegments[1] || 'Secondary buyers',
        share: Math.round(18 + demo.workingAgePercent * 0.25),
        why: `Working-age ${demo.workingAgePercent}% · promo-led secondary catchment.`,
        opportunity: 'medium',
      },
      {
        title: shopType.targetSegments[2] || 'Occasional buyers',
        share: Math.round(12 + demo.childrenPercent * 0.3),
        why: `Weekend / festive spillover · pulse ~${demo.livePulse} moving now.`,
        opportunity: 'medium',
      },
    )
  }

  return segments.slice(0, 3)
}

function mapAgeLabel(label: string): string {
  if (label.includes('18–34')) return '25–34'
  if (label.includes('25–44')) return '35–44'
  if (label.includes('45–60')) return '45–60'
  if (label.includes('60')) return '60+'
  if (label.includes('5–17')) return '5–17'
  return '25–34'
}
