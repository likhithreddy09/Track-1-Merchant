import type { CompetitorIntel, ReviewThemeScore } from '../types'
import { shopFrontPhoto } from '../lib/shopPhotos'
import { EmptyState } from './EmptyState'

export function CompetitorIntelPanel({
  intel,
  emptyHint,
  compact = false,
}: {
  intel: CompetitorIntel | null
  emptyHint: string
  compact?: boolean
}) {
  if (!intel) {
    return (
      <div className={`ra-card ${compact ? 'ra-float ra-float-action' : ''}`}>
        <div className="ra-empty">
          <EmptyState
            title={compact ? 'Tap a rival pin' : 'No rival selected'}
            body={
              compact
                ? 'One gap. One move for this week.'
                : `${emptyHint} Tap a pin for a short gap + move.`
            }
          />
        </div>
      </div>
    )
  }

  const { shop, moveNow, weakness, stealRisk, themeBars, peakHours } = intel
  const reviews = shop.reviews
  const rating = reviews?.rating ?? shop.rating
  const reviewCount = reviews?.reviewCount ?? 0
  const photo = shop.photoUrl || shopFrontPhoto(shop)
  const themes = themeBars?.length ? themeBars : reviews?.themes || []
  const theirEdge = [...themes].sort((a, b) => b.score - a.score)[0]
  const yourOpening = [...themes].sort((a, b) => a.score - b.score)[0]
  const risk = riskLabel(stealRisk, shop.distanceKm, shop.name)

  if (compact) {
    return (
      <div className="ra-float ra-float-premium ra-float-action ra-float-tight" key={shop.id}>
        <div className="ra-float-top">
          <img className="ra-float-thumb" src={photo} alt="" loading="lazy" decoding="async" />
          <div className="ra-float-id">
            <div className="ra-float-row">
              <h3>{shop.name}</h3>
              <span className={`ra-threat ${shop.threat}`}>{shop.threat}</span>
            </div>
            <p>
              {shop.distanceKm} km · ★ {rating.toFixed(1)}
              {reviewCount ? ` · ${reviewCount.toLocaleString()}` : ''}
              {peakHours ? ` · ${shortPeak(peakHours)}` : ''}
            </p>
          </div>
        </div>

        <div className="ra-float-body">
          <div className={`ra-float-risk ra-risk-${risk.level}`}>
            <div className="ra-float-risk-top">
              <em>Steal risk</em>
              <b>{stealRisk}%</b>
            </div>
            <div className="ra-float-risk-bar" aria-hidden="true">
              <i style={{ width: `${stealRisk}%` }} />
            </div>
            <p>{risk.line}</p>
          </div>

          <div className="ra-float-vs">
            <div className="they">
              <em>They win</em>
              <strong>{theirEdge?.label || 'Trust'}</strong>
              <p>
                {reviews?.topPraise
                  ? `“${shorten(reviews.topPraise, 42)}”`
                  : 'Customers prefer them here.'}
              </p>
            </div>
            <div className="you">
              <em>Your gap</em>
              <strong>{yourOpening?.label || 'Service'}</strong>
              <p>
                {reviews?.topComplaint
                  ? `“${shorten(reviews.topComplaint, 42)}”`
                  : shorten(weakness, 42)}
              </p>
            </div>
          </div>

          <RivalFacts intel={intel} themes={themes} />

          <div className="ra-float-ai">
            <em>Do this week</em>
            <p>{shorten(moveNow, 140)}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="ra-card ra-card-rich" key={shop.id}>
      <div className="ra-hero">
        <img src={photo} alt="" loading="lazy" />
        <div className="ra-hero-fade">
          <span className={`ra-threat ${shop.threat}`}>{shop.threat} threat</span>
          <div className="ra-hero-meta">
            <strong>{shop.name}</strong>
            <em>
              {shop.distanceKm} km · ★ {rating} · {reviewCount.toLocaleString()} reviews
            </em>
          </div>
        </div>
      </div>

      <div className={`ra-sheet-risk ra-risk-${risk.level}`}>
        <div>
          <em>Steal risk</em>
          <p>{risk.line}</p>
        </div>
        <b>{stealRisk}%</b>
      </div>

      <div className="ra-float-vs ra-sheet-vs">
        <div className="they">
          <em>They win</em>
          <strong>{theirEdge?.label || 'Trust'}</strong>
          <p>{reviews?.topPraise ? `“${shorten(reviews.topPraise, 56)}”` : '—'}</p>
        </div>
        <div className="you">
          <em>Your gap</em>
          <strong>{yourOpening?.label || 'Service'}</strong>
          <p>
            {reviews?.topComplaint ? `“${shorten(reviews.topComplaint, 56)}”` : shorten(weakness, 56)}
          </p>
        </div>
      </div>

      <div className="rv-sheet-facts">
        <RivalFacts intel={intel} themes={themes} />
      </div>

      <div className="ra-ai">
        <em>Do this week</em>
        <p>{shorten(moveNow, 160)}</p>
      </div>

      {reviews?.live && reviews.snippets && reviews.snippets.length > 0 ? (
        <div className="ra-reviews">
          <h4>What customers say</h4>
          <ul>
            {reviews.snippets.slice(0, 2).map((s) => (
              <li key={`${s.author}-${s.text.slice(0, 24)}`}>
                <b>
                  ★ {s.rating} · {s.author}
                </b>
                <span>{s.relativeTime}</span>
                <p>{shorten(s.text, 120)}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

function RivalFacts({ intel, themes }: { intel: CompetitorIntel; themes: ReviewThemeScore[] }) {
  const { shop, pricePressure, overlapScore } = intel
  const reviews = shop.reviews
  const ranked = [...themes].sort((a, b) => b.score - a.score)
  const pros = ranked.filter((t) => t.score >= 3.8).slice(0, 2)
  const cons = [...ranked].reverse().filter((t) => t.score < 3.8).slice(0, 2)

  const stats = [
    { label: 'Footfall', value: `~${shop.estimatedFootfall}/day` },
    { label: 'Shared buyers', value: `${overlapScore}%` },
    { label: 'Price pressure', value: `${pricePressure}%` },
    { label: 'New reviews', value: reviews ? `${reviews.recentReviews30d} / 30d` : '—' },
  ]

  return (
    <div className="rv-facts">
      <div className="rv-facts-stats">
        {stats.map((s) => (
          <div key={s.label}>
            <b>{s.value}</b>
            <em>{s.label}</em>
          </div>
        ))}
      </div>
      <div className="rv-facts-pc">
        <div className="pro">
          <em>Their pros</em>
          <ul>
            {(pros.length ? pros : ranked.slice(0, 1)).map((t) => (
              <li key={t.key}>
                {t.label} <span>{(Math.floor(t.score * 10) / 10).toFixed(1)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="con">
          <em>Their cons</em>
          <ul>
            {(cons.length ? cons : ranked.slice(-1)).map((t) => (
              <li key={t.key}>
                {t.label} <span>{(Math.floor(t.score * 10) / 10).toFixed(1)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function riskLabel(
  stealRisk: number,
  km: number,
  name: string,
): { level: 'high' | 'mid' | 'low'; line: string } {
  const short = name.split(/[\s,/]+/)[0]
  if (stealRisk >= 65) {
    return {
      level: 'high',
      line: `${short} at ${km} km can pull your regulars.`,
    }
  }
  if (stealRisk >= 40) {
    return {
      level: 'mid',
      line: `Close enough to watch — win on one gap vs ${short}.`,
    }
  }
  return {
    level: 'low',
    line: `${short} is farther — push promo into empty pockets.`,
  }
}

function shortPeak(peak: string) {
  return peak.replace('Weekend noon', 'Wknd').slice(0, 10)
}

function shorten(text: string, max: number) {
  const t = text.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1).trim()}…`
}
