import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { InventoryListing, PlaceInfo, ShopType, GeoPoint } from '../types'
import {
  buildDemandPockets,
  detectAgeingStock,
  matchMerchantStock,
  motiveLabel,
  unlockRupees,
  type DetectedShelfRisk,
  type MerchantStockDraft,
  type StockMatchSuggestion,
} from '../lib/localDemand'
import { EmptyState } from './EmptyState'
import { productImage, shopImage } from '../lib/productPhotos'

const MOTIVES: MerchantStockDraft['motive'][] = ['expiring', 'slow', 'overstock', 'season_end']

type Flow = 'clear' | 'market' | 'emi'
type Step = 1 | 2 | 3

/** Demo daily EDI from idle shelf value — Paytm merchant loans repay daily from settlements */
function estimateDailyEdi(idleRupees: number) {
  return Math.max(350, Math.round((idleRupees * 0.045) / 10) * 10)
}

function ediDaysCovered(unlock: number, dailyEdi: number) {
  if (dailyEdi <= 0) return 0
  return Math.max(1, Math.floor(unlock / dailyEdi))
}

function shortWhy(d: { daysToExpiry: number | null; daysNotSelling: number; motive?: string }) {
  if (d.daysToExpiry != null && d.daysToExpiry <= 14) return `Expires in ${d.daysToExpiry} days`
  if (d.motive === 'season_end') return `Season end · ${d.daysNotSelling} days sitting`
  if (d.daysNotSelling >= 20) return `No sale for ${d.daysNotSelling} days`
  return `Sitting ${d.daysNotSelling} days`
}

function shortenLine(text: string, max: number) {
  const t = text.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1).trim()}…`
}

/** Live order map: shelf scan → street radar → packets flying → cash unlock */
function StockMoveStage({
  mode,
  shopName,
  sku,
  buyers,
  activeBuyer,
  unlock,
  moving,
  done,
}: {
  mode: 'shelf' | 'radar' | 'route' | 'market'
  shopName: string
  sku?: string
  buyers: { label: string; km: number }[]
  activeBuyer?: string | null
  unlock?: number
  moving?: boolean
  done?: boolean
}) {
  const pins = buyers.slice(0, 5)
  const title =
    mode === 'shelf'
      ? 'Scanning your shelf…'
      : mode === 'radar'
        ? `Mapping buyers for ${sku || 'stock'}…`
        : mode === 'market'
          ? 'Street deals lighting up…'
          : done
            ? 'Stock on the move · cash unlocked'
            : moving
              ? 'Dispatching stock along the street…'
              : 'Trade route ready'

  return (
    <div className={`ix-stage ix-stage-${mode} ${moving ? 'moving' : ''} ${done ? 'done' : ''}`}>
      <div className="ix-stage-hd">
        <span className="ix-stage-live">Live orders</span>
        <strong>{title}</strong>
      </div>

      <div className="ix-map" aria-hidden="true">
        <div className="ix-map-grid" />
        <div className="ix-radar" />
        <div className="ix-radar delay" />

        <div className="ix-pin you">
          <b />
          <em>{shopName.split(' ')[0]}</em>
        </div>

        {mode === 'shelf' && (
          <div className="ix-shelf-scan">
            <i />
            <i />
            <i />
          </div>
        )}

        {pins.map((p, i) => (
          <div
            key={p.label}
            className={`ix-pin buyer b${i} ${activeBuyer === p.label ? 'hot' : ''}`}
            style={{ ['--i' as string]: i }}
          >
            <b />
            <em>{p.label.split(' ')[0]}</em>
            <span>{p.km} km</span>
          </div>
        ))}

        {(mode === 'radar' || mode === 'route') &&
          pins.slice(0, 3).map((p, i) => (
            <div
              key={`pkt-${p.label}`}
              className={`ix-packet p${i} ${activeBuyer === p.label || mode === 'radar' ? 'fly' : ''}`}
              style={{ ['--i' as string]: i }}
            >
              <i />
            </div>
          ))}

        {(mode === 'radar' || mode === 'route') && (
          <svg className="ix-beams" viewBox="0 0 100 56" preserveAspectRatio="none">
            <path className="ix-beam" d="M50 40 C 35 32, 22 24, 18 18" />
            <path className="ix-beam d1" d="M50 40 C 55 28, 70 20, 82 16" />
            <path className="ix-beam d2" d="M50 40 C 60 36, 78 34, 88 30" />
          </svg>
        )}

        {done && unlock != null && (
          <div className="ix-cash-burst">
            <strong>₹{unlock.toLocaleString('en-IN')}</strong>
            <span>unlocked</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function InventoryExchange({
  listings,
  shopName,
  shopType,
  place,
  location,
  nearbyShopNames,
}: {
  listings: InventoryListing[]
  shopName: string
  shopType: ShopType
  place: PlaceInfo
  location: GeoPoint
  nearbyShopNames: string[]
}) {
  const [flow, setFlow] = useState<Flow>('emi')
  const [step, setStep] = useState<Step>(1)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [picked, setPicked] = useState<MerchantStockDraft | null>(null)
  const [buyer, setBuyer] = useState<StockMatchSuggestion | null>(null)
  const [suggestions, setSuggestions] = useState<StockMatchSuggestion[]>([])
  const [sku, setSku] = useState(shopType.stockSkus[0] || '')
  const [qty, setQty] = useState(12)
  const [unitPrice, setUnitPrice] = useState(45)
  const [daysToExpiry, setDaysToExpiry] = useState('14')
  const [daysNotSelling, setDaysNotSelling] = useState(18)
  const [motive, setMotive] = useState<MerchantStockDraft['motive']>('slow')
  const [marketDeal, setMarketDeal] = useState<InventoryListing | null>(null)

  const pockets = useMemo(
    () => buildDemandPockets(location, place, shopType),
    [location, place, shopType],
  )
  const detected = useMemo(
    () => detectAgeingStock(location, shopType, shopName).slice(0, 6),
    [location, shopType, shopName],
  )
  const nearbyKey = nearbyShopNames.join('|')
  const riskValue = useMemo(
    () => detected.reduce((sum, d) => sum + d.qty * d.unitPrice, 0),
    [detected],
  )
  const potentialUnlock = useMemo(() => {
    if (!detected.length) return 0
    return detected.reduce((sum, d) => {
      const shelf = d.qty * d.unitPrice
      const urgency =
        d.motive === 'expiring' || (d.daysToExpiry != null && d.daysToExpiry <= 10)
          ? 'high'
          : d.daysNotSelling >= 25
            ? 'medium'
            : 'low'
      return sum + unlockRupees(shelf, 78, urgency)
    }, 0)
  }, [detected])
  const dailyEdi = useMemo(() => estimateDailyEdi(riskValue || 12000), [riskValue])
  const emiCoverDays = useMemo(
    () => ediDaysCovered(potentialUnlock || unlockRupees(riskValue || 12000, 78, 'medium'), dailyEdi),
    [potentialUnlock, riskValue, dailyEdi],
  )
  const sellFlow = flow === 'clear' || flow === 'emi'
  const shelfItems = useMemo(() => {
    if (flow !== 'emi') return detected
    return [...detected].sort((a, b) => {
      const ua = unlockRupees(a.qty * a.unitPrice, 78, 'high')
      const ub = unlockRupees(b.qty * b.unitPrice, 78, 'high')
      return ub - ua
    })
  }, [detected, flow])

  function pickBuyers(draft: MerchantStockDraft) {
    const names = nearbyKey ? nearbyKey.split('|') : nearbyShopNames
    const all = matchMerchantStock({ draft, pockets, nearbyShopNames: names, shopName })
    const shops = all.filter((s) => s.pocketKind === 'shop')
    const rest = all.filter((s) => s.pocketKind !== 'shop')
    return [...shops, ...rest].slice(0, 5)
  }

  useEffect(() => {
    setPicked(null)
    setBuyer(null)
    setSuggestions([])
    setStep(1)
    setSent(false)
  }, [detected, nearbyKey, shopName])

  const buy = useMemo(() => listings.filter((l) => l.type === 'surplus'), [listings])
  const sell = useMemo(() => listings.filter((l) => l.type === 'shortage'), [listings])
  const marketCards = useMemo(() => [...buy, ...sell].slice(0, 8), [buy, sell])

  function selectStock(draft: MerchantStockDraft | DetectedShelfRisk) {
    const next: MerchantStockDraft = {
      sku: draft.sku,
      qty: draft.qty,
      unitPrice: draft.unitPrice,
      daysToExpiry: draft.daysToExpiry,
      daysNotSelling: draft.daysNotSelling,
      motive: draft.motive,
    }
    setPicked(next)
    setBuyer(null)
    setSuggestions(pickBuyers(next))
    setStep(2)
    setSent(false)
  }

  function selectBuyer(s: StockMatchSuggestion) {
    setBuyer(s)
    setStep(3)
    setSent(false)
  }

  function sendOffer() {
    setBusy(true)
    window.setTimeout(() => {
      setBusy(false)
      setSent(true)
    }, 1600)
  }

  function resetFlow() {
    setPicked(null)
    setBuyer(null)
    setSuggestions([])
    setStep(1)
    setSent(false)
    setMarketDeal(null)
    setBusy(false)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const expiry = daysToExpiry.trim() === '' ? null : Number(daysToExpiry)
    selectStock({
      sku: sku.trim(),
      qty,
      unitPrice,
      daysToExpiry: expiry != null && !Number.isNaN(expiry) ? expiry : null,
      daysNotSelling,
      motive,
    })
    setFormOpen(false)
  }

  function switchFlow(next: Flow) {
    setFlow(next)
    resetFlow()
    setFormOpen(false)
  }

  function selectMarketDeal(l: InventoryListing) {
    setMarketDeal(l)
    setStep(2)
    setSent(false)
  }

  const stageBuyers = useMemo(() => {
    if (suggestions.length) {
      return suggestions.map((s) => ({ label: s.buyerLabel, km: s.distanceKm }))
    }
    if (nearbyShopNames.length) {
      return nearbyShopNames.slice(0, 5).map((n, i) => ({
        label: n,
        km: Number((0.3 + i * 0.35).toFixed(2)),
      }))
    }
    return [
      { label: 'Local Mart', km: 0.4 },
      { label: 'City Store', km: 0.8 },
      { label: 'Neighbour Shop', km: 1.1 },
    ]
  }, [suggestions, nearbyShopNames])

  const stageMode =
    flow === 'market'
      ? 'market'
      : step === 1
        ? 'shelf'
        : step === 2
          ? 'radar'
          : 'route'

  const unlockNow =
    picked && buyer
      ? unlockRupees(picked.qty * picked.unitPrice, buyer.matchScore, buyer.urgency)
      : potentialUnlock
  const coverNow = ediDaysCovered(unlockNow, dailyEdi)

  return (
    <div className="wf ix-desk ix-wow">
      <header className="wf-hd">
        <div>
          <h2>Inventory</h2>
          <p>
            {place.neighbourhood} · ₹{riskValue.toLocaleString('en-IN')} idle · ₹
            {potentialUnlock.toLocaleString('en-IN')} can unlock
          </p>
        </div>
        {sent && <span className="wf-toast">{flow === 'emi' ? 'EDI covered' : 'Offer sent'}</span>}
      </header>

      <div className="ix-layout">
        <div className="ix-main">
      <aside className="ix-edi-attention" aria-label="Paytm EDI payment">
        <div className="ix-edi-attention-top">
          <span className="ix-edi-badge">Attention · Paytm EDI</span>
          <span className="ix-edi-due">Due today</span>
        </div>
        <div className="ix-edi-attention-grid">
          <div>
            <em>Daily EDI cut</em>
            <strong>₹{dailyEdi.toLocaleString('en-IN')}</strong>
          </div>
          <div>
            <em>Idle stock value</em>
            <strong>₹{riskValue.toLocaleString('en-IN')}</strong>
          </div>
          <div>
            <em>Sell now → cover</em>
            <strong className="ix-edi-cover">~{emiCoverDays} days</strong>
          </div>
        </div>
        <p className="ix-edi-flow">
          <b>Demo flow:</b> Pick stock → match a nearby buyer → confirm sale → cash covers today’s EDI
          before settlement.
        </p>
        {flow !== 'emi' && (
          <button type="button" className="ix-edi-cta" onClick={() => switchFlow('emi')}>
            Open Cover EDI
          </button>
        )}
      </aside>

      <div
        className={`ix-cash-bar ${flow === 'emi' ? 'ix-cash-bar-emi' : ''}`}
        aria-label={flow === 'emi' ? 'EDI coverage' : 'Cash impact'}
      >
        {flow === 'emi' ? (
          <>
            <div>
              <em>Today’s EDI</em>
              <strong>₹{dailyEdi.toLocaleString('en-IN')}</strong>
            </div>
            <div>
              <em>This sale can cover</em>
              <strong className="ix-unlock">~{emiCoverDays} days</strong>
            </div>
            <div>
              <em>Unlockable cash</em>
              <strong className="ix-unlock">₹{potentialUnlock.toLocaleString('en-IN')}</strong>
            </div>
            <p>Sell before settlement. Cash from the deal pays the daily EDI cut.</p>
          </>
        ) : (
          <>
            <div>
              <em>Cash locked</em>
              <strong>₹{riskValue.toLocaleString('en-IN')}</strong>
            </div>
            <div>
              <em>Can unlock</em>
              <strong className="ix-unlock">₹{potentialUnlock.toLocaleString('en-IN')}</strong>
            </div>
            <p>Pick an item — nearby buyers show on the right.</p>
          </>
        )}
      </div>

      <div className="wf-modes" role="tablist" aria-label="Inventory flow">
        <button
          type="button"
          role="tab"
          aria-selected={flow === 'emi'}
          className={`wf-mode-emi ${flow === 'emi' ? 'on' : ''}`}
          onClick={() => switchFlow('emi')}
        >
          <b>1</b>
          <span className="wf-mode-title">Cover EDI</span>
          <em>Sell stock · pay today’s cut</em>
          <i className="wf-mode-tag">Try this</i>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={flow === 'clear'}
          className={flow === 'clear' ? 'on' : ''}
          onClick={() => switchFlow('clear')}
        >
          <b>2</b>
          <span className="wf-mode-title">Move slow stock</span>
          <em>Shelf → nearby shops</em>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={flow === 'market'}
          className={flow === 'market' ? 'on' : ''}
          onClick={() => switchFlow('market')}
        >
          <b>3</b>
          <span className="wf-mode-title">Street deals</span>
          <em>Buy surplus nearby</em>
        </button>
      </div>

      <ol className="wf-rail" aria-label="Steps">
        {(sellFlow
          ? flow === 'emi'
            ? [
                { n: 1 as Step, label: 'Choose stock', hint: 'Highest unlock' },
                { n: 2 as Step, label: 'Match buyer', hint: 'Nearby shops' },
                { n: 3 as Step, label: 'Raise cash', hint: 'Cover EDI' },
              ]
            : [
                { n: 1 as Step, label: 'Scan shelf', hint: 'Ageing SKUs' },
                { n: 2 as Step, label: 'Map buyers', hint: 'Street radar' },
                { n: 3 as Step, label: 'Move stock', hint: 'Unlock ₹' },
              ]
          : [
              { n: 1 as Step, label: 'Browse deals', hint: 'Street market' },
              { n: 2 as Step, label: 'Review route', hint: 'One deal' },
              { n: 3 as Step, label: 'Confirm', hint: 'Dispatch' },
            ]
        ).map((s, i, arr) => (
          <li key={s.n} className={step === s.n ? 'on' : step > s.n ? 'done' : ''}>
            <button
              type="button"
              disabled={s.n > step}
              onClick={() => {
                if (s.n < step) setStep(s.n)
              }}
            >
              <span className="wf-num">{step > s.n ? '✓' : s.n}</span>
              <span>
                <strong>{s.label}</strong>
                <em>{s.hint}</em>
              </span>
            </button>
            {i < arr.length - 1 && <i className="wf-arrow" aria-hidden="true" />}
          </li>
        ))}
      </ol>

      {sellFlow && (
        <div className="wf-board">
          {step === 1 && (
            <section className="wf-pane">
              <header className="wf-pane-hd">
                <div>
                  <h3>{flow === 'emi' ? 'Sell this to cover EDI' : 'Ageing stock on your shelf'}</h3>
                  <p>
                    {flow === 'emi'
                      ? 'Highest unlock first. One sale can cover today’s EDI.'
                      : 'Pick an item to find nearby buyers.'}
                  </p>
                </div>
                <button type="button" className="wf-link" onClick={() => setFormOpen((v) => !v)}>
                  {formOpen ? 'Cancel' : '+ Add item'}
                </button>
              </header>

              {formOpen && (
                <form className="wf-form" onSubmit={onSubmit}>
                  <label>
                    Item
                    <input value={sku} onChange={(e) => setSku(e.target.value)} required list="wf-skus" />
                    <datalist id="wf-skus">
                      {shopType.stockSkus.map((s) => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                  </label>
                  <label>
                    Qty
                    <input
                      type="number"
                      min={1}
                      value={qty}
                      onChange={(e) => setQty(Number(e.target.value))}
                    />
                  </label>
                  <label>
                    Unit ₹
                    <input
                      type="number"
                      min={1}
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(Number(e.target.value))}
                    />
                  </label>
                  <label>
                    Days left
                    <input value={daysToExpiry} onChange={(e) => setDaysToExpiry(e.target.value)} />
                  </label>
                  <label>
                    Unsold
                    <input
                      type="number"
                      min={0}
                      value={daysNotSelling}
                      onChange={(e) => setDaysNotSelling(Number(e.target.value))}
                    />
                  </label>
                  <label>
                    Why
                    <select
                      value={motive}
                      onChange={(e) => setMotive(e.target.value as MerchantStockDraft['motive'])}
                    >
                      {MOTIVES.map((m) => (
                        <option key={m} value={m}>
                          {motiveLabel(m)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className="btn btn-primary" type="submit">
                    {flow === 'emi' ? 'Find buyers' : 'Map buyers'}
                  </button>
                </form>
              )}

              {shelfItems.length === 0 ? (
                <div className="ix-empty">
                  <EmptyState
                    title={flow === 'emi' ? 'No stock to sell yet' : 'No ageing stock flagged'}
                    body={
                      flow === 'emi'
                        ? 'Add an item to raise cash for today’s EDI.'
                        : 'Add an item above, or browse street deals to buy surplus / fill shortages.'
                    }
                    actionLabel={flow === 'emi' ? 'Add item' : 'Browse street deals'}
                    onAction={() => (flow === 'emi' ? setFormOpen(true) : switchFlow('market'))}
                  />
                </div>
              ) : (
                <ul className="ix-list">
                  {shelfItems.map((item) => {
                    const value = item.qty * item.unitPrice
                    const urgency =
                      item.motive === 'expiring' ||
                      (item.daysToExpiry != null && item.daysToExpiry <= 10)
                        ? 'high'
                        : item.daysNotSelling >= 25
                          ? 'medium'
                          : 'low'
                    const unlock = unlockRupees(value, 78, urgency)
                    const days = ediDaysCovered(unlock, dailyEdi)
                    return (
                      <li key={item.id || item.sku} className="ix-row">
                        <img
                          className="ix-thumb"
                          src={productImage(item.sku, shopType.id)}
                          alt=""
                          loading="lazy"
                        />
                        <div className="ix-body">
                          <div className="ix-top">
                            <strong>{item.sku}</strong>
                            <span className="ix-pill warn">{item.riskLabel || shortWhy(item)}</span>
                          </div>
                          <div className="ix-meta">
                            <span>{item.qty} pcs</span>
                            <span>₹{item.unitPrice}/unit</span>
                            <span className="ix-money">
                              ₹{unlock.toLocaleString('en-IN')} unlock
                            </span>
                            {flow === 'emi' && (
                              <span>
                                ~{days} EDI day{days === 1 ? '' : 's'}
                              </span>
                            )}
                          </div>
                          <p>{shortWhy(item)}</p>
                        </div>
                        <button
                          type="button"
                          className="btn btn-primary ix-cta"
                          onClick={() => selectStock(item)}
                        >
                          {flow === 'emi' ? 'Sell to cover' : 'Find buyers'}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )}

          {step === 2 && picked && (
            <section className="wf-pane">
              <header className="wf-pane-hd">
                <div>
                  <h3>Buyers on your street</h3>
                  <p>
                    {picked.sku} · {picked.qty} pcs · ₹
                    {(picked.qty * picked.unitPrice).toLocaleString('en-IN')} — ranked by fit &
                    distance
                    {flow === 'emi' ? ' · EDI cover shown for each offer' : ''}
                  </p>
                </div>
                <button type="button" className="wf-link" onClick={() => setStep(1)}>
                  Back
                </button>
              </header>

              {suggestions.length === 0 ? (
                <div className="ix-empty">
                  <EmptyState
                    title="No buyers for this SKU yet"
                    body="Try another ageing item, or check street deals for surplus nearby."
                    actionLabel="Pick another item"
                    onAction={() => setStep(1)}
                  />
                </div>
              ) : (
                <ul className="ix-list">
                  {suggestions.map((b, i) => {
                    const shelf = picked.qty * picked.unitPrice
                    const unlock = unlockRupees(shelf, b.matchScore, b.urgency)
                    return (
                      <li key={`${b.buyerLabel}-${i}`} className="ix-row buyer">
                        <img
                          className="ix-thumb"
                          src={shopImage(b.buyerLabel, shopType.id)}
                          alt=""
                          loading="lazy"
                        />
                        <div className="ix-body">
                          <div className="ix-top">
                            <strong>{b.buyerLabel}</strong>
                            <span className={`ix-pill urg-${b.urgency}`}>{b.urgency} need</span>
                          </div>
                          <div className="ix-meta">
                            <span className="ix-money">
                              ₹{unlock.toLocaleString('en-IN')} unlock
                            </span>
                            {flow === 'emi' && (
                              <span>~{ediDaysCovered(unlock, dailyEdi)} EDI days</span>
                            )}
                            <span>{b.matchScore}% fit</span>
                            <span>{b.distanceKm} km</span>
                          </div>
                          <p>{shortenLine(b.reason, 110)}</p>
                        </div>
                        <button
                          type="button"
                          className="btn btn-primary ix-cta"
                          onClick={() => selectBuyer(b)}
                        >
                          Select · ₹{unlock.toLocaleString('en-IN')}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )}

          {step === 3 && picked && buyer && (
            <section className="wf-pane">
              <header className="wf-pane-hd">
                <div>
                  <h3>
                    {sent
                      ? flow === 'emi'
                        ? 'Cash ready for EDI'
                        : 'Stock dispatched'
                      : 'Confirm stock move'}
                  </h3>
                  <p>
                    {shopName} → {buyer.buyerLabel} · {buyer.distanceKm} km
                  </p>
                </div>
                {!sent && (
                  <button type="button" className="wf-link" onClick={() => setStep(2)}>
                    Back
                  </button>
                )}
              </header>

              <div className="ix-summary">
                <div>
                  <em>You sell</em>
                  <strong>{picked.sku}</strong>
                  <span>
                    {picked.qty} pcs · ₹{(picked.qty * picked.unitPrice).toLocaleString('en-IN')} locked
                  </span>
                </div>
                <b className={busy || sent ? 'ix-arrow-run' : ''} aria-hidden="true">
                  →
                </b>
                <div>
                  <em>They take</em>
                  <strong>{buyer.buyerLabel}</strong>
                  <span>
                    {buyer.distanceKm} km · {buyer.matchScore}% fit
                  </span>
                </div>
              </div>

              <div className={`ix-unlock-banner ${sent ? 'pop' : ''}`}>
                {flow === 'emi' ? (
                  <>
                    <b>₹{unlockNow.toLocaleString('en-IN')}</b> unlocked · covers ~
                    {coverNow} EDI days at ₹{dailyEdi.toLocaleString('en-IN')}/day
                  </>
                ) : (
                  <>
                    Est. cash unlocked: <b>₹{unlockNow.toLocaleString('en-IN')}</b>
                  </>
                )}
              </div>

              <div className="wf-actions">
                {!sent ? (
                  <button
                    type="button"
                    className="btn btn-primary wf-send"
                    disabled={busy}
                    onClick={sendOffer}
                  >
                    {busy
                      ? 'Moving stock…'
                      : flow === 'emi'
                        ? `Confirm sale · ~${coverNow} EDI days`
                        : `Dispatch · unlock ₹${unlockNow.toLocaleString('en-IN')}`}
                  </button>
                ) : (
                  <button type="button" className="btn btn-primary" onClick={resetFlow}>
                    {flow === 'emi' ? 'Sell another item' : 'Move more stock'}
                  </button>
                )}
                <button type="button" className="wf-ghost" onClick={resetFlow}>
                  Start over
                </button>
              </div>
            </section>
          )}
        </div>
      )}

      {flow === 'market' && (
        <div className="wf-board">
          {step === 1 && (
            <section className="wf-pane">
              <header className="wf-pane-hd">
                <div>
                  <h3>Street deals nearby</h3>
                  <p>Buy surplus or fill shortages from shops around you.</p>
                </div>
              </header>

              {marketCards.length === 0 ? (
                <div className="ix-empty">
                  <EmptyState
                    title="No street deals right now"
                    body="Clear your own slow stock instead — free cash locked on your shelf."
                    actionLabel="Move slow stock"
                    onAction={() => switchFlow('clear')}
                  />
                </div>
              ) : (
                <ul className="ix-list">
                  {marketCards.map((l) => {
                    const dealValue = l.qty * l.unitPrice
                    const unlock = unlockRupees(dealValue, l.matchScore, l.urgency)
                    return (
                      <li key={l.id || `${l.sku}-${l.shopName}`} className="ix-row">
                        <img
                          className="ix-thumb"
                          src={
                            l.type === 'surplus'
                              ? productImage(l.sku, shopType.id)
                              : shopImage(l.shopName, shopType.id)
                          }
                          alt=""
                          loading="lazy"
                        />
                        <div className="ix-body">
                          <div className="ix-top">
                            <strong>{l.sku}</strong>
                            <span className={`ix-pill ${l.type === 'surplus' ? 'buy' : 'sell'}`}>
                              {l.type === 'surplus' ? 'Buy surplus' : 'Fill shortage'}
                            </span>
                          </div>
                          <div className="ix-meta">
                            <span>{l.shopName}</span>
                            <span>{l.qty} pcs</span>
                            <span>₹{l.unitPrice}/unit</span>
                            <span>{l.distanceKm} km</span>
                            <span className="ix-money">
                              {l.type === 'surplus' ? 'Save' : 'Earn'} ~₹
                              {unlock.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <p>{shortenLine(l.reason, 110)}</p>
                        </div>
                        <button
                          type="button"
                          className="btn btn-primary ix-cta"
                          onClick={() => selectMarketDeal(l)}
                        >
                          {l.type === 'surplus' ? 'Review buy' : 'Review sell'}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )}

          {step >= 2 && marketDeal && (
            <section className="wf-pane">
              <header className="wf-pane-hd">
                <div>
                  <h3>{step === 2 ? 'Review deal route' : sent ? 'Deal confirmed' : 'Confirm trade'}</h3>
                  <p>
                    {marketDeal.type === 'surplus' ? 'You buy from' : 'You sell to'}{' '}
                    {marketDeal.shopName}
                  </p>
                </div>
                <button
                  type="button"
                  className="wf-link"
                  onClick={() => {
                    setMarketDeal(null)
                    setStep(1)
                    setSent(false)
                  }}
                >
                  Back
                </button>
              </header>

              <div className="ix-summary">
                <div>
                  <em>Item</em>
                  <strong>{marketDeal.sku}</strong>
                  <span>
                    {marketDeal.qty} pcs · ₹
                    {(marketDeal.qty * marketDeal.unitPrice).toLocaleString('en-IN')}
                  </span>
                </div>
                <b className={busy || sent ? 'ix-arrow-run' : ''} aria-hidden="true">
                  →
                </b>
                <div>
                  <em>Shop</em>
                  <strong>{marketDeal.shopName}</strong>
                  <span>{marketDeal.distanceKm} km</span>
                </div>
              </div>

              <div className="wf-actions">
                {step === 2 && (
                  <button type="button" className="btn btn-primary" onClick={() => setStep(3)}>
                    Continue
                  </button>
                )}
                {step === 3 && !sent && (
                  <button
                    type="button"
                    className="btn btn-primary wf-send"
                    disabled={busy}
                    onClick={sendOffer}
                  >
                    {busy ? 'Moving on map…' : 'Confirm & dispatch'}
                  </button>
                )}
                {sent && (
                  <button type="button" className="btn btn-primary" onClick={resetFlow}>
                    Browse more deals
                  </button>
                )}
              </div>
            </section>
          )}
        </div>
      )}
        </div>

        <aside className="ix-stage-rail" aria-label="Live stock orders">
          <StockMoveStage
            mode={stageMode}
            shopName={shopName}
            sku={picked?.sku || marketDeal?.sku}
            buyers={
              marketDeal
                ? [
                    { label: marketDeal.shopName, km: marketDeal.distanceKm },
                    ...stageBuyers.slice(0, 3),
                  ]
                : stageBuyers
            }
            activeBuyer={buyer?.buyerLabel || marketDeal?.shopName}
            unlock={unlockNow}
            moving={busy}
            done={sent}
          />
          <p className="ix-stage-hint">
            {flow === 'emi'
              ? picked
                ? `~${coverNow} EDI days at ₹${dailyEdi.toLocaleString('en-IN')}/day`
                : 'Pick stock — orders animate to nearby buyers.'
              : picked || marketDeal
                ? 'Selecting items updates this live order map.'
                : 'Select a SKU or street deal to light up buyers.'}
          </p>
        </aside>
      </div>
    </div>
  )
}
