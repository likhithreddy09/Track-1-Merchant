# Paytm LocalIQ — Merchant Growth AI

**Know your neighbourhood. Move your stock.**

## Live dashboard (use this for demo)

```bash
cd dashboard
npm install
npm run dev
```

Open **http://127.0.0.1:5173**

### Demo flow
1. Pick shop type (Kirana, Garments, Pharma…)
2. Tap **Enable my location** (or **Use demo location**)
3. Launch dashboard — map animates catchment rings + competitors one-by-one
4. Right panel shows age mix, target customers, competition radar
5. Tabs: Demand Intelligence · Inventory Exchange · Ask LocalIQ AI

### What is “real”
- Browser geolocation + reverse geocode (OpenStreetMap Nominatim)
- Nearby competitor shops from OpenStreetMap Overpass (falls back to AI-mapped shops if OSM is thin/unavailable)
- Deterministic AI model for demographics, target segments, insights, inventory match scores (seeded by lat/lng + shop type so the same pin is reproducible)

## Pitch assets
- `index.html` — marketing/pitch page
- `out/Paytm_LocalIQ_Team_Panther.pptx` — judge deck
