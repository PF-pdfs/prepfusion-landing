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
 * Content source: raw.githubusercontent.com, NOT go.prepfusion.in or
 * pf-pdfs.github.io. Two things ruled those out, both confirmed live rather
 * than assumed:
 *   - go.prepfusion.in is itself Cloudflare-proxied, in this same zone. A
 *     Worker fetch() to another hostname proxied by the same account
 *     re-enters Cloudflare's own proxy layer a second time, and its
 *     loop-detection blocks it outright (error 1042 — reproduced against
 *     the Worker's own workers.dev URL before this fix, not guessed).
 *   - pf-pdfs.github.io (the raw GitHub Pages host) doesn't serve content
 *     directly once a custom domain is configured — it unconditionally
 *     301s to go.prepfusion.in, right back into the same problem.
 * raw.githubusercontent.com is an entirely different GitHub service with no
 * relationship to Pages, custom domains, or this Cloudflare zone/account —
 * no loop possible. The tradeoff: it serves every file as
 * text/plain+nosniff regardless of actual type, so this Worker sets the
 * real Content-Type itself (see CONTENT_TYPES below) — without that, a
 * browser refuses to render the HTML or apply the CSS/JS as-is.
 */

const RAW_BASE = 'https://raw.githubusercontent.com/PF-pdfs/prepfusion-landing/main/';

const PATH_TO_FILE = {
  '/': 'index.html',
  '/styles.css': 'styles.css',
  '/script.js': 'script.js',
  '/banners.json': 'banners.json'
};

const CONTENT_TYPES = {
  html: 'text/html; charset=utf-8',
  css: 'text/css; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  json: 'application/json; charset=utf-8',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  ico: 'image/x-icon'
};

function contentTypeFor(filePath) {
  const ext = filePath.split('.').pop().toLowerCase();
  return CONTENT_TYPES[ext] || 'application/octet-stream';
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    // "/" and the four fixed files map explicitly; "/assets/*" (the only
    // wildcard route) passes its path straight through — both land on a
    // real file in the repo, since the route list itself guarantees
    // nothing else reaches this Worker.
    const filePath = PATH_TO_FILE[url.pathname] || url.pathname.replace(/^\//, '');
    const upstream = await fetch(RAW_BASE + filePath, { cf: { cacheTtl: 300 } });

    if (!upstream.ok) return upstream;

    const headers = new Headers(upstream.headers);
    headers.set('Content-Type', contentTypeFor(filePath));
    headers.delete('x-content-type-options');
    // GitHub sends `content-security-policy: default-src 'none'; sandbox` on
    // raw.githubusercontent.com responses specifically so raw content can
    // never function as a live page — sandbox alone disables script
    // execution outright, and default-src 'none' blocks the Google Fonts
    // stylesheet, the banners.json fetch, everything. Confirmed live: the
    // HTML arrived byte-correct and still didn't render, because of this.
    // frame-options/xss-protection are GitHub's raw-content headers too and
    // equally meaningless once this is actually being served as a page.
    headers.delete('content-security-policy');
    headers.delete('x-frame-options');
    headers.delete('x-xss-protection');
    return new Response(upstream.body, { status: upstream.status, headers });
  }
};
