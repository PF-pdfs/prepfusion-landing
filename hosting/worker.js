// prepfusion-landing-site: serves this repo's static files from Cloudflare.
//
// This is NOT the apex redirect Worker in cloudflare/ (prepfusion-landing-
// apex), which stays exactly as it is. This one has no routes and no custom
// domain until the owner adds one; see docs/domain-switch.md.
//
// What it adds on top of plain static assets:
//   1. SITE_ORIGIN: the public origin. The canonical link, og:url, og:image,
//      twitter:image and the JSON-LD URLs in index.html are written for
//      GitHub Pages (https://go.prepfusion.in); they're rewritten here with
//      HTMLRewriter, so moving domains is a variable, not an edit.
//   2. COURSES_ORIGIN (optional): where the course platform (ClassX) lives.
//      Empty means "as written" (https://prepfusion.in). When set, course
//      links in the HTML are rewritten here, and script.js reads the same
//      value from <meta name="pf-courses-origin"> for links it builds itself
//      (the banners from banners.json).
//   3. CANONICAL_REDIRECT: "on" 301s any other hostname (e.g. go.prepfusion.in
//      after the move) to SITE_ORIGIN, keeping path and query. Off by
//      default. *.workers.dev and localhost are never redirected, so
//      previews keep working.
//   4. A cache policy (Cache-Control per path; see cacheControl()).

import { DEFAULT_COURSES_ORIGIN, DEFAULT_SITE_ORIGIN, cleanOrigin, redirectTarget, cacheControl, rewriteUrl, rewriteJsonLd } from './lib.js';

function rewriteHtml(response, siteOrigin, coursesOrigin) {
  const attr = (name) => ({
    element(el) {
      const v = el.getAttribute(name);
      if (v) el.setAttribute(name, rewriteUrl(v, siteOrigin, coursesOrigin));
    },
  });
  let ld = '';
  return new HTMLRewriter()
    .on('link[rel="canonical"]', attr('href'))
    .on('meta[property="og:url"]', attr('content'))
    .on('meta[property="og:image"]', attr('content'))
    .on('meta[name="twitter:image"]', attr('content'))
    .on('a[data-course]', attr('href'))
    .on('head', {
      element(el) {
        if (coursesOrigin !== DEFAULT_COURSES_ORIGIN) {
          el.append(`<meta name="pf-courses-origin" content="${coursesOrigin}">`, { html: true });
        }
      },
    })
    .on('script[type="application/ld+json"]', {
      text(chunk) {
        ld += chunk.text;
        if (chunk.lastInTextNode) {
          chunk.replace(rewriteJsonLd(ld, siteOrigin, coursesOrigin), { html: true });
          ld = '';
        } else {
          chunk.remove();
        }
      },
    })
    .transform(response);
}

export default {
  async fetch(request, env) {
    const target = redirectTarget(request.url, env);
    if (target) return Response.redirect(target, 301);

    const url = new URL(request.url);
    let response = await env.ASSETS.fetch(request);
    const type = response.headers.get('content-type') || '';

    if (type.includes('text/html') && response.status === 200) {
      const siteOrigin = cleanOrigin(env.SITE_ORIGIN, DEFAULT_SITE_ORIGIN);
      const coursesOrigin = cleanOrigin(env.COURSES_ORIGIN, DEFAULT_COURSES_ORIGIN);
      response = rewriteHtml(response, siteOrigin, coursesOrigin);
    }

    response = new Response(response.body, response);
    if (response.status === 200 || response.status === 304) {
      response.headers.set('Cache-Control', cacheControl(url.pathname, url.search));
    }
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return response;
  },
};
