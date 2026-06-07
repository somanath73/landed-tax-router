import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Dev-only proxy: serves /api/taxrate by calling TaxJar server-side (no CORS; the key stays on the server).
// In production the same path is handled by netlify/functions/taxrate.js (mapped in netlify.toml).
function taxProxy(key) {
  return {
    name: "tax-proxy",
    configureServer(server) {
      server.middlewares.use("/api/taxrate", async (req, res) => {
        res.setHeader("content-type", "application/json");
        if (!key) { res.statusCode = 501; return res.end(JSON.stringify({ error: "TAXJAR_API_KEY not set" })); }
        try {
          const zip = new URL(req.originalUrl || req.url, "http://localhost").searchParams.get("zip");
          if (!zip) { res.statusCode = 400; return res.end(JSON.stringify({ error: "zip required" })); }
          const r = await fetch(`https://api.taxjar.com/v2/rates/${encodeURIComponent(zip)}`, { headers: { Authorization: `Bearer ${key}` } });
          res.statusCode = r.status;
          res.end(await r.text());
        } catch (e) {
          res.statusCode = 502;
          res.end(JSON.stringify({ error: String((e && e.message) || e) }));
        }
      });
    },
  };
}

// Minimal harness so the single-file component can run live in a browser.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ""); // "" = load all vars (incl. non-VITE_) for server-side use
  return {
    base: process.env.BASE_PATH || "/", // "/" for local/Netlify; set to "/landed-tax-router/" for GitHub Pages
    plugins: [react(), taxProxy(env.TAXJAR_API_KEY)],
    server: { port: 5173, open: false },
  };
});
