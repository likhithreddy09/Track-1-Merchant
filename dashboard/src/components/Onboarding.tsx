import { useMemo, useState } from 'react'
import { SHOP_TYPES } from '../data/shopTypes'
import { getCurrentPosition, reverseGeocode } from '../lib/geo'
import type { GeoPoint, PlaceInfo, ShopType } from '../types'
import { PaytmBrand } from './PaytmBrand'
import { ShopIcon } from './ShopIcon'

const DEMO_PIN = { lat: 17.4948, lng: 78.3996 }
const DEMO_MOBILE = '1122334455'
const FIXED_OTP = '123456'

/** Demo store names by category — kirana is the default path */
const STORE_OPTIONS: Record<string, string[]> = {
  kirana: [
    'Ankit Kirana',
    'Sharma General Store',
    'Daily Needs Kirana',
    'Neighbourhood Mart',
    'Sri Sai Provisional',
  ],
  garments: ['Ankit Fashion', 'Style Point', 'Urban Wear'],
  pharma: ['Ankit Care Pharmacy', 'City Medicos', 'Wellness Chemist'],
  electronics: ['Electronics Hub', 'Mobile World', 'Gadget Zone'],
  food: ['Ankit Spice Kitchen', 'Street Bite', 'Tiffin Corner'],
  beauty: ['Ankit Glow Studio', 'Beauty Nest', 'Glow & Go'],
  stationery: ['Ankit Book Nest', 'Student Point', 'Copy & Pen'],
}

const DEFAULT_TYPE = SHOP_TYPES.find((t) => t.id === 'kirana') || SHOP_TYPES[0]
const DEFAULT_STORE = STORE_OPTIONS.kirana[0]

const STEPS = [
  { title: 'Your shop', hint: 'Kirana is selected by default — pick your store from the list.' },
  {
    title: 'Mobile number',
    hint: `Demo account mobile: ${DEMO_MOBILE}`,
  },
  {
    title: 'Enter OTP',
    hint: `Demo OTP: ${FIXED_OTP} — then allow location access.`,
  },
] as const

const FALLBACK_PLACE: PlaceInfo = {
  label: 'Kukatpally, Hyderabad',
  neighbourhood: 'Kukatpally',
  city: 'Hyderabad',
  state: 'Telangana',
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
  const [shopType, setShopType] = useState<ShopType>(DEFAULT_TYPE)
  const [shopName, setShopName] = useState(DEFAULT_STORE)
  const [mobile, setMobile] = useState(DEMO_MOBILE)
  const [otp, setOtp] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [locLabel, setLocLabel] = useState('')
  const [error, setError] = useState('')
  const [showLocPopup, setShowLocPopup] = useState(false)
  const [retryingLoc, setRetryingLoc] = useState(false)

  const stores = useMemo(
    () => STORE_OPTIONS[shopType.id] || [DEFAULT_STORE],
    [shopType.id],
  )

  function pickType(id: string) {
    const next = SHOP_TYPES.find((t) => t.id === id) || DEFAULT_TYPE
    setShopType(next)
    const list = STORE_OPTIONS[next.id] || [DEFAULT_STORE]
    setShopName(list[0])
  }

  function digitsOnly(value: string, max: number) {
    return value.replace(/\D/g, '').slice(0, max)
  }

  function launchWith(location: GeoPoint, place: PlaceInfo) {
    setShowLocPopup(false)
    onStart({
      location,
      place,
      shopType,
      shopName: shopName.trim() || stores[0],
    })
  }

  async function tryLiveLocation(): Promise<boolean> {
    setLocLabel('Please allow location access…')
    try {
      const pos = await getCurrentPosition()
      const info = await reverseGeocode(pos)
      launchWith(pos, info)
      return true
    } catch {
      return false
    }
  }

  async function useDemoLocation() {
    setRetryingLoc(true)
    setLocLabel('Using demo pin…')
    try {
      const info = await reverseGeocode(DEMO_PIN)
      launchWith(DEMO_PIN, info)
    } catch {
      launchWith(DEMO_PIN, FALLBACK_PLACE)
    } finally {
      setRetryingLoc(false)
    }
  }

  async function retryLocation() {
    setRetryingLoc(true)
    setError('')
    const ok = await tryLiveLocation()
    setRetryingLoc(false)
    if (!ok) {
      setError('Location is still off. Enable it in browser settings, then try again.')
    }
  }

  async function verifyAndLaunch() {
    setError('')
    if (mobile !== DEMO_MOBILE) {
      setError(`Use demo account mobile ${DEMO_MOBILE}`)
      return
    }
    if (otp.trim() !== FIXED_OTP) {
      setError(`Invalid OTP. Use ${FIXED_OTP} for this demo.`)
      return
    }
    setVerifying(true)
    try {
      const ok = await tryLiveLocation()
      if (!ok) {
        setShowLocPopup(true)
      }
    } finally {
      setVerifying(false)
    }
  }

  const mobileOk = mobile.length === 10

  return (
    <div className="su">
      <header className="su-top">
        <PaytmBrand product="Neighbourhood" onHome={onHome} />
        <span className="su-top-tag">Setup</span>
      </header>

      <main className="su-main">
        <div className="su-card">
          <div className="su-demo-banner" role="note">
            <strong>Demo account</strong>
            <span>
              Mobile <b>{DEMO_MOBILE}</b> · OTP <b>{FIXED_OTP}</b>
            </span>
          </div>

          <nav className="su-steps" aria-label="Setup steps">
            {STEPS.map((s, i) => (
              <button
                key={s.title}
                type="button"
                className={`su-step ${step === i ? 'on' : ''} ${
                  (i === 0 && shopName) || (i === 1 && mobileOk) || (i === 2 && otp === FIXED_OTP)
                    ? 'done'
                    : ''
                }`}
                onClick={() => {
                  if (i <= step) setStep(i)
                }}
              >
                <em>{i + 1}</em>
                <span>{i === 0 ? 'Shop' : i === 1 ? 'Mobile' : 'OTP'}</span>
              </button>
            ))}
          </nav>

          <div className="su-progress" aria-hidden="true">
            <i style={{ width: `${((step + 1) / 3) * 100}%` }} />
          </div>

          <header className="su-hd">
            <p className="su-prefill">Quick demo login — kirana ready</p>
            <h1>{STEPS[step].title}</h1>
            <p>{STEPS[step].hint}</p>
          </header>

          {step === 0 && (
            <div className="su-block">
              <label className="su-label" htmlFor="shop-type">
                Shop type
              </label>
              <div className="su-select-wrap">
                <span className="su-select-ico" aria-hidden="true">
                  <ShopIcon id={shopType.id} size={18} />
                </span>
                <select
                  id="shop-type"
                  className="su-select"
                  value={shopType.id}
                  onChange={(e) => pickType(e.target.value)}
                >
                  {SHOP_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <label className="su-label" htmlFor="shop-store">
                Select store
              </label>
              <select
                id="shop-store"
                className="su-select"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
              >
                {stores.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>

              <div className="su-nav">
                <span />
                <button
                  type="button"
                  className="su-btn primary"
                  disabled={!shopName.trim()}
                  onClick={() => setStep(1)}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="su-block">
              <div className="su-picked">
                <ShopIcon id={shopType.id} size={18} />
                <span>
                  {shopName} · {shopType.label}
                </span>
                <button type="button" onClick={() => setStep(0)}>
                  Change
                </button>
              </div>

              <label className="su-label" htmlFor="mobile">
                Mobile number
              </label>
              <div className="su-phone">
                <span>+91</span>
                <input
                  id="mobile"
                  className="su-input"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder={DEMO_MOBILE}
                  value={mobile}
                  onChange={(e) => setMobile(digitsOnly(e.target.value, 10))}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && mobileOk) setStep(2)
                  }}
                />
              </div>
              <p className="su-otp-hint">
                Demo account: use <strong>{DEMO_MOBILE}</strong>
              </p>

              <div className="su-nav">
                <button type="button" className="su-btn ghost" onClick={() => setStep(0)}>
                  Back
                </button>
                <button
                  type="button"
                  className="su-btn primary"
                  disabled={!mobileOk}
                  onClick={() => {
                    if (mobile !== DEMO_MOBILE) {
                      setError(`Use demo account mobile ${DEMO_MOBILE}`)
                      return
                    }
                    setOtp('')
                    setError('')
                    setStep(2)
                  }}
                >
                  Send OTP
                </button>
              </div>
              {error && step === 1 && <p className="su-error">{error}</p>}
            </div>
          )}

          {step === 2 && (
            <div className="su-block">
              <div className="su-picked">
                <span>+91 {mobile}</span>
                <button type="button" onClick={() => setStep(1)}>
                  Change
                </button>
              </div>

              <label className="su-label" htmlFor="otp">
                One-time password
              </label>
              <input
                id="otp"
                className="su-input su-otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder={FIXED_OTP}
                value={otp}
                onChange={(e) => setOtp(digitsOnly(e.target.value, 6))}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && otp.length === 6 && !verifying) void verifyAndLaunch()
                }}
              />
              <p className="su-otp-hint">
                Demo OTP: <strong>{FIXED_OTP}</strong>
              </p>
              <p className="su-hint">
                After verify, please <strong>Allow</strong> location access so we can open your street
                map.
              </p>
              {verifying && (
                <p className="su-hint">{locLabel || 'Verifying… requesting location'}</p>
              )}
              {error && !showLocPopup && <p className="su-error">{error}</p>}

              <div className="su-nav">
                <button
                  type="button"
                  className="su-btn ghost"
                  disabled={verifying}
                  onClick={() => setStep(1)}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="su-btn navy"
                  disabled={otp.length !== 6 || verifying}
                  onClick={() => void verifyAndLaunch()}
                >
                  {verifying ? 'Opening…' : 'Verify & open map'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {showLocPopup && (
        <div className="su-loc-veil" role="dialog" aria-modal="true" aria-labelledby="su-loc-title">
          <div className="su-loc-card">
            <div className="su-loc-ico" aria-hidden="true">
              <span />
            </div>
            <h2 id="su-loc-title">Enable location access</h2>
            <p>
              Location is off or blocked. Please allow location access in your browser so we can pin
              your shop on the map.
            </p>
            <ol className="su-loc-steps">
              <li>Tap the lock / site settings icon in the address bar</li>
              <li>Set <strong>Location</strong> to <strong>Allow</strong></li>
              <li>Come back and tap <strong>Try again</strong></li>
            </ol>
            {error && <p className="su-error">{error}</p>}
            <div className="su-loc-actions">
              <button
                type="button"
                className="su-btn primary wide"
                disabled={retryingLoc}
                onClick={() => void retryLocation()}
              >
                {retryingLoc ? 'Checking…' : 'Try again · Enable location'}
              </button>
              <button
                type="button"
                className="su-btn ghost wide"
                disabled={retryingLoc}
                onClick={() => void useDemoLocation()}
              >
                Continue with demo pin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
