// Generate public/county-rates.json = { "<countyFIPS>": <combinedRate> } by calling TaxJar once per county
// for a representative ZIP (the ZIP nearest the county centroid, within the same county FIPS).
// Resumable: re-run to continue where it stopped. Throttled to be gentle on the API.
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const STATE_FIPS = { "01":"AL","02":"AK","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT","10":"DE","11":"DC","12":"FL","13":"GA","15":"HI","16":"ID","17":"IL","18":"IN","19":"IA","20":"KS","21":"KY","22":"LA","23":"ME","24":"MD","25":"MA","26":"MI","27":"MN","28":"MS","29":"MO","30":"MT","31":"NE","32":"NV","33":"NH","34":"NJ","35":"NM","36":"NY","37":"NC","38":"ND","39":"OH","40":"OK","41":"OR","42":"PA","44":"RI","45":"SC","46":"SD","47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA","54":"WV","55":"WI","56":"WY" };
const ABBR_TO_FIPS = Object.fromEntries(Object.entries(STATE_FIPS).map(([f, a]) => [a, f]));
const OUT = "public/county-rates.json";
const ZIPS_CACHE = "scripts/county-zips.json";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const env = readFileSync(".env.local", "utf8");
const key = (env.match(/^TAXJAR_API_KEY=(.+)$/m) || [])[1]?.trim();
if (!key) { console.error("TAXJAR_API_KEY missing from .env.local"); process.exit(1); }

const centroid = (g) => {
  const ring = g.type === "Polygon" ? g.coordinates[0] : g.coordinates[0][0];
  let x = 0, y = 0; for (const p of ring) { x += p[0]; y += p[1]; } return [x / ring.length, y / ring.length];
};

// 1) representative ZIP per county (cached)
let countyZips;
if (existsSync(ZIPS_CACHE)) {
  countyZips = JSON.parse(readFileSync(ZIPS_CACHE, "utf8"));
  console.log("loaded", Object.keys(countyZips).length, "county ZIPs from cache");
} else {
  const counties = JSON.parse(readFileSync("scripts/us-counties-raw.json", "utf8")).features
    .filter((f) => STATE_FIPS[String(f.id).slice(0, 2)])
    .map((f) => ({ fips: String(f.id), name: f.properties.NAME, st: STATE_FIPS[String(f.id).slice(0, 2)], c: centroid(f.geometry) }));
  const byFips = {};
  for (const line of readFileSync("scripts/geonames/US.txt", "utf8").split("\n")) {
    const t = line.split("\t");
    if (t.length < 11) continue;
    const sf = ABBR_TO_FIPS[t[4]], cty3 = t[6];
    if (!sf || !cty3) continue;
    const fips5 = sf + cty3.padStart(3, "0");
    (byFips[fips5] ||= []).push({ zip: t[1], lat: +t[9], lng: +t[10] });
  }
  countyZips = {}; let missing = 0;
  for (const co of counties) {
    const cands = byFips[co.fips];
    if (!cands || !cands.length) { missing++; continue; }
    let best = null, bd = Infinity;
    for (const z of cands) { const dx = z.lng - co.c[0], dy = z.lat - co.c[1], d = dx * dx + dy * dy; if (d < bd) { bd = d; best = z; } }
    countyZips[co.fips] = { zip: best.zip, name: co.name, st: co.st };
  }
  writeFileSync(ZIPS_CACHE, JSON.stringify(countyZips));
  console.log("rep ZIPs for", Object.keys(countyZips).length, "counties;", missing, "had no ZIP match");
}

// 2) fetch rates (resume)
const rates = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
const todo = Object.keys(countyZips).filter((f) => rates[f] == null);
console.log(`total ${Object.keys(countyZips).length}, done ${Object.keys(rates).length}, todo ${todo.length}`);

async function fetchRate(zip) {
  for (let a = 0; a < 4; a++) {
    try {
      const res = await fetch(`https://api.taxjar.com/v2/rates/${encodeURIComponent(zip)}`, { headers: { Authorization: `Bearer ${key}` } });
      if (res.status === 429) { await sleep(1500 * (a + 1)); continue; }
      if (!res.ok) throw new Error("http " + res.status);
      const { rate } = await res.json();
      const r = +rate.combined_rate;
      return isNaN(r) ? null : r;
    } catch (e) { if (a === 3) throw e; await sleep(600 * (a + 1)); }
  }
  return null;
}

let done = 0, failed = 0, i = 0;
const CONC = 3;
async function worker() {
  while (i < todo.length) {
    const fips = todo[i++];
    try { const r = await fetchRate(countyZips[fips].zip); if (r != null) rates[fips] = r; else failed++; }
    catch { failed++; }
    done++;
    if (done % 50 === 0) { writeFileSync(OUT, JSON.stringify(rates)); console.log(`${done}/${todo.length} (failed ${failed})`); }
    await sleep(120);
  }
}
await Promise.all(Array.from({ length: CONC }, worker));
writeFileSync(OUT, JSON.stringify(rates));
console.log(`DONE — ${Object.keys(rates).length} county rates, ${failed} failed`);
