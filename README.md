# Landed

> Should you ship it home or drive to a lower-tax pickup? **Landed** does the math — sales tax, gas, and your time, all counted in.

A single-page web app with two tabs:

- **Router** — enter any US ZIP or city and Landed compares **shipping home** vs. **driving to a nearby/lower-tax pickup** within a radius you choose, weighing **sales tax + driving cost ($/mi) + the value of your time**. It tells you the cheapest realistic way to get the same item.
- **Tax map** — a US sales-tax choropleth. Toggle **state base** vs. **2025 combined** (state + average local) rates, and **tap any state to drill into its real per-county rates** — all 50 states + DC (~3,140 counties). Florida is exact (county discretionary surtaxes, FL DOR DR‑15DSS).

## Features

- **Live, exact local rates** via TaxJar when configured, with a bundled-data **fallback so it always works** (offline-friendly).
- **City autocomplete** over ~29,500 US places (type 3+ letters).
- **"My location"** fills your real ZIP (browser geolocation + reverse geocode).
- **Category-aware** sales tax: general, clothing, groceries, prescription.
- **Installable PWA** (manifest + icons, mobile-friendly).

## Tech

React 18 + Vite. The entire UI is one component (`landed-tax-router.jsx`) — no UI framework and no mapping library (geography is projected to inline SVG). Geo/rate datasets are lazy-loaded from `public/`, so the JS bundle stays small (~130 KB gzipped).

## Run locally

Requires **Node 18+**.

```bash
npm install
npm run dev      # → http://localhost:5173
```

On Windows you can also double-click `run-landed.cmd`.

## Live rates (optional)

Rates fall back to **bundled estimates with zero setup**. For **exact live rates**, create a `.env.local` in the project root:

```bash
TAXJAR_API_KEY=your_taxjar_token   # server-side only — never shipped to the browser
VITE_LIVE_RATES=1                  # tells the client a live proxy is available
```

**How it works:** the browser calls a same-origin endpoint `/api/taxrate?zip=...` that adds the key **server-side** and calls TaxJar — so there's no CORS problem and the key never enters the client bundle. In development that endpoint is a small Vite middleware (`vite.config.js`); in production it's a Netlify function (`netlify/functions/taxrate.js`).

> `.env.local` is gitignored — don't commit your key.

## Build

```bash
npm run build    # → dist/
npm run preview  # serve the built site locally
```

## Deploy (Netlify)

1. Import this repo in Netlify — build command and publish dir are auto-detected from `netlify.toml` (`npm run build` → `dist`).
2. Add environment variables under **Site → Environment**: `TAXJAR_API_KEY` and `VITE_LIVE_RATES=1`.
3. Deploy. The `/api/taxrate` Netlify function serves live rates with the key kept server-side.

## Data & regeneration

Bundled data (committed):

| File | What |
|------|------|
| `public/us-counties.geo.json` | County shapes for all states (lazy-loaded) |
| `public/county-rates.json`    | Combined rate per county (`FIPS → rate`) |
| `public/us-places.json`       | City/ZIP autocomplete index |
| `us-states.geo.json`          | US state shapes |
| `fl-counties.geo.json`        | Florida county shapes |

The generation **inputs** are gitignored (large, regenerable). To rebuild the datasets, first download the inputs:

```bash
# county shapes
curl -L -o scripts/us-counties-raw.json \
  https://raw.githubusercontent.com/plotly/datasets/master/geojson-counties-fips.json
# US ZIP database (unzip into scripts/geonames/US.txt)
curl -L -o scripts/US.zip https://download.geonames.org/export/zip/US.zip
```

Then run:

```bash
node scripts/prep-counties.mjs     # → public/us-counties.geo.json
node scripts/prep-places.mjs       # → public/us-places.json
node scripts/gen-county-rates.mjs  # → public/county-rates.json  (needs TAXJAR_API_KEY; ~3,140 API calls; resumable)
```

## Data sources & accuracy

- **Combined state+local averages:** Tax Foundation (2025).
- **County & live rates:** TaxJar.
- **Geometry:** county shapes from plotly's FIPS GeoJSON; state shapes from the PublicaMundi/Leaflet US-states dataset.
- **ZIPs / places:** GeoNames. **Reverse-geocode** (My location): BigDataCloud.

Rates are estimates, change frequently, and a ZIP that straddles two jurisdictions may be off. **This is not tax advice** — verify before relying on it.
