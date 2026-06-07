// Fill counties missing from public/county-rates.json (the ~17 with no in-county ZIP match or a failed call).
// Falls back to the nearest GeoNames ZIP overall (may be just across a county line — approximate, but better than n/a).
import { readFileSync, writeFileSync } from "node:fs";

const STATE_FIPS = { "01":1,"02":1,"04":1,"05":1,"06":1,"08":1,"09":1,"10":1,"11":1,"12":1,"13":1,"15":1,"16":1,"17":1,"18":1,"19":1,"20":1,"21":1,"22":1,"23":1,"24":1,"25":1,"26":1,"27":1,"28":1,"29":1,"30":1,"31":1,"32":1,"33":1,"34":1,"35":1,"36":1,"37":1,"38":1,"39":1,"40":1,"41":1,"42":1,"44":1,"45":1,"46":1,"47":1,"48":1,"49":1,"50":1,"51":1,"53":1,"54":1,"55":1,"56":1 };
const env = readFileSync(".env.local", "utf8");
const key = (env.match(/^TAXJAR_API_KEY=(.+)$/m) || [])[1]?.trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const centroid = (g) => { const r = g.type === "Polygon" ? g.coordinates[0] : g.coordinates[0][0]; let x = 0, y = 0; for (const p of r) { x += p[0]; y += p[1]; } return [x / r.length, y / r.length]; };

const rates = JSON.parse(readFileSync("public/county-rates.json", "utf8"));
const missing = JSON.parse(readFileSync("scripts/us-counties-raw.json", "utf8")).features
  .filter((f) => STATE_FIPS[String(f.id).slice(0, 2)] && rates[String(f.id)] == null)
  .map((f) => ({ fips: String(f.id), name: f.properties.NAME, c: centroid(f.geometry) }));
console.log("missing:", missing.length, "→", missing.map((m) => `${m.fips} ${m.name}`).join(", "));

const zips = [];
for (const line of readFileSync("scripts/geonames/US.txt", "utf8").split("\n")) { const t = line.split("\t"); if (t.length < 11) continue; zips.push({ zip: t[1], lat: +t[9], lng: +t[10] }); }

async function rate(zip) {
  for (let a = 0; a < 4; a++) {
    try {
      const res = await fetch(`https://api.taxjar.com/v2/rates/${zip}`, { headers: { Authorization: `Bearer ${key}` } });
      if (res.status === 429) { await sleep(1500 * (a + 1)); continue; }
      if (!res.ok) throw new Error("http " + res.status);
      const r = +(await res.json()).rate.combined_rate; return isNaN(r) ? null : r;
    } catch (e) { if (a === 3) return null; await sleep(600 * (a + 1)); }
  }
  return null;
}

let filled = 0;
for (const m of missing) {
  let best = null, bd = Infinity;
  for (const z of zips) { const dx = z.lng - m.c[0], dy = z.lat - m.c[1], d = dx * dx + dy * dy; if (d < bd) { bd = d; best = z; } }
  const r = await rate(best.zip);
  if (r != null) { rates[m.fips] = r; filled++; console.log(`  ${m.fips} ${m.name} → ${best.zip} = ${(r * 100).toFixed(2)}%`); }
  else console.log(`  ${m.fips} ${m.name} → ${best.zip} FAILED`);
  await sleep(150);
}
writeFileSync("public/county-rates.json", JSON.stringify(rates));
console.log(`filled ${filled}; county-rates.json now has ${Object.keys(rates).length}`);
