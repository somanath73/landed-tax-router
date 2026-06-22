// Build public/counties.json: one representative point per county for nearby lower-tax candidate generation.
// { fips: [lat, lng, combinedRate, "RepresentativeCity", "ST"] } — ~3,140 counties, ~140 KB.
import { readFileSync, writeFileSync } from "node:fs";

const rates = JSON.parse(readFileSync("public/county-rates.json", "utf8"));        // fips -> combined rate
const czips = JSON.parse(readFileSync("scripts/county-zips.json", "utf8"));        // fips -> {zip, name(county), st}

// zip -> {city, lat, lng} from GeoNames (first occurrence wins)
const geo = {};
for (const line of readFileSync("scripts/geonames/US.txt", "utf8").split("\n")) {
  if (!line) continue;
  const c = line.split("\t");
  const zip = c[1];
  if (zip && !geo[zip]) geo[zip] = { city: c[2], lat: +c[9], lng: +c[10] };
}

const r4 = (n) => Math.round(n * 1e4) / 1e4;
const out = {};
let miss = 0;
for (const fips in rates) {
  const cz = czips[fips];
  const g = cz && geo[cz.zip];
  if (!g || !isFinite(g.lat) || !isFinite(g.lng)) { miss++; continue; }
  out[fips] = [r4(g.lat), r4(g.lng), rates[fips], g.city, cz.st];
}
writeFileSync("public/counties.json", JSON.stringify(out));
console.log("counties.json:", Object.keys(out).length, "counties (skipped", miss + ")");
