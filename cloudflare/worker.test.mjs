// Run with: node --test cloudflare/
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import worker, { TARGET, REDIRECT_STATUS } from './worker.js';

let passedThrough;
const realFetch = globalThis.fetch;

beforeEach(() => {
  passedThrough = [];
  globalThis.fetch = async (req) => {
    passedThrough.push(req.url);
    return new Response('origin', { status: 200 });
  };
});
afterEach(() => { globalThis.fetch = realFetch; });

const get = (url) => worker.fetch(new Request(url));

test('redirect is temporary until verified live', () => {
  assert.equal(REDIRECT_STATUS, 302);
  assert.equal(TARGET, 'https://go.prepfusion.in/');
});

for (const url of ['https://prepfusion.in/', 'http://prepfusion.in/', 'https://prepfusion.in']) {
  test(`bare root redirects: ${url}`, async () => {
    const res = await get(url);
    assert.equal(res.status, 302);
    assert.equal(res.headers.get('location'), 'https://go.prepfusion.in/');
    assert.deepEqual(passedThrough, []);
  });
}

test('root query string is preserved', async () => {
  const res = await get('https://prepfusion.in/?utm_source=wa&x=1');
  assert.equal(res.headers.get('location'), 'https://go.prepfusion.in/?utm_source=wa&x=1');
});

for (const path of ['/courses', '/some-random-path', '/new-courses?examId=6', '/terms', '/index.html', '//', '/?']) {
  const url = 'https://prepfusion.in' + path;
  test(`apex non-root path passes through untouched: ${path}`, async () => {
    const res = await get(url);
    if (new URL(url).pathname === '/') return; // '/?' is still the root
    assert.equal(res.status, 200);
    assert.equal(await res.text(), 'origin');
    assert.deepEqual(passedThrough, [new URL(url).href]);
  });
}

test('non-apex, non-root never redirects or fetches', async () => {
  const res = await get('https://prepfusion-landing-apex.prepfusion-edu-gate.workers.dev/courses');
  assert.equal(res.status, 404);
  assert.deepEqual(passedThrough, []);
});
