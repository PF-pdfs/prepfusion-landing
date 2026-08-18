/*
 * The fallback half of the domain-swap bridge. See wrangler.toml for the
 * full picture and why the split matters.
 *
 * This code only ever runs for a request that matched NO static asset —
 * i.e. not the landing page, not its CSS/JS/images. In practice that means
 * the old store URLs (/new-courses/..., /terms, /test-series, ...) that
 * still point at this domain from bookmarks, shared links, search results
 * and backlinks. Each one gets a permanent redirect to the same path on
 * courses.prepfusion.in, so nothing that used to work starts 404ing.
 *
 * Path AND query string are both preserved: /new-courses?examId=6 has to
 * land on /new-courses?examId=6, not a bare /new-courses, or the visitor
 * ends up somewhere real but wrong — worse than an error, because it looks
 * deliberate.
 *
 * 301 (permanent) rather than 302: this tells search engines to move their
 * index to the new URL, which is the entire point of running this bridge.
 * The tradeoff is that browsers cache 301s aggressively — if the store's
 * domain ever changes again, expect returning visitors to keep hitting the
 * cached redirect for a while.
 */

const STORE_ORIGIN = 'https://courses.prepfusion.in';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    return Response.redirect(STORE_ORIGIN + url.pathname + url.search, 301);
  }
};
