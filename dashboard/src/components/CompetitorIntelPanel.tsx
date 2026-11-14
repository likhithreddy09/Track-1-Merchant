import type { CompetitorIntel } from '../types'
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
                ? 'See why they win customers — and the one move you can make this week.'
                : `${emptyHint} Tap a pin to see their review gap and one move to beat them.`
            }
          />
        </div>
      </div>
    )
  }

  const { shop, moveNow, weakness, copyFromRival, beatRival, stealRisk, themeBars, peakHours } =
    intel
  const reviews = shop.reviews
  const rating = reviews?.rating ?? shop.rating
  const reviewCount = reviews?.reviewCount ?? 0
  const photo = shop.photoUrl || shopFrontPhoto(shop)
  const beat = beatRival[0]
  const copy = copyFromRival[0]
  const themes = themeBars?.length ? themeBars : reviews?.themes || []
  const theirEdge = [...themes].sort((a, b) => b.score - a.score)[0]
  const yourOpening = [...themes].sort((a, b) => a.score - b.score)[0]
  const risk = riskLabel(stealRisk)

  if (compact) {
    return (
      <div className="ra-float ra-float-premium ra-float-action" key={shop.id}>
        <div className="ra-float-top">
          <img className="ra-float-thumb" src={photo} alt="" loading="lazy" decoding="async" />
          <div className="ra-float-id">
            <div className="ra-float-row">
              <h3>{shop.name}</h3>
              <span className={`ra-threat ${shop.threat}`}>{shop.threat}</span>
            </div>
            <p>
              {shop.distanceKm} km · ★ {rating.toFixed(1)}
              {reviewCount ? ` · ${reviewCount.toLocaleString()} reviews` : ''}
            </p>
            {peakHours ? <p className="ra-float-peak">Peak {shortPeak(peakHours)}</p> : null}
          </div>
        </div>

        <div className="ra-float-body">
          <div className={`ra-float-risk ra-risk-${risk.level}`}>
            <div className="ra-float-risk-top">
              <em>Why this matters</em>
              <b>{stealRisk}%</b>
            </div>
            <div className="ra-float-risk-bar" aria-hidden="true">
              <i style={{ width: `${stealRisk}%` }} />
            </div>
            <p>{risk.line}</p>
          </div>

          <div className="ra-float-vs">
            <div className="they">
              <em>They win on</em>
              <strong>{theirEdge?.label || 'Trust'}</strong>
              <p>
                {reviews?.topPraise
                  ? `“${shorten(reviews.topPraise, 48)}”`
                  : 'Customers already prefer them here.'}
              </p>
            </div>
            <div className="you">
              <em>Your opening</em>
              <strong>{yourOpening?.label || 'Service'}</strong>
              <p>
                {reviews?.topComplaint
                  ? `“${shorten(reviews.topComplaint, 48)}”`
                  : shorten(weakness, 48)}
              </p>
            </div>
          </div>

          <div className="ra-float-ai">
            <em>This week’s move</em>
            <p>{shorten(moveNow || weakness, 100)}</p>
          </div>

          <div className="ra-float-moves ra-float-moves-split">
            {copy && (
              <div className="copy">
                <em>Copy</em>
                <p>{shorten(copy, 70)}</p>
              </div>
            )}
            {beat && (
              <div className="beat">
                <em>Beat</em>
                <p>{shorten(beat, 70)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const actions = [beatRival[0], copyFromRival[0], moveNow].filter(Boolean).slice(0, 3)
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
          <em>Customer steal risk</em>
          <p>{risk.line}</p>
        </div>
        <b>{stealRisk}%</b>
      </div>

      <div className="ra-float-vs ra-sheet-vs">
        <div className="they">
          <em>They win on</em>
          <strong>{theirEdge?.label || 'Trust'}</strong>
          <p>{reviews?.topPraise ? `“${shorten(reviews.topPraise, 70)}”` : '—'}</p>
        </div>
        <div className="you">
          <em>You can win on</em>
          <strong>{yourOpening?.label || 'Service'}</strong>
          <p>
            {reviews?.topComplaint ? `“${shorten(reviews.topComplaint, 70)}”` : shorten(weakness, 70)}
          </p>
        </div>
      </div>

      <div className="ra-ai">
        <em>This week’s move</em>
        <p>{shorten(moveNow, 140)}</p>
      </div>

      {reviews?.live && reviews.snippets && reviews.snippets.length > 0 ? (
        <div className="ra-reviews">
          <h4>What customers say</h4>
          <ul>
            {reviews.snippets.slice(0, 3).map((s) => (
              <li key={`${s.author}-${s.text.slice(0, 24)}`}>
                <b>
                  ★ {s.rating} · {s.author}
                </b>
                <span>{s.relativeTime}</span>
                <p>{shorten(s.text, 160)}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="ra-todo">
        <h4>Playbook</h4>
        <ol>
          {actions.map((line) => (
            <li key={line}>{shorten(line, 120)}</li>
          ))}
        </ol>
      </div>
    </div>
  )
}

function riskLabel(stealRisk: number): { level: 'high' | 'mid' | 'low'; line: string } {
  if (stealRisk >= 65) {
    return { level: 'high', line: 'High — they’re close enough to pull your regulars.' }
  }
  if (stealRisk >= 40) {
    return { level: 'mid', line: 'Watch — compete on one clear gap, not only price.' }
  }
  return { level: 'low', line: 'Manageable — push promo into underserved pockets.' }
}

function shortPeak(peak: string) {
  return peak.replace('Weekend noon', 'Wknd').slice(0, 10)
}

function shorten(text: string, max: number) {
  const t = text.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1).trim()}…`
}
