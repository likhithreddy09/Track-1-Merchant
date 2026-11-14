import { useMemo, useState } from 'react'
import type { AreaBuyingHabits, DemographicSnapshot, GeoPoint, ShopType } from '../types'
import { seedFromPoint } from '../lib/geo'
import { buildSalesTimeline, type SalesPoint } from '../lib/salesTimeline'

const DRIVERS: {
  key: keyof Pick<
    AreaBuyingHabits,
    'priceSensitive' | 'offerSensitive' | 'qualitySensitive' | 'convenienceSensitive'
  >
  trait: AreaBuyingHabits['dominantTrait']
  label: string
  means: string
}[] = [
  {
    key: 'priceSensitive',
    trait: 'price',
    label: 'Price',
    means: 'Buyers compare MRP / EMI and walk if it feels high.',
  },
  {
    key: 'offerSensitive',
    trait: 'offer',
    label: 'Offers',
    means: 'Combos, cashback, and festival deals move the needle.',
  },
  {
    key: 'qualitySensitive',
    trait: 'quality',
    label: 'Quality',
    means: 'Trust, sealed stock, warranty, and clear specs win.',
  },
  {
    key: 'convenienceSensitive',
    trait: 'convenience',
    label: 'Convenience',
    means: 'Speed, stock availability, and nearby access matter most.',
  },
]

function traitScore(h: AreaBuyingHabits, t: AreaBuyingHabits['dominantTrait']) {
  if (t === 'price') return h.priceSensitive
  if (t === 'offer') return h.offerSensitive
  if (t === 'quality') return h.qualitySensitive
  return h.convenienceSensitive
}

function PeakSalesChart({
  points,
  peakPast,
  peakFuture,
}: {
  points: SalesPoint[]
  peakPast: SalesPoint
  peakFuture: SalesPoint
}) {
  const [hover, setHover] = useState<string | null>(null)
  const w = 560
  const h = 168
  const padL = 28
  const padR = 12
  const padT = 18
  const padB = 28
  const max = Math.max(...points.map((p) => p.index), 1)
  const min = Math.min(...points.map((p) => p.index), 0)
  const span = Math.max(12, max - min)
  const n = points.length

  const xy = (i: number, index: number) => {
    const x = padL + (i / Math.max(1, n - 1)) * (w - padL - padR)
    const y = padT + (1 - (index - min) / span) * (h - padT - padB)
    return { x, y }
  }

  const line = points
    .map((p, i) => {
      const { x, y } = xy(i, p.index)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const area = `${line} L${xy(n - 1, min).x.toFixed(1)},${(h - padB).toFixed(1)} L${padL},${(h - padB).toFixed(1)} Z`
  const todayIdx = points.findIndex((p) => p.phase === 'today')
  const todayX = todayIdx >= 0 ? xy(todayIdx, points[todayIdx].index).x : null
  const active = points.find((p) => p.key === hover) || null

  return (
    <div className="nq-peak-chart">
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Past and future peak sales demand">
        <defs>
          <linearGradient id="nqPeakFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00baf2" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#00baf2" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((t) => {
          const y = padT + (1 - t) * (h - padT - padB)
          return (
            <line
              key={t}
              x1={padL}
              x2={w - padR}
              y1={y}
              y2={y}
              stroke="#e8eef5"
              strokeWidth="1"
            />
          )
        })}
        {todayX != null && (
          <line
            x1={todayX}
            x2={todayX}
            y1={padT - 4}
            y2={h - padB}
            stroke="#002970"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
        )}
        <path d={area} fill="url(#nqPeakFill)" />
        <path d={line} fill="none" stroke="#00baf2" strokeWidth="2.4" strokeLinejoin="round" />
        {points.map((p, i) => {
          const { x, y } = xy(i, p.index)
          const isPeak = p.key === peakPast.key || p.key === peakFuture.key
          const isToday = p.phase === 'today'
          return (
            <g key={p.key}>
              <circle
                cx={x}
                cy={y}
                r={isToday ? 5.5 : isPeak ? 4.5 : 3}
                fill={isToday ? '#002970' : isPeak ? '#00baf2' : '#fff'}
                stroke={isToday ? '#002970' : '#00baf2'}
                strokeWidth="2"
                onMouseEnter={() => setHover(p.key)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: 'pointer' }}
              />
              {(i === 0 || i === todayIdx || i === n - 1 || i % 3 === 0) && (
                <text
                  x={x}
                  y={h - 8}
                  textAnchor="middle"
                  fill="#9ca3af"
                  fontSize="10"
                  fontWeight="600"
                >
                  {p.label}
                </text>
              )}
            </g>
          )
        })}
        {todayX != null && (
          <text x={todayX + 6} y={padT + 2} fill="#002970" fontSize="10" fontWeight="800">
            Now
          </text>
        )}
      </svg>
      <div className="nq-peak-legend">
        <span>
          <i className="past" /> Past 7 days
        </span>
        <span>
          <i className="now" /> Today
        </span>
        <span>
          <i className="future" /> Next 7 days
        </span>
      </div>
      {active && (
        <p className="nq-peak-tip">
          <strong>
            {active.phase === 'future' ? 'Next' : active.phase === 'past' ? 'Past' : ''} {active.label}
          </strong>{' '}
          · index {active.index}
          {active.factors.length ? ` · ${active.factors.join(' · ')}` : ''}
        </p>
      )}
    </div>
  )
}

export function AreaHabitsPanel({
  habits,
  loading,
  shopType,
  demo,
  location,
}: {
  habits: AreaBuyingHabits | null
  loading?: boolean
  shopType: ShopType
  demo: DemographicSnapshot
  location: GeoPoint
}) {
  const timeline = useMemo(() => {
    if (!habits) return null
    return buildSalesTimeline({
      seed: seedFromPoint(location, `${shopType.id}-sales`),
      shopType,
      habits,
      demo,
    })
  }, [habits, shopType, demo, location])

  if (loading && !habits) {
    return (
      <section className="nq-panel nq-habits">
        <header className="nq-panel-hd">
          <h3>Area buying habits</h3>
          <span>Sarvam deciding…</span>
        </header>
        <p className="nq-habits-wait">Scoring price, offers, quality, convenience — then peak sales windows…</p>
      </section>
    )
  }

  if (!habits || !timeline) return null

  const live = habits.reviewSource === 'google_live'
  const total =
    habits.priceSensitive +
    habits.offerSensitive +
    habits.qualitySensitive +
    habits.convenienceSensitive
  const leader = DRIVERS.find((d) => d.trait === habits.dominantTrait) || DRIVERS[0]
  const leadScore = traitScore(habits, habits.dominantTrait)

  return (
    <section className="nq-panel nq-habits nq-habits-rich">
      <header className="nq-panel-hd">
        <h3>Area buying habits</h3>
        <span className={live ? 'nq-pill live' : 'nq-pill'}>
          {live ? 'Google reviews + Sarvam' : 'Sarvam on local signals'}
        </span>
      </header>

      <div className="nq-habits-hero">
        <div>
          <em>Top driver</em>
          <strong>
            {leader.label} · {leadScore}/100
          </strong>
          <p>
            {habits.summary} In plain words: {leader.means} For your {shopType.label.toLowerCase()}, lean into{' '}
            {shopType.targetSegments[0].toLowerCase()} and keep {shopType.stockSkus[0]} ready.
          </p>
        </div>
        <div className="nq-habits-statgrid">
          <div>
            <em>Peak day (past)</em>
            <b>{timeline.peakPast.label}</b>
            <span>index {timeline.peakPast.index}</span>
          </div>
          <div>
            <em>Peak day (next)</em>
            <b>{timeline.peakFuture.label}</b>
            <span>index {timeline.peakFuture.index}</span>
          </div>
          <div>
            <em>Peak hours</em>
            <b>{timeline.peakHourLabel}</b>
            <span>{shopType.demandKeywords[0]}</span>
          </div>
        </div>
      </div>

      <div className="nq-habits-split">
        <div>
          <h4 className="nq-habits-sub">What buyers care about</h4>
          <p className="nq-habits-help">
            Scores are 0–100 from local review themes + catchment mix. Highlighted bar = strongest signal.
          </p>
          <div className="nq-habit-bars nq-habit-bars-rich">
            {DRIVERS.map((b) => {
              const n = habits[b.key]
              const share = total ? Math.round((n / total) * 100) : 0
              const on = habits.dominantTrait === b.trait
              return (
                <div key={b.key} className={on ? 'on' : ''}>
                  <div className="nq-habit-lab">
                    <em>
                      {b.label}
                      {on ? ' · leads' : ''}
                    </em>
                    <b>
                      {n}
                      <small>{share}% weight</small>
                    </b>
                  </div>
                  <i style={{ width: `${n}%` }} />
                  <p>{b.means}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <h4 className="nq-habits-sub">Peak sales · past → future</h4>
          <p className="nq-habits-help">
            Demand index by day. Dashed line = today. Peaks shift with weekends, working-age density, offers, and{' '}
            {shopType.label.toLowerCase()} patterns.
          </p>
          <PeakSalesChart
            points={timeline.points}
            peakPast={timeline.peakPast}
            peakFuture={timeline.peakFuture}
          />
          <ul className="nq-peak-factors">
            {timeline.factorsUsed.map((f) => (
              <li key={f.label}>
                <strong>{f.label}</strong>
                <span>{f.effect}</span>
              </li>
            ))}
          </ul>
          <p className="nq-peak-explain">{timeline.explain}</p>
        </div>
      </div>

      <div className="nq-habits-decision">
        <em>What to do this week</em>
        <strong>{habits.decision}</strong>
        <ol>
          {habits.actions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ol>
      </div>

      <ul className="nq-habits-evidence">
        {habits.evidence.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
    </section>
  )
}
