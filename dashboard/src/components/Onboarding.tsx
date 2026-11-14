import { useEffect, useMemo, useState } from 'react'
import { SHOP_TYPES } from '../data/shopTypes'
import { getCurrentPosition, reverseGeocode } from '../lib/geo'
import type { GeoPoint, PlaceInfo, ShopType } from '../types'
import { PaytmBrand } from './PaytmBrand'
import { ShopIcon } from './ShopIcon'

const DEMO_PIN = { lat: 17.4948, lng: 78.3996 }

/** Demo shop names — must match the selected category */
const PREFILL_NAMES: Record<string, string> = {
  kirana: 'Ankit Kirana',
  garments: 'Ankit Fashion',
  pharma: 'Ankit Care Pharmacy',
  electronics: 'Electronics Hub',
  food: 'Ankit Spice Kitchen',
  beauty: 'Ankit Glow Studio',
  stationery: 'Ankit Book Nest',
}

const PREFILL_TYPE = SHOP_TYPES.find((t) => t.id === 'electronics') || SHOP_TYPES[0]
const PREFILL_NAME = PREFILL_NAMES[PREFILL_TYPE.id] || `${PREFILL_TYPE.label.split(' / ')[0]} Hub`

const STEPS = [
  { title: 'What do you sell?', hint: 'We’ll tune rivals, reviews, and stock to your shop.' },
  { title: 'Shop name', hint: 'How your neighbourhood board greets you.' },
  { title: 'Your location', hint: 'Used for nearby people, rivals, and deals.' },
] as const

function nameForType(t: ShopType) {
  return PREFILL_NAMES[t.id] || `${t.label.split(' / ')[0]} Hub`
}

export function Onboarding({
  onStart,
  onHome,
}: {
  onStart: (payload: {
    location: GeoPoint
    place: PlaceInfo
    shopType: ShopType
    shopName: string
  }) => void
  onHome?: () => void
}) {
  const [step, setStep] = useState(0)
  const [shopType, setShopType] = useState<ShopType | null>(PREFILL_TYPE)
  const [shopName, setShopName] = useState(PREFILL_NAME)
  const [nameTouched, setNameTouched] = useState(false)
  const [location, setLocation] = useState<GeoPoint | null>(DEMO_PIN)
  const [place, setPlace] = useState<PlaceInfo | null>(null)
  const [loadingLoc, setLoadingLoc] = useState(true)
  const [error, setError] = useState('')
  const [demoMode, setDemoMode] = useState(true)

  function pickShopType(t: ShopType) {
    setShopType(t)
    // Keep custom names; swap auto-prefills when category changes
    const wasPrefill = Object.values(PREFILL_NAMES).includes(shopName) || !nameTouched
    if (wasPrefill) {
      setShopName(nameForType(t))
      setNameTouched(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    async function prefillPin() {
      setLoadingLoc(true)
      try {
        const info = await reverseGeocode(DEMO_PIN)
        if (cancelled) return
        setLocation(DEMO_PIN)
        setPlace(info)
        setDemoMode(true)
      } catch {
        if (!cancelled) {
          setPlace({
            label: 'Kukatpally, Hyderabad',
            neighbourhood: 'Kukatpally',
            city: 'Hyderabad',
            state: 'Telangana',
          })
        }
      } finally {
        if (!cancelled) setLoadingLoc(false)
      }
    }
    void prefillPin()
    return () => {
      cancelled = true
    }
  }, [])

  const ready = Boolean(shopType && shopName.trim() && location && place)

  const nameSuggestions = useMemo(() => {
    if (!shopType) return ['My Store', 'City Mart', 'Neighbourhood Shop']
    const short = shopType.label.split(' / ')[0]
    const primary = nameForType(shopType)
    return [primary, `${short} Point`, `${short} Corner`].filter(
      (n, i, arr) => arr.indexOf(n) === i,
    )
  }, [shopType])

  async function enableLocation() {
    setError('')
    setLoadingLoc(true)
    setDemoMode(false)
    try {
      const pos = await getCurrentPosition()
      const info = await reverseGeocode(pos)
      setLocation(pos)
      setPlace(info)
    } catch {
      setError('Location blocked. Use demo pin to continue.')
    } finally {
      setLoadingLoc(false)
    }
  }

  async function useDemoLocation() {
    setError('')
    setLoadingLoc(true)
    const info = await reverseGeocode(DEMO_PIN)
    setLocation(DEMO_PIN)
    setPlace(info)
    setDemoMode(true)
    setLoadingLoc(false)
  }

  function launch() {
    if (!shopType || !location || !place) return
    onStart({ location, place, shopType, shopName: shopName.trim() || 'My Shop' })
  }

  return (
    <div className="su">
      <header className="su-top">
        <PaytmBrand product={place?.neighbourhood || 'Neighbourhood'} onHome={onHome} />
        <span className="su-top-tag">Setup</span>
      </header>

      <main className="su-main">
        <div className="su-card">
          <nav className="su-steps" aria-label="Setup steps">
            {STEPS.map((s, i) => (
              <button
                key={s.title}
                type="button"
                className={`su-step ${step === i ? 'on' : ''} ${
                  (i === 0 && shopType) || (i === 1 && shopName.trim()) || (i === 2 && location)
                    ? 'done'
                    : ''
                }`}
                onClick={() => setStep(i)}
              >
                <em>{i + 1}</em>
                <span>{i === 0 ? 'Type' : i === 1 ? 'Name' : 'Pin'}</span>
              </button>
            ))}
          </nav>

          <div className="su-progress" aria-hidden="true">
            <i style={{ width: `${((step + 1) / 3) * 100}%` }} />
          </div>

          <header className="su-hd">
            <p className="su-prefill">Demo prefilled — review each step, then open your board</p>
            <h1>{STEPS[step].title}</h1>
            <p>{STEPS[step].hint}</p>
          </header>

          {step === 0 && (
            <div className="su-block">
              <div className="su-types">
                {SHOP_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`su-type ${shopType?.id === t.id ? 'on' : ''}`}
                    onClick={() => pickShopType(t)}
                  >
                    <span className="su-type-ico">
                      <ShopIcon id={t.id} size={22} />
                    </span>
                    <span className="su-type-txt">
                      <strong>{t.label}</strong>
                    </span>
                    {shopType?.id === t.id && <span className="su-check">✓</span>}
                  </button>
                ))}
              </div>
              <div className="su-nav">
                <span />
                <button
                  type="button"
                  className="su-btn primary"
                  disabled={!shopType}
                  onClick={() => setStep(1)}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="su-block">
              {shopType && (
                <div className="su-picked">
                  <ShopIcon id={shopType.id} size={18} />
                  <span>{shopType.label}</span>
                  <button type="button" onClick={() => setStep(0)}>
                    Change
                  </button>
                </div>
              )}
              <label className="su-label" htmlFor="shop-name">
                Shop name
              </label>
              <input
                id="shop-name"
                className="su-input"
                value={shopName}
                onChange={(e) => {
                  setShopName(e.target.value)
                  setNameTouched(true)
                }}
                placeholder={shopType ? `e.g. ${nameForType(shopType)}` : 'e.g. Electronics Hub'}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && shopName.trim()) setStep(2)
                }}
              />
              <div className="su-chips">
                {nameSuggestions.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      setShopName(n)
                      setNameTouched(true)
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="su-nav">
                <button type="button" className="su-btn ghost" onClick={() => setStep(0)}>
                  Back
                </button>
                <button
                  type="button"
                  className="su-btn primary"
                  disabled={!shopName.trim()}
                  onClick={() => setStep(2)}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="su-block">
              <div className={`su-pin ${location ? 'on' : ''}`}>
                <div className="su-pin-mark" aria-hidden="true">
                  <span />
                </div>
                <div className="su-pin-copy">
                  {loadingLoc ? (
                    <>
                      <strong>Finding your street…</strong>
                      <p>Please allow location access</p>
                    </>
                  ) : location && place ? (
                    <>
                      <strong>{demoMode ? 'Demo location set' : 'Location set'}</strong>
                      <p>
                        {place.neighbourhood}, {place.city}
                      </p>
                    </>
                  ) : (
                    <>
                      <strong>No location yet</strong>
                      <p>Use your GPS, or try the demo pin</p>
                    </>
                  )}
                </div>
              </div>

              <div className="su-pin-actions">
                <button
                  type="button"
                  className="su-btn primary wide"
                  onClick={enableLocation}
                  disabled={loadingLoc}
                >
                  {loadingLoc ? 'Reading GPS…' : 'Use my location'}
                </button>
                <button
                  type="button"
                  className="su-btn ghost wide"
                  onClick={useDemoLocation}
                  disabled={loadingLoc}
                >
                  Demo pin · Hyderabad
                </button>
              </div>
              {error && <p className="su-error">{error}</p>}

              <div className="su-nav">
                <button type="button" className="su-btn ghost" onClick={() => setStep(1)}>
                  Back
                </button>
                <button
                  type="button"
                  className="su-btn navy"
                  disabled={!ready}
                  onClick={launch}
                >
                  Open {place?.neighbourhood || 'Neighbourhood'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
