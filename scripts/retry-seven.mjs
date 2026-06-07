// Retry counties still missing from public/county-rates.json by trying MANY ZIPs each (all in-county ZIPs
// nearest-first, then the nearest ZIPs overall) until TaxJar resolves one. Verbose so failures are visible.
import { readFileSync, writeFileSync } from "node:fs";

const STATE_FIPS = { "01":"AL","02":"AK","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT","10":"DE","11":"DC","12":"FL","13":"GA","15":"HI","16":"ID","17":"IL","18":"IN","19":"IA","20":"KS","21":"KY","22":"LA","23":"ME","24":"MD","25":"MA","26":"MI","27":"MN","28":"MS","29":"MO","30":"MT","31":"NE","32":"NV","33":"NH","34":"NJ","35":"NM","36":"NY","37":"NC","38":"ND","39":"OH","40":"OK","41":"OR","42":"PA","44":"RI","45":"SC","46":"SD","47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA","54":"WV","55":"WI","56":"WY" };
const ABBR_TO_FIPS = Object.fromEntries(Object.entries(STATE_FIPS).map(([f, a]) => [a, f]));
const env = readFileSync(".env.local", "utf8");
const key = (env.match(/^TAXJAR_API_KEY=(.+)$/m) || [])[1]?.trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const centroid = (g) => { const r = g.type === "Polygon" ? g.coordinates[0] : g.coordinates[0][0]; let x = 0, y = 0; for (const p of r) { x += p[0]; y += p[1]; } return [x / r.length, y / r.length]; };

const rates = JSON.parse(readFileSync("public/county-rates.json", "utf8"));
const missing = JSON.parse(readFileSync("scripts/us-counties-raw.json", "utf8")).features
  .filter((f) => STATE_FIPS[String(f.id).slice(0, 2)] && rates[String(f.id)] == null)
  .map((f) => ({ fips: String(f.id), name: f.properties.NAME, st: STATE_FIPS[String(f.id).slice(0, 2)], c: centroid(f.geometry) }));

const byFips = {}, all = [];
for (const line of readFileSync("scripts/geonames/US.txt", "utf8").split("\n")) {
  const t = line.split("\t"); if (t.length < 11) continue;
  const z = { zip: t[1], lat: +t[9], lng: +t[10] }; all.push(z);
  const sf = ABBR_TO_FIPS[t[4]], c3 = t[6]; if (sf && c3) (byFips[sf + c3.padStart(3, "0")] ||= []).push(z);
}

async function tryZip(zip) {
  for (let a = 0; a < 3; a++) {
    try {
      const res = await fetch(`https://api.taxjar.com/v2/rates/${zip}`, { headers: { Authorization: `Bearer ${key}` } });
      if (res.status === 429) { await sleep(1500 * (a + 1)); continue; }
      if (!res.ok) return { status: res.status };
      const r = +(await res.json()).rate.combined_rate; return isNaN(r) ? { status: "NaN" } : { rate: r };
    } catch { if (a === 2) return { status: "err" }; await sleep(600); }
  }
  return { status: 429 };
}

for (const m of missing) {
  const dist = (z) => { const dx = z.lng - m.c[0], dy = z.lat - m.c[1]; return dx * dx + dy * dy; };
  const inco = (byFips[m.fips] || []).slice().sort((a, b) => dist(a) - dist(b));
  const near = all.slice().sort((a, b) => dist(a) - dist(b)).slice(0, 25);
  const seen = new Set(), cands = [];
  for (const z of [...inco, ...near]) if (!seen.has(z.zip)) { seen.add(z.zip); cands.push(z); }
  console.log(`\n${m.fips} ${m.name} County, ${m.st} — ${inco.length} in-county ZIPs; trying up to 14:`);
  let got = null;
  for (const z of cands.slice(0, 14)) {
    const res = await tryZip(z.zip); await sleep(120);
    console.log(`   ${z.zip}: ${res.rate != null ? (res.rate * 100).toFixed(2) + "%" : "fail(" + res.status + ")"}`);
    if (res.rate != null) { got = { zip: z.zip, rate: res.rate }; break; }
  }
  if (got) { rates[m.fips] = got.rate; console.log(`   ✓ ${m.name} = ${(got.rate * 100).toFixed(2)}% via ${got.zip}`); }
  else console.log(`   ✗ ${m.name} still unresolved`);
}
writeFileSync("public/county-rates.json", JSON.stringify(rates));
console.log(`\ncounty-rates.json now has ${Object.keys(rates).length} of 3143`);
