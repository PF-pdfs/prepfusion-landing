/*
 * Redirects the bare root of prepfusion.in to go.prepfusion.in. Nothing else.
 *
 * The primary guarantee is the route in wrangler.toml: `prepfusion.in/`
 * (no wildcard) matches ONLY the exact root path, so /courses, /terms,
 * /new-courses?examId=6, ... never invoke this Worker and go straight to
 * Vercel exactly as today. Subdomains are never matched either.
 *
 * The code below is a second, independent guard in case the route is ever
 * widened by mistake: anything that isn't the bare root on the apex is
 * passed through to the origin untouched with fetch(request). (A subrequest
 * from a route-matched Worker to its own zone goes to the origin, not back
 * into this Worker, so there is no loop.)
 *
 * 302 (temporary) on purpose until the redirect is verified live: browsers
 * cache 301s hard, and a mistaken 301 keeps sending returning visitors to
 * the wrong place long after it's rolled back. Flip REDIRECT_STATUS to 301
 * only once everything in cloudflare/README.md's checklist passes.
 *
 * The query string is kept so campaign links (/?utm_source=...) land on
 * go.prepfusion.in with their tracking parameters intact.
 */

export const TARGET = 'https://go.prepfusion.in/';
export const REDIRECT_STATUS = 302;
const APEX = 'prepfusion.in';

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === '/') {
      return Response.redirect(TARGET + url.search, REDIRECT_STATUS);
    }

    // Safety net: not the bare root. On the apex, hand the request to the
    // origin exactly as if this Worker weren't there.
    if (url.hostname === APEX) {
      return fetch(request);
    }

    // workers.dev / preview URLs: there's no origin behind them to pass to,
    // and fetch(request) would just call this Worker again.
    return new Response('Not found', { status: 404 });
  }
};
