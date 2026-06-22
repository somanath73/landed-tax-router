// Build public/zip-fips.json (ZIP -> 5-digit county FIPS) from GeoNames US.txt, keeping only ZIPs
// whose county has a rate in public/county-rates.json. The router joins ZIP -> FIPS -> exact county rate.
import { readFileSync, writeFileSync } from "node:fs";

const STATE_FIPS = { "01":"AL","02":"AK","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT","10":"DE","11":"DC","12":"FL","13":"GA","15":"HI","16":"ID","17":"IL","18":"IN","19":"IA","20":"KS","21":"KY","22":"LA","23":"ME","24":"MD","25":"MA","26":"MI","27":"MN","28":"MS","29":"MO","30":"MT","31":"NE","32":"NV","33":"NH","34":"NJ","35":"NM","36":"NY","37":"NC","38":"ND","39":"OH","40":"OK","41":"OR","42":"PA","44":"RI","45":"SC","46":"SD","47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA","54":"WV","55":"WI","56":"WY" };
const ABBR_TO_FIPS = Object.fromEntries(Object.entries(STATE_FIPS).map(([f, a]) => [a, f]));

const rates = JSON.parse(readFileSync("public/county-rates.json", "utf8"));
const lines = readFileSync("scripts/geonames/US.txt", "utf8").split("\n");
const out = {};
let hit = 0, miss = 0;
for (const line of lines) {
  if (!line) continue;
  const c = line.split("\t");
  const zip = c[1], abbr = c[4], cc = c[6];
  const sf = ABBR_TO_FIPS[abbr];
  if (!zip || !sf || !cc) { miss++; continue; }
  const fips = sf + cc.padStart(3, "0");
  if (rates[fips] == null) { miss++; continue; }
  out[zip] = fips; // last write wins for split ZIPs (true rooftop split needs the tax API)
  hit++;
}
writeFileSync("public/zip-fips.json", JSON.stringify(out));
console.log("zip-fips.json:", Object.keys(out).length, "ZIPs (rows kept", hit, "skipped", miss + ")");
