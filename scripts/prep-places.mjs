// Build a US place autocomplete index from GeoNames: one entry per (city, state) with a representative ZIP + coords.
// Writes public/us-places.json as [[name, stateAbbr, zip, lat2dp, lng2dp], ...] sorted by name.
import { readFileSync, writeFileSync } from "node:fs";

const seen = new Set(), out = [];
for (const line of readFileSync("scripts/geonames/US.txt", "utf8").split("\n")) {
  const t = line.split("\t");
  if (t.length < 11) continue;
  const zip = t[1], name = t[2], st = t[4], lat = +t[9], lng = +t[10];
  if (!name || !st || !/^\d{5}$/.test(zip) || isNaN(lat)) continue;
  const key = name.toLowerCase() + "|" + st;
  if (seen.has(key)) continue;
  seen.add(key);
  out.push([name, st, zip, Math.round(lat * 100) / 100, Math.round(lng * 100) / 100]);
}
out.sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]));
writeFileSync("public/us-places.json", JSON.stringify(out));
console.log("places:", out.length);
