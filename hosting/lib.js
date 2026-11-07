// Pure helpers for hosting/worker.js, kept apart so the Worker module exports
// only its handler (the runtime rejects other named exports) and so they can
// be unit-tested in Node.

export const DEFAULT_SITE_ORIGIN = 'https://go.prepfusion.in';
export const DEFAULT_COURSES_ORIGIN = 'https://prepfusion.in';

const YEAR = 'public, max-age=31536000, immutable';

export function cleanOrigin(value, fallback) {
  if (!value) return fallback;
  try {
    const u = new URL(String(value).trim());
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return fallback;
    return u.origin;
  } catch {
    return fallback;
  }
}

export function isOn(value) {
  return /^(on|true|1|yes)$/i.test(String(value || '').trim());
}

// Where a request should be 301'd to, or null to serve it.
export function redirectTarget(requestUrl, env) {
  if (!isOn(env.CANONICAL_REDIRECT)) return null;
  const url = new URL(requestUrl);
  const site = new URL(cleanOrigin(env.SITE_ORIGIN, DEFAULT_SITE_ORIGIN));
  const host = url.hostname;
  if (host === site.hostname) return null;
  if (host.endsWith('.workers.dev') || host === 'localhost' || host === '127.0.0.1') return null;
  return site.origin + url.pathname + url.search;
}

// Cache-Control for a path. Versioned things (a ?v= query, a version or
// content hash in the file name) are immutable for a year; the page and
// banners.json stay short so a push shows up within minutes.
export function cacheControl(pathname, search) {
  const p = pathname.toLowerCase();
  if (p === '/' || p.endsWith('.html')) return 'public, max-age=300, must-revalidate';
  if (p === '/banners.json') return 'public, max-age=60, must-revalidate';
  if (p.startsWith('/assets/fonts/') || p.startsWith('/assets/img/opt/')) return YEAR;
  if (/\.(css|js)$/.test(p)) return /[?&]v=/.test(search) ? YEAR : 'public, max-age=300, must-revalidate';
  // Admin-portal uploads carry a unique timestamp in the name.
  if (p.startsWith('/assets/img/banners/')) return 'public, max-age=2592000';
  if (/\.(png|jpe?g|webp|avif|svg|ico)$/.test(p)) return 'public, max-age=86400';
  return 'public, max-age=300';
}

// Rewrites one absolute URL from the defaults to the configured origins.
export function rewriteUrl(value, siteOrigin, coursesOrigin) {
  if (!value) return value;
  if (value === DEFAULT_SITE_ORIGIN || value.startsWith(DEFAULT_SITE_ORIGIN + '/')) {
    return siteOrigin + value.slice(DEFAULT_SITE_ORIGIN.length);
  }
  if (value === DEFAULT_COURSES_ORIGIN || value.startsWith(DEFAULT_COURSES_ORIGIN + '/') || value.startsWith(DEFAULT_COURSES_ORIGIN + '?')) {
    return coursesOrigin + value.slice(DEFAULT_COURSES_ORIGIN.length);
  }
  return value;
}

// The JSON-LD block: course URLs first, then the site's own, so a site
// origin of https://prepfusion.in can't be mistaken for a course link.
export function rewriteJsonLd(text, siteOrigin, coursesOrigin) {
  return text
    .replace(/https:\/\/prepfusion\.in(?=[/"?])/g, coursesOrigin)
    .split(DEFAULT_SITE_ORIGIN).join(siteOrigin);
}
