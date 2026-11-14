import { useEffect, useMemo, useState } from 'react'
import type {
  AreaBuyingHabits,
  CompetitorIntel,
  CompetitorShop,
  CompetitorSource,
  DemographicSnapshot,
  InventoryListing,
  PlaceInfo,
  ShopType,
  TargetSegment,
  GeoPoint,
  AiInsight,
} from '../types'
import { loadCompetitors } from '../lib/competitors'
import {
  buildDemographics,
  buildTargetSegments,
  enrichDemographicsFromMap,
  nextLivePulse,
} from '../lib/demographics'
import { buildAiInsights, buildCompetitorIntel, buildInventoryListings } from '../lib/aiEngine'
import { MapPanel } from './MapPanel'
import { CompetitorIntelPanel } from './CompetitorIntelPanel'
import { AiAssistant } from './AiAssistant'
import { InventoryExchange } from './InventoryExchange'
import { PaytmBrand } from './PaytmBrand'
import { weekDemandIndex } from '../lib/dayDemand'
import { seedFromPoint } from '../lib/geo'
import { BottomSheet } from './BottomSheet'
import { AgeMixCharts } from './AgeMixCharts'
import { PaytmBootScreen } from './PaytmIsolator'
import { AreaHabitsPanel } from './AreaHabitsPanel'
import { analyzeAreaBuyingHabits } from '../lib/buyingHabits'

type Tab = 'home' | 'map' | 'stock'

export function Dashboard({
  location,
  place,
  shopType,
  shopName,
  onReset,
}: {
  location: GeoPoint
  place: PlaceInfo
  shopType: ShopType
  shopName: string
  onReset: () => void
}) {
  const [tab, setTab] = useState<Tab>('map')
  const [loading, setLoading] = useState(true)
  const [loadLabel, setLoadLabel] = useState('Pinning your shop…')
  const [source, setSource] = useState<CompetitorSource>('simulated')
  const [competitors, setCompetitors] = useState<CompetitorShop[]>([])
  const [demo, setDemo] = useState<DemographicSnapshot>(() => buildDemographics(location, place))
  const [segments, setSegments] = useState<TargetSegment[]>([])
  const [insights, setInsights] = useState<AiInsight[]>([])
  const [listings, setListings] = useState<InventoryListing[]>([])
  const [activeShop, setActiveShop] = useState<CompetitorShop | null>(null)
  const [rivalSheet, setRivalSheet] = useState(false)
  const [habits, setHabits] = useState<AreaBuyingHabits | null>(null)
  const [habitsLoading, setHabitsLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    const started = performance.now()
    const MIN_BOOT_MS = 1600

    async function boot() {
      setLoading(true)
      setLoadLabel('Pinning your shop…')
      setCompetitors([])
      setActiveShop(null)
      setRivalSheet(false)
      setHabits(null)
      setHabitsLoading(false)

      const baseDemo = buildDemographics(location, place)
      if (cancelled) return
      setDemo(baseDemo)
      setLoadLabel('Counting people nearby…')

      const demographics = await enrichDemographicsFromMap(location, place)
      if (cancelled) return
      setDemo(demographics)
      setLoadLabel('Finding shops on your street…')

      const { shops, source: src } = await loadCompetitors(location, shopType)
      if (cancelled) return

      setLoadLabel('Checking stock & deals…')
      const segs = buildTargetSegments(shopType, demographics)
      const nextInsights = buildAiInsights({
        shopType,
        place,
        demo: demographics,
        competitors: shops,
        segments: segs,
        location,
      })
      const nextListings = buildInventoryListings({
        shopType,
        competitors: shops,
        location,
        demo: demographics,
      })

      setCompetitors(shops)
      setSource(src)
      setSegments(segs)
      setInsights(nextInsights)
      setListings(nextListings)
      setLoadLabel('Understanding local buyers…')
      setHabitsLoading(true)

      const wait = Math.max(0, MIN_BOOT_MS - (performance.now() - started))
      window.setTimeout(() => {
        if (!cancelled) setLoading(false)
      }, wait)

      void analyzeAreaBuyingHabits({
        competitors: shops,
        demo: demographics,
        place,
        shopType,
        shopName,
      }).then((h) => {
        if (!cancelled) {
          setHabits(h)
          setHabitsLoading(false)
        }
      })
    }
    boot()
    return () => {
      cancelled = true
    }
  }, [location, place, shopType, shopName])

  useEffect(() => {
    const id = window.setInterval(() => {
      setDemo((prev) => ({
        ...prev,
        // Same pin + same 5-min window → same pulse (no random drift)
        livePulse: nextLivePulse(prev.livePulse, prev.totalPeople, location),
      }))
    }, 5000)
    return () => window.clearInterval(id)
  }, [location])

  const intel: CompetitorIntel | null = useMemo(() => {
    if (!activeShop) return null
    return buildCompetitorIntel(activeShop, shopType, demo, location)
  }, [activeShop, shopType, demo, location])

  const highThreat = competitors.filter((c) => c.threat === 'high').length
  const week = weekDemandIndex(seedFromPoint(location, shopType.id))
  const peak = week.reduce((a, d) => (d.index > a.index ? d : a))
  const rivals = useMemo(
    () =>
      [...competitors]
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 5),
    [competitors],
  )
  const topSegment = segments[0]

  function go(next: Tab) {
    setTab(next)
    setRivalSheet(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function selectRival(shop: CompetitorShop | null) {
    setActiveShop(shop)
    if (!shop) return
    if (window.matchMedia('(max-width: 900px)').matches) {
      setRivalSheet(true)
    } else {
      setTab('map')
    }
  }

  if (loading) {
    return (
      <PaytmBootScreen
        shopName={shopName}
        shopLabel={shopType.label}
        place={`${place.neighbourhood}, ${place.city}`}
        progressLabel={loadLabel}
      />
    )
  }

  return (
    <div className={`nq ${tab === 'map' ? 'nq-map-mode' : ''}`}>
      <header className="nq-top">
        <div className="nq-top-inner">
          <PaytmBrand product={place.neighbourhood} onHome={() => go('home')} />
          <div className="nq-top-right">
            <div className="nq-shop">
              <strong>{shopName}</strong>
              <span>
                {place.neighbourhood} · {shopType.label}
              </span>
            </div>
            <button type="button" className="nq-ghost" onClick={onReset}>
              Setup
            </button>
          </div>
        </div>
      </header>

      <div className="nq-tabs-wrap">
        <nav className="nq-tabs" aria-label="Sections">
          <button type="button" className={tab === 'home' ? 'on' : ''} onClick={() => go('home')}>
            Overview
          </button>
          <button type="button" className={tab === 'map' ? 'on' : ''} onClick={() => go('map')}>
            Map
          </button>
          <button type="button" className={tab === 'stock' ? 'on' : ''} onClick={() => go('stock')}>
            Inventory
            <em>EDI</em>
          </button>
        </nav>
      </div>

      <main className="nq-main">
        {tab === 'home' && (
          <div className="nq-home">
            <p className="nq-lead">
              {shopName} · people nearby, rivals on your street, and Cover EDI from idle stock.
            </p>

            <button type="button" className="nq-edi-strip" onClick={() => go('stock')}>
              <span className="nq-edi-strip-badge">Start here</span>
              <strong>Cover today’s Paytm EDI</strong>
              <span>Sell idle stock → cash pays the daily cut</span>
            </button>

            <section className="nq-metrics" aria-label="Key numbers">
              <div className="nq-metric">
                <label>People nearby</label>
                <b>{demo.totalPeople.toLocaleString()}</b>
                <span>within 2 km</span>
              </div>
              <div className="nq-metric">
                <label>Households</label>
                <b>{demo.households.toLocaleString()}</b>
                <span>avg {demo.householdSize} / home</span>
              </div>
              <div className="nq-metric">
                <label>Rivals</label>
                <b>{competitors.length}</b>
                <span>{highThreat} close threats</span>
              </div>
              <div className="nq-metric">
                <label>Stock deals</label>
                <b>{listings.length}</b>
                <span>
                  <button type="button" className="nq-text-btn" onClick={() => go('stock')}>
                    Open Cover EDI
                  </button>
                </span>
              </div>
            </section>

            <div className="nq-home-body">
              <div className="nq-home-main">
                <div className="nq-two">
                  <section className="nq-panel">
                    <header className="nq-panel-hd">
                      <h3>Closest rivals</h3>
                      <button type="button" className="nq-text-btn" onClick={() => go('map')}>
                        Open map
                      </button>
                    </header>
                    <ul className="nq-list">
                      {rivals.map((shop) => (
                        <li key={shop.id}>
                          <button type="button" onClick={() => selectRival(shop)}>
                            <span>
                              <strong>{shop.name}</strong>
                              <em>
                                {shop.distanceKm} km · {shop.threat}
                              </em>
                            </span>
                            <b>★ {shop.rating}</b>
                          </button>
                        </li>
                      ))}
                      {!loading && !rivals.length && (
                        <li className="nq-empty nq-empty-cta">
                          <strong>No rivals found yet</strong>
                          <p>Map is still loading shops around you — or OSM is thin here.</p>
                          <button type="button" className="nq-text-btn" onClick={() => go('map')}>
                            Open map next →
                          </button>
                        </li>
                      )}
                    </ul>
                  </section>

                  <section className="nq-panel">
                    <header className="nq-panel-hd">
                      <h3>This week</h3>
                      <span>Peak {peak.day}</span>
                    </header>
                    <div className="nq-week">
                      {week.map((d) => (
                        <div key={d.day} className={d.day === peak.day ? 'peak' : ''}>
                          <i style={{ height: `${d.index * 0.55}px` }} />
                          <span>{d.day}</span>
                        </div>
                      ))}
                    </div>
                    {topSegment && (
                      <div className="nq-seg">
                        <label>Best customers</label>
                        <strong>{topSegment.title}</strong>
                        <p>{topSegment.why}</p>
                      </div>
                    )}
                  </section>
                </div>

                <AreaHabitsPanel
                  habits={habits}
                  loading={habitsLoading}
                  shopType={shopType}
                  demo={demo}
                  location={location}
                />
              </div>

              <aside className="nq-panel nq-age nq-age-rail" aria-label="Who lives nearby">
                <header className="nq-panel-hd">
                  <h3>Who lives nearby</h3>
                  <span>{demo.densifyLabel}</span>
                </header>
                <AgeMixCharts demo={demo} />
              </aside>
            </div>
          </div>
        )}

        {tab === 'map' && (
          <div className="nq-map-bleed">
            <MapPanel
              center={location}
              competitors={competitors}
              loading={loading}
              source={source}
              activeId={activeShop?.id ?? null}
              onSelect={(shop) => {
                setActiveShop(shop)
                if (shop && window.matchMedia('(max-width: 900px)').matches) setRivalSheet(true)
              }}
              floatSlot={
                <CompetitorIntelPanel
                  compact
                  intel={intel}
                  emptyHint="Tap a pin to see steal risk, their weak spot, and one move."
                />
              }
            />
          </div>
        )}

        {tab === 'stock' && (
          <div className="nq-stock">
            <InventoryExchange
              listings={listings}
              shopName={shopName}
              shopType={shopType}
              place={place}
              location={location}
              nearbyShopNames={competitors.slice(0, 8).map((c) => c.name)}
            />
          </div>
        )}
      </main>

      <nav className="nq-bottom" aria-label="Mobile tabs">
        <button type="button" className={tab === 'home' ? 'on' : ''} onClick={() => go('home')}>
          <i>⌂</i>
          Overview
        </button>
        <button type="button" className={tab === 'map' ? 'on' : ''} onClick={() => go('map')}>
          <i>◎</i>
          Map
        </button>
        <button type="button" className={tab === 'stock' ? 'on' : ''} onClick={() => go('stock')}>
          <i>↔</i>
          EDI
        </button>
      </nav>

      <BottomSheet
        open={rivalSheet && !!intel}
        title={activeShop?.name || 'Rival'}
        onClose={() => setRivalSheet(false)}
        tall
      >
        <CompetitorIntelPanel intel={intel} emptyHint="Select a rival." />
      </BottomSheet>

      <AiAssistant
        shopType={shopType}
        place={place}
        demo={demo}
        competitors={competitors}
        insights={insights}
        shopName={shopName}
      />
    </div>
  )
}
