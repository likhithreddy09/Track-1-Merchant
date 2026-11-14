import type { DemographicSnapshot, CompetitorShop, InventoryListing } from '../types'

/** Compact precision strip under dashboard tabs */
export function InsightStrip({
  demo,
  competitors,
  listings,
}: {
  demo: DemographicSnapshot
  competitors: CompetitorShop[]
  listings: InventoryListing[]
}) {
  const bestBuy = [...listings]
    .filter((l) => l.type === 'surplus')
    .sort((a, b) => b.matchScore - a.matchScore)[0]
  const topRival = [...competitors].sort((a, b) => b.rating - a.rating || a.distanceKm - b.distanceKm)[0]
  const highDeals = listings.filter((l) => l.urgency === 'high').length

  return (
    <div className="insight-strip">
      <div>
        <label>Model conf</label>
        <b>
          {demo.modelConfidence}% · ±{demo.populationCi95.toLocaleString()}
        </b>
      </div>
      <div>
        <label>Households</label>
        <b>{demo.households.toLocaleString()}</b>
      </div>
      <div>
        <label>Top rival</label>
        <b title={topRival?.name}>
          {topRival ? `★${topRival.rating} · ${topRival.distanceKm} km` : '—'}
        </b>
      </div>
      <div>
        <label>Best buy</label>
        <b>{bestBuy ? `${bestBuy.matchScore}% · ${bestBuy.sku}` : '—'}</b>
      </div>
      <div>
        <label>High urgency</label>
        <b>
          {highDeals}/{listings.length} deals
        </b>
      </div>
    </div>
  )
}
