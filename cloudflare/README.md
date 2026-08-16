# Putting the landing page on the prepfusion.in apex — one-time manual setup

This is the part that genuinely needs your own Cloudflare account and can't be scripted or run
from here. Do these in order. Nothing touches the live store until the very last step, and that
step is a single one-click toggle you can instantly reverse.

## Why this is safe

`prepfusion.in` is already a Cloudflare zone (set up for `pyq.prepfusion.in` — see
`gate_pdfs/cloudflare/README.md` in the sibling repo for that history). The apex `@` record is
currently **DNS only** (grey cloud), pointing straight at Vercel, which is why `prepfusion.in`
today serves the course store directly with nothing in front of it.

This Worker only ever sees five exact paths — `/`, `/styles.css`, `/script.js`, `/banners.json`,
`/assets/*` — set as explicit routes in `wrangler.toml`, not a wildcard. Cloudflare's own routing
table decides what reaches the Worker at all; every other path (`/new-courses/*`, `/terms`,
`/test-series`, `/zero-price-courses`, `/refund-policy`, `/privacy-policy`, and anything added to
the store later) never touches it and flows straight to Vercel exactly as it does today. This was
checked against the live site before writing the Worker, not assumed: the Vercel app only ever
uses `/_next/static/*` for its own assets, so there is no overlap with the five paths above.

## 1. Deploy the Worker

From this `cloudflare/` directory:

```bash
npx wrangler login
npx wrangler deploy
```

`wrangler login` opens a browser to authorize against your Cloudflare account — has to be you,
interactive. `wrangler deploy` publishes `worker.js` and creates the five routes from
`wrangler.toml`. **This step alone changes nothing visible yet** — a Worker route only fires for
traffic that's already being proxied through Cloudflare, and the apex isn't proxied until step 2.

## 2. Flip the apex to Proxied — the one step that actually changes anything

Cloudflare dashboard → this zone → DNS → the `A` record for `@` (or `prepfusion.in`) → click the
grey cloud icon so it turns **orange** (Proxied).

This is the entire change. It's also the entire rollback: click it back to grey and `prepfusion.in`
instantly goes back to talking to Vercel directly, with the Worker completely out of the path,
exactly as it behaves today.

## 3. Verify

- `https://prepfusion.in/` — should now show the landing page, with a valid certificate (Cloudflare
  issues its own edge cert automatically once a record is proxied).
- `https://prepfusion.in/new-courses?examId=6`, `/terms`, `/test-series`, `/zero-price-courses` —
  should be **completely unaffected**, same as before this change. This is the check that actually
  matters — confirm it before telling anyone the new page is live.
- `https://prepfusion.in/styles.css`, `/script.js`, `/banners.json` — should load (not 404), proving
  the Worker is serving the landing page's own assets correctly.
- SSL/TLS mode for this zone should already be **Full** (set up for `pyq` — see the sibling repo's
  doc), not Flexible. Only worth re-checking if step 3's cert looks wrong.

## If anything looks wrong

Flip the `@` record back to grey (DNS only) — instant full rollback, no waiting on propagation of
anything else. Diagnose from there before trying again.
