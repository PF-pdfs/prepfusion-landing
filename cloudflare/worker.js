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
 * collision with the paths this Worker claims. Every request that reaches
 * this Worker at all is, by construction, one of the five landing-page
 * paths below — there is nothing else for it to route between.
 */

const LANDING_ORIGIN = 'https://go.prepfusion.in';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = new URL(url.pathname + url.search, LANDING_ORIGIN);
    // Same method/headers/body, refetched against the landing page's own
    // working GitHub Pages custom domain (already has a valid cert, already
    // live) instead of whatever hostname the browser actually asked for.
    return fetch(new Request(target.toString(), request));
  }
};
