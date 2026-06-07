// Slim the national county GeoJSON for the client: round coords (~11m), keep only id + name + state abbr.
// Writes public/us-counties.geo.json (lazy-loaded by the app when you drill into a non-FL state).
import { readFileSync, writeFileSync } from "node:fs";

const STATE_FIPS = { "01":"AL","02":"AK","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT","10":"DE","11":"DC","12":"FL","13":"GA","15":"HI","16":"ID","17":"IL","18":"IN","19":"IA","20":"KS","21":"KY","22":"LA","23":"ME","24":"MD","25":"MA","26":"MI","27":"MN","28":"MS","29":"MO","30":"MT","31":"NE","32":"NV","33":"NH","34":"NJ","35":"NM","36":"NY","37":"NC","38":"ND","39":"OH","40":"OK","41":"OR","42":"PA","44":"RI","45":"SC","46":"SD","47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA","54":"WV","55":"WI","56":"WY" };
const round = (n) => Math.round(n * 1e4) / 1e4;
const roundRing = (ring) => ring.map(([a, b]) => [round(a), round(b)]);
const roundGeom = (g) => g.type === "Polygon"
  ? { type: "Polygon", coordinates: g.coordinates.map(roundRing) }
  : { type: "MultiPolygon", coordinates: g.coordinates.map((poly) => poly.map(roundRing)) };

const src = JSON.parse(readFileSync("scripts/us-counties-raw.json", "utf8"));
const features = [];
for (const ft of src.features) {
  const st = STATE_FIPS[String(ft.id).slice(0, 2)];
  if (!st) continue; // skip territories (PR, etc.)
  features.push({ type: "Feature", id: String(ft.id), properties: { name: ft.properties.NAME, st }, geometry: roundGeom(ft.geometry) });
}
writeFileSync("public/us-counties.geo.json", JSON.stringify({ type: "FeatureCollection", features }));
console.log("wrote", features.length, "counties across", new Set(features.map((f) => f.properties.st)).size, "states");
