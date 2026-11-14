import { useEffect, useMemo, useState, type ReactNode } from 'react'
import L from 'leaflet'
import { Circle, MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet'
import type { CompetitorShop, CompetitorSource, GeoPoint } from '../types'
import { shopFrontPhoto } from '../lib/shopPhotos'
import 'leaflet/dist/leaflet.css'

/**
 * Key-free basemaps only (Carto now watermarks “API KEY REQUIRED”).
 * Streets ≈ Google look · Radar = dark intel · Satellite = imagery.
 */
const TILES = {
  streets: [
    {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      maxZoom: 19,
    },
    {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      maxZoom: 19,
    },
  ],
  radar: [
    {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      maxZoom: 16,
    },
    {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
      maxZoom: 16,
    },
  ],
  satellite: [
    {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      maxZoom: 19,
    },
  ],
} as const

type MapStyle = keyof typeof TILES

function FlyTo({ center, ready }: { center: GeoPoint; ready: boolean }) {
  const map = useMap()
  useEffect(() => {
    if (!ready) return
    map.flyTo([center.lat, center.lng], 15, { animate: true, duration: 1 })
  }, [center.lat, center.lng, map, ready])
  return null
}

function FitWhenReady({
  center,
  shops,
  ready,
}: {
  center: GeoPoint
  shops: CompetitorShop[]
  ready: boolean
}) {
  const map = useMap()
  useEffect(() => {
    if (!ready || shops.length < 2) return
    const bounds = L.latLngBounds([
      [center.lat, center.lng],
      ...shops.map((s) => [s.lat, s.lng] as [number, number]),
    ])
    map.fitBounds(bounds.pad(0.3), { animate: true, duration: 0.85, maxZoom: 16 })
  }, [center.lat, center.lng, ready, map, shops.length])
  return null
}

function CustomZoom() {
  const map = useMap()
  return (
    <div className="lq-zoom">
      <button type="button" onClick={() => map.zoomIn()} aria-label="Zoom in">
        +
      </button>
      <button type="button" onClick={() => map.zoomOut()} aria-label="Zoom out">
        −
      </button>
    </div>
  )
}

function SafeTiles({ style }: { style: MapStyle }) {
  const [idx, setIdx] = useState(0)
  const stack = TILES[style]
  const layer = stack[Math.min(idx, stack.length - 1)]
  return (
    <TileLayer
      key={`${style}-${idx}`}
      url={layer.url}
      maxZoom={layer.maxZoom}
      attribution='© Esri'
      eventHandlers={{
        tileerror: () => setIdx((i) => (i < stack.length - 1 ? i + 1 : i)),
      }}
    />
  )
}

function youIcon(style: MapStyle) {
  if (style === 'streets') {
    return L.divIcon({
      className: 'lq-marker-wrap',
      html: `<div class="g-you">
        <span class="g-you-ring"></span>
        <span class="g-you-ring delay"></span>
        <span class="g-you-dot"></span>
        <span class="g-you-label">Your shop</span>
      </div>`,
      iconSize: [120, 48],
      iconAnchor: [12, 12],
    })
  }
  return L.divIcon({
    className: 'lq-marker-wrap',
    html: `<div class="lq-you-mark"><span class="lq-you-ring"></span><span class="lq-you-ring delay"></span><span class="lq-you-core"></span><span class="lq-you-flag">YOU</span></div>`,
    iconSize: [110, 56],
    iconAnchor: [14, 14],
  })
}

function shopIcon(shop: CompetitorShop, active: boolean, style: MapStyle) {
  const photo = shop.photoUrl || shopFrontPhoto(shop)
  const reviews = shop.reviews?.reviewCount

  if (active) {
    return L.divIcon({
      className: 'lq-marker-wrap',
      html: `<div class="g-place-card threat-${shop.threat}">
        <img src="${photo}" alt="" />
        <div class="g-place-body">
          <b>${shop.name.length > 18 ? `${shop.name.slice(0, 17)}…` : shop.name}</b>
          <i>★ ${shop.rating}${reviews ? ` · ${reviews.toLocaleString()}` : ''} · ${shop.distanceKm} km</i>
        </div>
      </div>`,
      iconSize: [220, 72],
      iconAnchor: [28, 36],
    })
  }

  if (style === 'streets' || style === 'satellite') {
    const color =
      shop.threat === 'high' ? '#ea4335' : shop.threat === 'medium' ? '#fbbc04' : '#4285f4'
    return L.divIcon({
      className: 'lq-marker-wrap',
      html: `<div class="g-pin threat-${shop.threat}">
        <span class="g-pin-shadow"></span>
        <span class="g-pin-head" style="background:${color}"></span>
        <span class="g-pin-star">★${shop.rating}</span>
      </div>`,
      iconSize: [40, 48],
      iconAnchor: [14, 36],
    })
  }

  return L.divIcon({
    className: 'lq-marker-wrap',
    html: `<div class="lq-shop-mark threat-${shop.threat}">
      <span class="lq-shop-aura"></span>
      <span class="lq-shop-core">${shop.threat === 'high' ? '!' : ''}</span>
      <span class="lq-shop-km">★${shop.rating}</span>
    </div>`,
    iconSize: [44, 44],
    iconAnchor: [16, 16],
  })
}

function aiTipFor(shop: CompetitorShop): string {
  if (shop.threat === 'high') return 'High threat — win on stock + reviews'
  if (shop.reviews) return `★${shop.reviews.rating} · open pin for beat playbook`
  return 'Tap pin for copy vs beat moves'
}

export function MapPanel({
  center,
  competitors,
  loading,
  source,
  activeId,
  onSelect,
  floatSlot,
}: {
  center: GeoPoint
  competitors: CompetitorShop[]
  loading: boolean
  source: CompetitorSource
  activeId: string | null
  onSelect: (shop: CompetitorShop | null) => void
  floatSlot?: ReactNode
}) {
  const [visibleCount, setVisibleCount] = useState(0)
  const [beams, setBeams] = useState(false)
  const [style, setStyle] = useState<MapStyle>('streets')

  const enriched = useMemo(
    () =>
      competitors.map((c) => ({
        ...c,
        photoUrl: c.photoUrl || shopFrontPhoto(c),
      })),
    [competitors],
  )

  useEffect(() => {
    setVisibleCount(0)
    setBeams(false)
    onSelect(null)
    if (!enriched.length || loading) return
    let i = 0
    const id = window.setInterval(() => {
      i += 1
      setVisibleCount(i)
      if (i >= enriched.length) {
        window.clearInterval(id)
        window.setTimeout(() => {
          setBeams(true)
          onSelect(enriched.find((c) => c.threat === 'high') || enriched[0] || null)
        }, 220)
      }
    }, 120)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enriched, loading])

  const visible = useMemo(() => enriched.slice(0, visibleCount), [enriched, visibleCount])
  const high = visible.filter((c) => c.threat === 'high')
  const active = useMemo(
    () => enriched.find((c) => c.id === activeId) || null,
    [enriched, activeId],
  )

  const ringColor = style === 'streets' ? '#1a73e8' : '#00BAF2'

  return (
    <div className={`lq-bleed lq-skin-${style}`}>
      <div className="lq-bleed-map">
        <MapContainer
          key={style}
          center={[center.lat, center.lng]}
          zoom={15}
          scrollWheelZoom
          zoomControl={false}
          attributionControl={false}
          style={{ width: '100%', height: '100%' }}
          className={`lq-intel-map lq-map-${style}`}
        >
          <SafeTiles style={style} />
          <FlyTo center={center} ready={!loading} />
          <FitWhenReady
            center={center}
            shops={visible}
            ready={!loading && visibleCount === enriched.length && enriched.length > 1}
          />
          <CustomZoom />

          <Circle
            center={[center.lat, center.lng]}
            radius={500}
            pathOptions={{ color: ringColor, weight: 2, fillColor: ringColor, fillOpacity: 0.08 }}
          />
          <Circle
            center={[center.lat, center.lng]}
            radius={1000}
            pathOptions={{
              color: ringColor,
              weight: 1.4,
              dashArray: '5 7',
              fillColor: ringColor,
              fillOpacity: 0.04,
            }}
          />
          <Circle
            center={[center.lat, center.lng]}
            radius={1500}
            pathOptions={{
              color: ringColor,
              weight: 1.1,
              dashArray: '3 8',
              fillOpacity: 0.02,
            }}
          />
          <Circle
            center={[center.lat, center.lng]}
            radius={2000}
            pathOptions={{
              color: style === 'radar' ? '#7DD3FC' : '#5f6368',
              weight: 1,
              dashArray: '2 9',
              fillOpacity: 0.01,
            }}
          />

          {high.map((shop) => (
            <Circle
              key={`heat-${shop.id}`}
              center={[shop.lat, shop.lng]}
              radius={140}
              pathOptions={{
                color: '#ea4335',
                weight: 0,
                fillColor: '#ea4335',
                fillOpacity: activeId === shop.id ? 0.22 : 0.1,
              }}
            />
          ))}

          {beams &&
            visible.map((shop) => (
              <Polyline
                key={`beam-${shop.id}`}
                className={activeId === shop.id ? 'lq-beam-active' : 'lq-beam'}
                positions={[
                  [center.lat, center.lng],
                  [shop.lat, shop.lng],
                ]}
                pathOptions={{
                  color: activeId === shop.id ? ringColor : '#94a3b8',
                  weight: activeId === shop.id ? 2.6 : 1,
                  opacity: activeId === shop.id ? 0.9 : 0.2,
                  dashArray: activeId === shop.id ? undefined : '4 8',
                }}
              />
            ))}

          <Marker position={[center.lat, center.lng]} icon={youIcon(style)} zIndexOffset={1200} />

          {visible.map((shop) => (
            <Marker
              key={`${shop.id}-${activeId === shop.id ? 'on' : 'off'}-${style}`}
              position={[shop.lat, shop.lng]}
              icon={shopIcon(shop, activeId === shop.id, style)}
              zIndexOffset={activeId === shop.id ? 1100 : shop.threat === 'high' ? 800 : 500}
              eventHandlers={{
                click: () => onSelect(shop),
              }}
            />
          ))}
        </MapContainer>
        <div className="lq-map-veil" aria-hidden="true" />
        {style === 'radar' && <div className="lq-map-scan" aria-hidden="true" />}
      </div>

      <div className="lq-bleed-hud">
        <div className="lq-hud-left">
          <div className="lq-hud-pill">
            {loading
              ? 'Scanning…'
              : `${Math.min(visibleCount, enriched.length)} rivals · ${
                  source === 'google'
                    ? 'Google reviews'
                    : source === 'osm'
                      ? 'OSM pins · model ★'
                      : 'demo · model ★'
                }`}
          </div>
          <div className="lq-ring-legend" aria-hidden="true">
            <span>
              <i className="r05" /> 0.5
            </span>
            <span>
              <i className="r10" /> 1
            </span>
            <span>
              <i className="r15" /> 1.5
            </span>
            <span>
              <i className="r20" /> 2 km
            </span>
          </div>
        </div>
        <div className="lq-hud-right">
          <div className="lq-map-keys lq-keys-inline">
            <div>
              <i className="k-you" /> You
            </div>
            <div>
              <i className="k-high" /> High
            </div>
            <div>
              <i className="k-med" /> Med
            </div>
            <div>
              <i className="k-low" /> Low
            </div>
          </div>
          <div className="lq-style-toggle" role="group" aria-label="Map style">
            <button
              type="button"
              className={style === 'streets' ? 'on' : ''}
              onClick={() => setStyle('streets')}
            >
              Streets
            </button>
            <button
              type="button"
              className={style === 'radar' ? 'on' : ''}
              onClick={() => setStyle('radar')}
            >
              Radar
            </button>
            <button
              type="button"
              className={style === 'satellite' ? 'on' : ''}
              onClick={() => setStyle('satellite')}
            >
              Satellite
            </button>
          </div>
        </div>
      </div>

      {active && !loading && (
        <div className="lq-ai-chip lq-ai-chip-float">
          <em>AI</em>
          <span>{aiTipFor(active)}</span>
        </div>
      )}

      {floatSlot && <div className="lq-float-dock">{floatSlot}</div>}

      {loading && (
        <div className="lq-map-loading">
          <div className="spinner" />
          <strong>Loading street map…</strong>
          <p>Rivals · store photos · Google ★</p>
        </div>
      )}
    </div>
  )
}
