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

// go.prepfusion.in is ITSELF Cloudflare-proxied, in this same zone. A plain
// fetch() to it from a Worker also on this zone re-enters Cloudflare's own
// proxy layer for a second hostname in the same account — Cloudflare's
// loop-detection can block or mangle that (surfaces as a broken/partial
// load, sometimes an explicit 1042). resolveOverride sidesteps it: it makes
// this subrequest connect straight to GitHub's serving infrastructure,
// never touching Cloudflare's proxy for go.prepfusion.in at all, while the
// URL/Host stays go.prepfusion.in so GitHub Pages' own Host-based custom
// domain routing still serves the right repo.
const RESOLVE_VIA = 'pf-pdfs.github.io';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = new URL(url.pathname + url.search, LANDING_ORIGIN);
    const originRequest = new Request(target.toString(), request);
    return fetch(originRequest, { cf: { resolveOverride: RESOLVE_VIA } });
  }
};
