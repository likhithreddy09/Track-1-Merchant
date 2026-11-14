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
            <a className="nav-link" href="#demo">
              Demo path
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
          <p className="lp-title">Street map. Nearby rivals. Idle stock → today’s EDI.</p>
          <p className="lp-sub">
            Pin your kirana. See who lives nearby and which rivals are close. Then sell slow or
            near-expiry stock so the cash covers today’s Paytm EDI before settlement.
          </p>
          <div className="lp-cta">
            <button className="btn btn-primary" type="button" onClick={onGetStarted}>
              Launch Neighbourhood
            </button>
            <a className="btn btn-ghost" href="#how">
              How it works
            </a>
          </div>
        </div>
      </section>

      <section className="lp-strip">
        <div className="lp-wrap lp-strip-grid">
          <div>
            <b>Street map</b>
            <span>Your pin · live area view</span>
          </div>
          <div>
            <b>Nearby rivals</b>
            <span>Distance · ratings · threat</span>
          </div>
          <div>
            <b>Who lives nearby</b>
            <span>People · households · week demand</span>
          </div>
          <div>
            <b>Cover EDI</b>
            <span>Sell idle stock → pay daily cut</span>
          </div>
        </div>
      </section>

      <section className="lp-section" id="how">
        <div className="lp-wrap">
          <div className="step-label">What we solve</div>
          <h2 className="lp-h2">Three pains. One board.</h2>
          <p className="lp-lead">
            Merchants struggle to see their street, free cash stuck in stock, and still pay Paytm’s
            daily EDI cut.
          </p>
          <div className="lp-cards">
            <article className="lp-card">
              <div className="lp-card-num">01</div>
              <h3>Know the street</h3>
              <p>
                Live map with your shop, catchment rings, rival pins, and a simple overview of people
                and households nearby.
              </p>
            </article>
            <article className="lp-card">
              <div className="lp-card-num">02</div>
              <h3>Move idle stock</h3>
              <p>
                List slow or near-expiry SKUs. Match nearby shops that need them — before stock
                expires on your shelf.
              </p>
            </article>
            <article className="lp-card">
              <div className="lp-card-num">03</div>
              <h3>Cover today’s EDI</h3>
              <p>
                Cash from the deal helps pay Paytm’s daily loan cut before settlement — so EDI does
                not surprise you.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="lp-section lp-ai" id="demo">
        <div className="lp-wrap">
          <div className="step-label">Demo path</div>
          <h2 className="lp-h2">Show judges in under a minute</h2>
          <p className="lp-lead">
            Login → allow location → map opens → Inventory → <strong>Cover EDI</strong>.
          </p>

          <div className="lp-ai-grid">
            <div className="lp-ai-main">
              <h3>What you will see</h3>
              <ul>
                <li>
                  <strong>Map first</strong> — your shop pin, 0.5–2 km rings, rival ratings on the
                  street
                </li>
                <li>
                  <strong>Overview</strong> — people nearby, households, closest rivals, this week’s
                  peak
                </li>
                <li>
                  <strong>Cover EDI</strong> — pick ageing stock → match a nearby buyer → confirm sale
                </li>
                <li>
                  <strong>Live orders</strong> — packets animate to shops that need the stock
                </li>
                <li>
                  <strong>Ask</strong> — plain answers on EDI, rivals, and households
                </li>
              </ul>
            </div>
            <div className="lp-ai-side">
              <div className="lp-ai-box">
                <h4>Demo login</h4>
                <p>Mobile · 1122334455</p>
                <p>OTP · 123456</p>
                <p>Then allow location (or use demo pin)</p>
              </div>
              <div className="lp-ai-box">
                <h4>Hero line</h4>
                <p>
                  Idle stock unlocks cash. That cash covers today’s Paytm EDI before settlement.
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
            <p className="lp-lead">Setup takes under a minute. Map opens by default.</p>
          </div>
          <button className="btn btn-navy" type="button" onClick={onGetStarted}>
            Go to setup →
          </button>
        </div>
      </section>

      <footer className="lp-foot">
        <div className="lp-wrap lp-foot-inner">
          <span>Team Panther · Paytm Merchant Growth AI hackathon</span>
          <span>Neighbourhood · street map · rivals · Cover EDI</span>
        </div>
        <PaytmStripe />
      </footer>
    </div>
  )
}
