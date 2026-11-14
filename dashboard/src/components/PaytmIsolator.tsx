/** Paytm-style spinning isolator with animated shopkeeper scene */
export function PaytmIsolator({
  size = 160,
  label,
  sub,
}: {
  size?: number
  label?: string
  sub?: string
}) {
  return (
    <div className="iso-wrap" style={{ ['--iso-size' as string]: `${size}px` }}>
      <div className="iso-core" aria-hidden="true">
        <span className="iso-ring r-a" />
        <span className="iso-ring r-b" />
        <span className="iso-ring r-c" />
        <span className="iso-orbit">
          <i />
          <i />
          <i />
        </span>
        <span className="iso-scan" />
        <span className="iso-mark">
          <ShopkeeperMark />
        </span>
      </div>
      {label && <div className="iso-label">{label}</div>}
      {sub && <div className="iso-sub">{sub}</div>}
    </div>
  )
}

function ShopkeeperMark() {
  return (
    <svg className="iso-shop" viewBox="0 0 64 64" role="img" aria-label="Shopkeeper">
      <path d="M10 22h44v4H10z" fill="#00baf2" className="iso-shop-canopy" />
      <path d="M8 22l4-6h40l4 6H8z" fill="#002970" />
      <rect x="12" y="26" width="40" height="28" rx="2" fill="#f5f8fb" />
      <rect x="12" y="26" width="40" height="4" fill="#e6ebf0" />
      <rect x="16" y="42" width="32" height="8" rx="1" fill="#002970" />
      <rect x="22" y="30" width="10" height="10" rx="1" fill="#b9e7f8" />
      <rect x="34" y="30" width="10" height="10" rx="1" fill="#b9e7f8" />
      <circle cx="32" cy="40" r="3.2" fill="#ffcc9a" className="iso-shop-head" />
      <path d="M27 48c1.2-3.2 3-4.5 5-4.5s3.8 1.3 5 4.5" fill="#00baf2" />
      <circle cx="48" cy="18" r="3" fill="#00baf2" className="iso-shop-spark" />
      <circle cx="48" cy="18" r="1.4" fill="#fff" />
    </svg>
  )
}

/** Bigger animated storefront for boot — shopkeeper greeting customers */
function ShopkeeperScene() {
  return (
    <div className="boot-scene" aria-hidden="true">
      <div className="boot-scene-glow" />
      <svg className="boot-shop-svg" viewBox="0 0 220 160" role="img" aria-label="Neighbourhood shop loading">
        {/* ground */}
        <ellipse cx="110" cy="148" rx="78" ry="8" fill="rgba(0,186,242,0.12)" className="boot-ground" />

        {/* floating coins / bags */}
        <g className="boot-float a">
          <circle cx="28" cy="48" r="10" fill="#00baf2" opacity="0.9" />
          <text x="28" y="52" textAnchor="middle" fontSize="11" fontWeight="700" fill="#002970">
            ₹
          </text>
        </g>
        <g className="boot-float b">
          <rect x="178" y="40" width="18" height="14" rx="3" fill="#fff" />
          <path d="M181 40h12v-3a6 6 0 0 0-12 0v3z" fill="#00baf2" />
        </g>
        <g className="boot-float c">
          <circle cx="195" cy="100" r="8" fill="#7dd3fc" />
          <text x="195" y="103" textAnchor="middle" fontSize="9" fontWeight="700" fill="#002970">
            ★
          </text>
        </g>

        {/* storefront */}
        <path d="M52 58h116l10 14H42l10-14z" fill="#002970" />
        <rect x="48" y="72" width="124" height="12" fill="#00baf2" className="boot-awning" />
        {/* awning stripes */}
        <g className="boot-awning-stripes" fill="rgba(255,255,255,0.25)">
          <rect x="56" y="72" width="10" height="12" />
          <rect x="76" y="72" width="10" height="12" />
          <rect x="96" y="72" width="10" height="12" />
          <rect x="116" y="72" width="10" height="12" />
          <rect x="136" y="72" width="10" height="12" />
          <rect x="156" y="72" width="10" height="12" />
        </g>
        <rect x="54" y="84" width="112" height="58" rx="4" fill="#f3f8fc" />
        <rect x="54" y="84" width="112" height="8" fill="#e2eaf2" />

        {/* windows */}
        <rect x="66" y="98" width="28" height="22" rx="2" fill="#b9e7f8" className="boot-window" />
        <rect x="126" y="98" width="28" height="22" rx="2" fill="#b9e7f8" className="boot-window" />

        {/* counter */}
        <rect x="72" y="128" width="76" height="14" rx="2" fill="#002970" />

        {/* shopkeeper */}
        <g className="boot-keeper">
          <circle cx="110" cy="112" r="9" fill="#ffcc9a" />
          <path d="M96 132c3-10 8-14 14-14s11 4 14 14" fill="#00baf2" />
          {/* waving arm */}
          <path
            className="boot-wave"
            d="M124 118c8-2 14-8 12-14"
            fill="none"
            stroke="#ffcc9a"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>

        {/* customer approaching */}
        <g className="boot-customer">
          <circle cx="48" cy="126" r="6" fill="#ffd7b0" />
          <path d="M40 142c2-7 5-10 8-10s6 3 8 10" fill="#5b7cfa" />
        </g>

        {/* map pin bounce */}
        <g className="boot-pin">
          <path d="M110 28c-7 0-12 5-12 12 0 9 12 20 12 20s12-11 12-20c0-7-5-12-12-12z" fill="#00baf2" />
          <circle cx="110" cy="40" r="4.5" fill="#fff" />
        </g>
      </svg>

      <div className="boot-dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
    </div>
  )
}

export function PaytmBootScreen({
  shopName,
  shopLabel,
  place,
  progressLabel,
}: {
  shopName: string
  shopLabel: string
  place: string
  progressLabel?: string
}) {
  return (
    <div className="boot-screen boot-screen-compact" role="status" aria-live="polite" aria-busy="true">
      <ShopkeeperScene />
      <div className="boot-copy">
        <h1 className="boot-title">Opening your shop</h1>
        <p className="boot-shop">
          {shopName}
          <span>· {shopLabel}</span>
        </p>
        <p className="boot-place">{place}</p>
      </div>

      <div className="boot-status">
        <span className="boot-status-pulse" aria-hidden="true" />
        <em>{progressLabel || 'Preparing your neighbourhood board…'}</em>
      </div>

      <div className="boot-rail" aria-hidden="true">
        <i />
      </div>
    </div>
  )
}
