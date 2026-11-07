// node --test hosting/worker.test.mjs
// Unit tests for the hosting Worker's pure parts. The HTMLRewriter path is
// checked end to end with `npx wrangler dev` (see docs/domain-switch.md).
import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './worker.js';
import { redirectTarget, cacheControl, rewriteUrl, rewriteJsonLd, cleanOrigin, isOn } from './lib.js';

test('redirect is off by default and for unset/garbage values', () => {
  assert.equal(redirectTarget('https://go.prepfusion.in/x', {}), null);
  assert.equal(redirectTarget('https://go.prepfusion.in/x', { CANONICAL_REDIRECT: 'off', SITE_ORIGIN: 'https://prepfusion.in' }), null);
  assert.equal(isOn('nope'), false);
});

test('redirect 301 target keeps path and query, only for other hosts', () => {
  const env = { CANONICAL_REDIRECT: 'on', SITE_ORIGIN: 'https://prepfusion.in' };
  assert.equal(redirectTarget('https://go.prepfusion.in/?utm_source=t#x', env), 'https://prepfusion.in/?utm_source=t');
  assert.equal(redirectTarget('https://go.prepfusion.in/assets/img/og-preview.jpg', env), 'https://prepfusion.in/assets/img/og-preview.jpg');
  assert.equal(redirectTarget('https://prepfusion.in/', env), null);
  assert.equal(redirectTarget('https://prepfusion-landing-site.example.workers.dev/', env), null);
  assert.equal(redirectTarget('http://localhost:8787/', env), null);
});

test('fetch returns a real 301 when the redirect is on', async () => {
  const env = { CANONICAL_REDIRECT: 'true', SITE_ORIGIN: 'https://prepfusion.in', ASSETS: { fetch: () => { throw new Error('should not reach assets'); } } };
  const r = await worker.fetch(new Request('https://go.prepfusion.in/faq?a=1'), env);
  assert.equal(r.status, 301);
  assert.equal(r.headers.get('location'), 'https://prepfusion.in/faq?a=1');
});

test('fetch passes non-HTML assets through with the cache policy', async () => {
  const env = { ASSETS: { fetch: async () => new Response('{}', { headers: { 'content-type': 'application/json' } }) } };
  const r = await worker.fetch(new Request('https://go.prepfusion.in/banners.json'), env);
  assert.equal(r.headers.get('cache-control'), 'public, max-age=60, must-revalidate');
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
});

test('cache policy: long for versioned, short for HTML and banners.json', () => {
  assert.match(cacheControl('/', ''), /max-age=300/);
  assert.match(cacheControl('/index.html', ''), /max-age=300/);
  assert.match(cacheControl('/banners.json', ''), /max-age=60/);
  assert.match(cacheControl('/styles.css', '?v=20261107a'), /immutable/);
  assert.match(cacheControl('/script.js', '?v=1'), /immutable/);
  assert.doesNotMatch(cacheControl('/script.js', ''), /immutable/);
  assert.match(cacheControl('/assets/fonts/sora-latin-var.v17.woff2', ''), /immutable/);
  assert.match(cacheControl('/assets/img/opt/banners/x-800.avif', ''), /immutable/);
  assert.match(cacheControl('/assets/img/banners/123-x.jpg', ''), /max-age=2592000/);
  assert.match(cacheControl('/assets/img/og-preview.jpg', ''), /max-age=86400/);
});

test('URL rewriting: site and course origins are independent', () => {
  const s = 'https://prepfusion.in', c = 'https://courses.prepfusion.in';
  assert.equal(rewriteUrl('https://go.prepfusion.in/', s, c), 'https://prepfusion.in/');
  assert.equal(rewriteUrl('https://go.prepfusion.in/assets/img/og-preview.jpg', s, c), 'https://prepfusion.in/assets/img/og-preview.jpg');
  assert.equal(rewriteUrl('https://prepfusion.in/refund-policy', s, c), 'https://courses.prepfusion.in/refund-policy');
  assert.equal(rewriteUrl('https://prepfusion.in/new-courses?examId=4', s, c), 'https://courses.prepfusion.in/new-courses?examId=4');
  assert.equal(rewriteUrl('https://hub.prepfusion.in/', s, c), 'https://hub.prepfusion.in/');
  assert.equal(rewriteUrl('https://prepfusion.in.evil.example/', s, c), 'https://prepfusion.in.evil.example/');
});

test('JSON-LD: course URLs move to the course host, the site to SITE_ORIGIN', () => {
  const src = '{"@id":"https://go.prepfusion.in/#org","url":"https://go.prepfusion.in/","c":"https://prepfusion.in/new-courses/41-x","h":"https://hub.prepfusion.in/"}';
  const out = rewriteJsonLd(src, 'https://prepfusion.in', 'https://courses.prepfusion.in');
  assert.equal(out, '{"@id":"https://prepfusion.in/#org","url":"https://prepfusion.in/","c":"https://courses.prepfusion.in/new-courses/41-x","h":"https://hub.prepfusion.in/"}');
  // Defaults change nothing.
  assert.equal(rewriteJsonLd(src, 'https://go.prepfusion.in', 'https://prepfusion.in'), src);
});

test('origins are validated', () => {
  assert.equal(cleanOrigin('https://prepfusion.in/some/path', 'x'), 'https://prepfusion.in');
  assert.equal(cleanOrigin('javascript:alert(1)', 'fallback'), 'fallback');
  assert.equal(cleanOrigin('', 'fallback'), 'fallback');
});
