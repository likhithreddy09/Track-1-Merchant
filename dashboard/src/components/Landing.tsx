import { PaytmBrand, PaytmStripe } from './PaytmBrand'

export function Landing({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="landing">
      <header className="topbar landing-top">
        <div className="lp-wrap lp-top-inner">
          <PaytmBrand onHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
          <div className="top-meta">
            <a className="nav-link" href="#how">
              How it works
            </a>
            <a className="nav-link" href="#ai">
              Merchant AI
            </a>
            <button className="btn btn-primary" type="button" onClick={onGetStarted}>
              Start setup
            </button>
          </div>
        </div>
      </header>

      <section className="lp-hero">
        <div className="lp-wrap lp-hero-text">
          <div className="lp-kicker">Paytm Merchant Growth AI · Team Panther</div>
          <h1 className="lp-brand">
            <img
              className="lp-paytm-logo"
              src="https://pwebassets.paytm.com/commonwebassets/paytmweb/header/images/logo_new.svg"
              alt="Paytm"
            />
            <span className="lp-product">Neighbourhood</span>
          </h1>
          <p className="lp-title">Street map, rivals, and EDI from idle stock.</p>
          <p className="lp-sub">
            Pin your kirana. See people nearby, rivals on the map, then sell slow stock to cover
            today’s Paytm EDI before settlement.
          </p>
          <div className="lp-cta">
            <button className="btn btn-primary" type="button" onClick={onGetStarted}>
              Launch Neighbourhood
            </button>
            <a className="btn btn-ghost" href="#ai">
              How it works
            </a>
          </div>
        </div>
      </section>

      <section className="lp-strip">
        <div className="lp-wrap lp-strip-grid">
          <div>
            <b>Live Google streets</b>
            <span>Real map · your area chrome</span>
          </div>
          <div>
            <b>Catchment maths</b>
            <span>0.5–2 km gravity · HH ± CI</span>
          </div>
          <div>
            <b>Review playbook</b>
            <span>What to copy vs beat</span>
          </div>
          <div>
            <b>Buy ↔ Sell</b>
            <span>Local inventory exchange</span>
          </div>
        </div>
      </section>

      <section className="lp-section" id="how">
        <div className="lp-wrap">
          <div className="step-label">Product</div>
          <h2 className="lp-h2">Two engines. One growth loop.</h2>
          <p className="lp-lead">
            Demand tells you what the neighbourhood needs. Exchange finds who nearby can fill or take
            stock.
          </p>
          <div className="lp-cards">
            <article className="lp-card">
              <div className="lp-card-num">01</div>
              <h3>Demand Intelligence</h3>
              <p>
                Population ± CI, households, age mix, target customers, and live street pulse — with
                model confidence scored.
              </p>
            </article>
            <article className="lp-card">
              <div className="lp-card-num">02</div>
              <h3>Inventory Exchange</h3>
              <p>
                List ageing / near-expiry stock. We match PGs, restaurants and nearby shops —
                then buy or sell locally.
              </p>
            </article>
            <article className="lp-card">
              <div className="lp-card-num">03</div>
              <h3>Closed loop</h3>
              <p>
                Market signal → shelf decision → local match. Every trade sharpens the next
                recommendation.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="lp-section lp-ai" id="ai">
        <div className="lp-wrap">
          <div className="step-label">How it works</div>
          <h2 className="lp-h2">What you can show in the demo</h2>
          <p className="lp-lead">
            Live map + neighbourhood scores in the browser. Highlight: sell idle stock to cover
            today’s <strong>Paytm EDI</strong>.
          </p>

          <div className="lp-ai-grid">
            <div className="lp-ai-main">
              <h3>Neighbourhood Engine (custom)</h3>
              <ul>
                <li>
                  <strong>Catchment gravity</strong> — 0.5/1/1.5/2 km rings × dens × e^(−λd) → people
                  &amp; HH ± CI
                </li>
                <li>
                  <strong>Segment ranker</strong> — scores target customers by shop type
                </li>
                <li>
                  <strong>Review scorer</strong> — Google-style ★, volume, themes, copy/beat playbook
                </li>
                <li>
                  <strong>Competition logistic</strong> — steal-risk from distance + rating + sentiment
                </li>
                <li>
                  <strong>Inventory matcher</strong> — ranks by match %, deal ₹, distance &amp; urgency
                </li>
              </ul>
            </div>
            <div className="lp-ai-side">
              <div className="lp-ai-box">
                <h4>Live data inputs</h4>
                <p>Browser geolocation</p>
                <p>OpenStreetMap Nominatim (place)</p>
                <p>OpenStreetMap Overpass (nearby shops)</p>
                <p>Esri street / satellite tiles (no API key)</p>
                <p>Google-style ★ + review model (seeded)</p>
              </div>
              <div className="lp-ai-box">
                <h4>Production path</h4>
                <p>
                  Plug Paytm merchant graph + payments signals, Google Places reviews, and optionally a
                  Paytm LLM layer on the same scores.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap lp-bottom">
          <div>
            <h2 className="lp-h2">Ready for the demo</h2>
            <p className="lp-lead">
              Login → allow location → map opens → Inventory → Cover EDI.
            </p>
          </div>
          <button className="btn btn-navy" type="button" onClick={onGetStarted}>
            Go to setup →
          </button>
        </div>
      </section>

      <footer className="lp-foot">
        <div className="lp-wrap lp-foot-inner">
          <span>Team Panther · Paytm Merchant Growth AI hackathon</span>
          <span>Neighbourhood · λ=0.85 gravity · Google-style reviews · buy↔sell exchange</span>
        </div>
        <PaytmStripe />
      </footer>
    </div>
  )
}
