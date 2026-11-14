import { useMemo } from 'react'
import type { ShopType } from '../types'
import { mulberry32, seedFromPoint } from '../lib/geo'
import type { GeoPoint } from '../types'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function WeekForecast({
  shopType,
  location,
}: {
  shopType: ShopType
  location: GeoPoint
}) {
  const bars = useMemo(() => {
    const rand = mulberry32(seedFromPoint(location, `${shopType.id}-week`))
    return DAYS.map((day, i) => {
      const weekendBoost = i >= 5 ? 0.25 : 0
      const v = 0.42 + rand() * 0.4 + weekendBoost
      return { day, value: Math.min(1, v), label: Math.round(4500 + v * 9000) }
    })
  }, [shopType.id, location])

  const peak = bars.reduce((a, b) => (b.value > a.value ? b : a))

  return (
    <div className="card">
      <div className="card-hd">
        <h3>7-day demand forecast</h3>
        <span className="pill">AI outlook</span>
      </div>
      <div className="card-bd">
        <div className="week-chart">
          {bars.map((b) => (
            <div key={b.day} className={`week-col ${b.day === peak.day ? 'peak' : ''}`}>
              <div className="week-val">₹{(b.label / 1000).toFixed(1)}k</div>
              <div className="week-bar-track">
                <div className="week-bar" style={{ height: `${Math.round(b.value * 100)}%` }} />
              </div>
              <div className="week-day">{b.day}</div>
            </div>
          ))}
        </div>
        <p className="week-note">
          Peak looks like <strong>{peak.day}</strong> for {shopType.demandKeywords[0]}. Stock{' '}
          {shopType.stockSkus[0]} ahead of that window.
        </p>
      </div>
    </div>
  )
}
