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
 * Content source: LANDING_SITE, a service binding (see wrangler.toml) to a
 * second Cloudflare project (`prepfusion-landing`) that serves the site as
 * static assets, git-connected to this same repo's main branch — auto-
 * deploys on push, same as GitHub Pages does for go.prepfusion.in, and
 * genuinely unlimited on Cloudflare's Free plan (static-asset serving isn't
 * metered like Worker invocations are).
 *
 * NOT go.prepfusion.in, NOT raw.githubusercontent.com, NOT a plain fetch()
 * to prepfusion-landing's own workers.dev URL — all three were tried first
 * and all three failed for real, reproduced reasons:
 *   - go.prepfusion.in and a plain fetch() to prepfusion-landing's public
 *     URL both hit error 1042 (Cloudflare's same-account loop detection —
 *     it's account-scoped, not just same-zone; reproduced between two
 *     unrelated workers.dev projects, which share no DNS zone at all). The
 *     service binding above is Cloudflare's documented fix: it calls the
 *     other Worker internally, never touching the public network or its
 *     loop-detection.
 *   - raw.githubusercontent.com isn't built to be a production CDN — worked
 *     on a light check, then stalled unpredictably under repeated requests
 *     (one hit 21s, reproduced on retest).
 */

export default {
  async fetch(request, env) {
    return env.LANDING_SITE.fetch(request);
  }
};
