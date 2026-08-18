# Domain swap: landing page onto prepfusion.in, store onto courses.prepfusion.in

This Worker is the **bridge** that makes the swap safe: it serves the landing page at
`prepfusion.in`, and 301s every other path — all the old store URLs — to the same path on
`courses.prepfusion.in`. Without it, every existing bookmark, shared WhatsApp link, backlink and
Google result pointing at a course page would 404 the moment the domain changes.

It is meant to be **temporary**. Once links and search results have had time to update (a few
weeks is reasonable), the Worker can be deleted and the apex pointed straight at the landing page.

## ⚠ Prerequisite — do NOT deploy before this is true

**`courses.prepfusion.in` must already be live, serving the store, with the same URL structure.**

This is not a DNS-only step. Vercel will not serve a hostname that its project hasn't been
configured to accept, so **Appx has to add `courses.prepfusion.in` as a domain on their Vercel
project** — pointing DNS at Vercel without that gets a Vercel error page, not the store.

Verify before touching anything here:

```bash
curl -sI https://courses.prepfusion.in/new-courses?examId=6
curl -s https://courses.prepfusion.in/terms | head -c 300
```

Both must return the real store — not a Vercel 404, not an error page. If they don't, stop:
deploying this bridge now would redirect every old store URL to a dead domain, which is worse
than leaving things alone, because it breaks the whole catalogue instead of one page.

## How the two halves split

`wrangler.toml`'s `[assets]` uploads the landing page's files to Cloudflare's storage. A request
matching one of those files is served **directly from storage — `worker.js` is never invoked**,
no CPU used, nothing billed against the Workers request quota. Only a request matching **no**
static file falls through to `worker.js`, which 301s it to `courses.prepfusion.in`.

That's also why the Free plan's 100,000 requests/day isn't a concern: the landing page itself —
the overwhelming majority of traffic — costs zero Worker invocations. Only redirects of old store
URLs count, and that number *declines over time* as links and indexes update. Exactly the traffic
shape a temporary bridge should have.

## Deploy

```bash
cd cloudflare
npx wrangler deploy
```

Then test on the isolated `workers.dev` URL **before** touching live DNS —
`prepfusion-landing-apex.<account subdomain>.workers.dev`. Confirm both halves:

- `/` and `/styles.css` serve the landing page's own content
- `/terms` and `/new-courses?examId=6` return a 301 to the matching `courses.prepfusion.in` URL

## Going live

Point the apex `A`/`CNAME` record for `prepfusion.in` at this Worker and set it **Proxied**
(orange cloud) — a Worker route only fires for traffic Cloudflare is actually proxying.

**Rollback** is the same toggle: set the record back to DNS-only (grey) and the apex goes back to
whatever the record points at directly, with the Worker completely out of the path.

## Verify after going live

```bash
curl -sI https://prepfusion.in/                      # 200, the landing page
curl -sI https://prepfusion.in/terms                 # 301 -> courses.prepfusion.in/terms
curl -sI "https://prepfusion.in/new-courses?examId=6" # 301, query string preserved
```

Then load `https://prepfusion.in/` in a real browser and click through to a course — the whole
path from landing page to store checkout should work end to end.

## Known limits / what this does not fix

- **The mobile apps.** If the Android/iOS/desktop apps hardcode `prepfusion.in` anywhere, this
  bridge does not reach them — installed apps don't consult it. Only Appx can confirm and fix
  that, and app-store review means a fix isn't fast. Check before swapping, not after.
- **Payment gateway + API config.** Webhook URLs, redirect URLs and CORS allowed-origins
  registered against `prepfusion.in` are Appx-side configuration. A redirect does not update them.
- **SEO.** 301s pass most ranking value, but a domain move still typically costs some search
  traffic temporarily while Google re-indexes.
