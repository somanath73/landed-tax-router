// Netlify Function — server-side TaxJar proxy. The key lives in this function's env (TAXJAR_API_KEY,
// set in the Netlify dashboard), never in the client bundle. The browser calls /api/taxrate
// (mapped here in netlify.toml), same-origin, so there is no CORS problem.
export async function handler(event) {
  const key = process.env.TAXJAR_API_KEY;
  const reply = (statusCode, body) => ({ statusCode, headers: { "content-type": "application/json" }, body });
  if (!key) return reply(501, JSON.stringify({ error: "TAXJAR_API_KEY not set" }));
  const zip = (event.queryStringParameters || {}).zip;
  if (!zip) return reply(400, JSON.stringify({ error: "zip required" }));
  try {
    const r = await fetch(`https://api.taxjar.com/v2/rates/${encodeURIComponent(zip)}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    return reply(r.status, await r.text());
  } catch (e) {
    return reply(502, JSON.stringify({ error: String((e && e.message) || e) }));
  }
}
