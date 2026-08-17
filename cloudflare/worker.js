/*
 * Redirects prepfusion.in's bare homepage to go.prepfusion.in. Nothing else.
 *
 * Deliberately NOT a full same-URL serve of the landing page — that was
 * tried three separate ways tonight (a plain fetch to go.prepfusion.in, to
 * raw.githubusercontent.com, and a service-bound static-assets project) and
 * all three hit real, reproduced reliability problems: error 1042
 * (Cloudflare's same-account loop detection, hit twice, once against
 * go.prepfusion.in directly and once against another Worker on this
 * account), raw.githubusercontent.com stalling unpredictably under repeat
 * requests (one hit 21s), and the static-assets project intermittently
 * stalling on large responses even via a service binding (up to ~20% of
 * requests over 2s in testing).
 *
 * Every one of those failures happened because the Worker had to FETCH
 * content from somewhere else. This Worker fetches nothing. It reads the
 * incoming request and immediately returns a redirect — no origin, no
 * network call, no dependency on any other Cloudflare project or
 * third-party service. There is nothing here that can stall.
 *
 * Only reached for the exact route prepfusion.in/ (see wrangler.toml) — the
 * route list itself, not this code, is what guarantees every other path on
 * the domain (every /new-courses/*, /terms, /test-series, ...) never
 * touches this Worker and flows straight to Vercel untouched.
 */

export default {
  async fetch() {
    return Response.redirect('https://go.prepfusion.in/', 301);
  }
};
