/*
 * Serves the landing page at the prepfusion.in APEX while every other path
 * on the domain (the course store on Vercel) keeps working completely
 * unchanged.
 *
 * Why this is safe: the routes in wrangler.toml are an EXACT list — "/",
 * "/styles.css", "/script.js", "/banners.json", "/assets/*". Cloudflare's
 * own routing table decides what reaches this Worker at all; anything not
 * on that list (every /new-courses/*, /terms, /test-series, ...) is never
 * seen here — it flows straight to Vercel exactly as it did before this
 * Worker existed. Verified against the live Vercel app before writing this:
 * it only ever uses /_next/static/* for its own assets, so there is no
 * collision with the paths this Worker claims.
 *
 * Content source: a second, separate Cloudflare project named
 * `prepfusion-landing` (dashboard-created, git-connected to this same repo's
 * main branch — auto-deploys on every push, same as GitHub Pages does for
 * go.prepfusion.in) serving the site as static assets straight from
 * Cloudflare's own storage, at its workers.dev URL below — NOT
 * go.prepfusion.in, NOT raw.githubusercontent.com. Both of those were tried
 * first and both failed for real, reproduced reasons, not guessed:
 *   - go.prepfusion.in is Cloudflare-proxied in this SAME zone. A Worker
 *     fetch() to another same-zone-proxied hostname re-enters Cloudflare's
 *     own proxy layer a second time and its loop-detection blocks it
 *     outright (error 1042, reproduced against this Worker's own
 *     workers.dev URL).
 *   - raw.githubusercontent.com isn't built to be a production CDN — it
 *     works, but stress-tested with repeated requests it stalled multiple
 *     seconds unpredictably (one request took 21s). Not a one-off; it
 *     recurred on retest.
 * A Worker's own workers.dev URL is on Cloudflare's workers.dev zone, not
 * prepfusion.in, so there's no same-zone loop — and static-assets serving
 * is genuinely just Cloudflare's storage, not a third party. Verified
 * before wiring this in: 13 requests back to back, sub-1.2s every time, no
 * stalls, correct Content-Type/no CSP sent automatically (no header
 * rewriting needed here, unlike the raw.githubusercontent.com attempt).
 */

const LANDING_ORIGIN = 'https://prepfusion-landing.prepfusion-edu-gate.workers.dev';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    return fetch(LANDING_ORIGIN + url.pathname + url.search);
  }
};
