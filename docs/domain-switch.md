# Domain switch runbook

How this page moves from GitHub Pages at go.prepfusion.in to Cloudflare, and later to the core
domain prepfusion.in, with a dashboard change at each step instead of a rebuild.

**Nothing in this document has been done.** No DNS records, custom domains, routes, variables or
deploys were changed while preparing it. Every step below is the owner's call.

## What exists in the repo

| Piece | Where | What it does |
|---|---|---|
| The site | repo root (`index.html`, `styles.css`, `script.js`, `assets/`, `banners.json`) | Static files, no build step. GitHub Pages serves them today. |
| Hosting Worker `prepfusion-landing-site` | `wrangler.toml` (root), `hosting/worker.js`, `hosting/lib.js` | Serves the same files from Cloudflare (Workers static assets). No routes, no custom domain. |
| Asset ignore list | `.assetsignore` | Keeps Worker source, tools, docs and GitHub-only files out of the upload. |
| Apex redirect Worker `prepfusion-landing-apex` | `cloudflare/` | **Unchanged and unrelated.** Read `cloudflare/README.md` before touching the apex. |

### The three Worker variables

Set them in the dashboard: Workers & Pages → prepfusion-landing-site → Settings → Variables and
Secrets. They are deliberately **not** in `wrangler.toml` (every push redeploys from that file, and
the admin portal pushes `banners.json`), and `keep_vars = true` stops a deploy from wiping them.

| Variable | Unset means | What it changes |
|---|---|---|
| `SITE_ORIGIN` | `https://go.prepfusion.in` | Canonical link, `og:url`, `og:image`, `twitter:image` and the JSON-LD URLs, rewritten in the HTML on the way out. |
| `COURSES_ORIGIN` | `https://prepfusion.in` | Every course, policy and banner link (ClassX). The Worker rewrites links in the HTML and passes the value to `script.js` through `<meta name="pf-courses-origin">` for the banners it builds. |
| `CANONICAL_REDIRECT` | off | `on` 301s every other hostname to `SITE_ORIGIN`, keeping path and query. Never redirects `*.workers.dev` or localhost. |

`go.prepfusion.in` is written in one place in the source: the SEO block in `index.html`'s `<head>`.
Those are the GitHub Pages defaults (the tags need absolute URLs); under Cloudflare the Worker
rewrites all of them from `SITE_ORIGIN`. On GitHub Pages, `COURSES_ORIGIN` is the constant
`DEFAULT_COURSES_ORIGIN` at the top of `script.js`.

### Cache policy (set by the Worker)

| What | Cache-Control |
|---|---|
| HTML (`/`, `*.html`) | `public, max-age=300, must-revalidate` |
| `banners.json` | `public, max-age=60, must-revalidate` |
| `styles.css` / `script.js` with `?v=` | `public, max-age=31536000, immutable` (bump `?v=` in `index.html` on every change) |
| `assets/fonts/*`, `assets/img/opt/*` (versioned names) | `public, max-age=31536000, immutable` |
| `assets/img/banners/*` (admin uploads, unique names) | `public, max-age=2592000` |
| Other images | `public, max-age=86400` |

GitHub Pages ignores all of this and keeps its own 10-minute default; nothing changes there.

## Keeping `banners.json` updates flowing

The admin portal (`PrepFusion-StudyHub-AdminsPortal/server/routes/websiteBanners.js`) commits
`banners.json` and the uploaded image to `main`. GitHub Pages republishes on every push today and
keeps doing so. Under Cloudflare, every push to `main` must also redeploy the Worker.

**Recommended: Workers Builds.** No secret in the repo, nothing to maintain.

1. Workers & Pages → Create → Import a repository → `PF-pdfs/prepfusion-landing`
   (or, once the Worker exists: the Worker → Settings → Build → Connect).
2. Project name `prepfusion-landing-site`, production branch `main`, root directory `/`.
3. Build command: *(empty)*. Deploy command: `npx wrangler deploy`.
4. Leave "Builds for non-production branches" on if you want a preview URL per branch.

**Fallback: a GitHub Action.** Only if Workers Builds can't be used. Create an API token with the
"Edit Cloudflare Workers" template, add it as the repo secret `CLOUDFLARE_API_TOKEN` (and
`CLOUDFLARE_ACCOUNT_ID`), then add `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare
on:
  push:
    branches: [main]
  workflow_dispatch:
concurrency: deploy-landing
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy
```

Either way the admin portal changes nothing: it keeps committing the same file to the same path.

A banner uploaded after `tools/optimize-images.mjs` last ran has no AVIF/WebP variants yet; the page
falls back to the original upload for it. Run the script and commit when convenient
(`cd tools && npm install && node optimize-images.mjs`).

## First deploy (before either step)

1. Connect Workers Builds as above (or run `npx wrangler deploy` once from the repo root).
2. Open the `workers.dev` URL it prints. Check the page, the banners, the theme toggle and a few
   course links. Nothing public has changed: go.prepfusion.in is still GitHub Pages.

## Step 1: go.prepfusion.in from GitHub Pages to Cloudflare

Today (checked 7 Nov 2026) `go.prepfusion.in` is a **proxied** CNAME to GitHub Pages: responses
carry `Server: cloudflare`, a `CF-RAY` and `x-github-request-id`. So Cloudflare is already in the
path and nothing about the apex is involved.

1. DNS → note down the exact `go` record as it is now (type, target, proxy status). It's the rollback.
2. Worker → Settings → Variables: `SITE_ORIGIN = https://go.prepfusion.in` (also the default).
3. Worker → Settings → Domains & Routes → Add → Custom Domain → `go.prepfusion.in`. If Cloudflare
   says a DNS record already exists, delete the `go` CNAME and add the custom domain straight away;
   Cloudflare creates its own record and certificate. This is the switch.
4. Run the checks below.

**Rollback:** remove the custom domain, then recreate the `go` record exactly as noted in 1.
GitHub Pages is still configured (`CNAME` file in the repo) and serves again within minutes.

Keep the `CNAME` file and the GitHub Pages setting for at least a few weeks after step 1, so the
rollback stays one DNS change.

## Step 2 (later): move the page to prepfusion.in

### Prerequisite: ClassX leaves the apex first

prepfusion.in is ClassX's course site on Vercel, run by someone else. It must move to its own
hostname (for example `courses.prepfusion.in`), set up by whoever runs it, **before** this step.
Until then the apex must **not** be proxied: `cloudflare/README.md` records that proxying it made
ClassX show Indian students SGD prices (ClassX geolocates by the connecting IP, which becomes a
Cloudflare server). Confirm with the ClassX side that the new hostname shows INR from India
*through* whatever setup it ends up with.

### The switch

1. Worker → Variables: `COURSES_ORIGIN = https://courses.prepfusion.in` (the new ClassX host).
   Course, policy and banner links now point there.
2. Worker → Domains & Routes → add Custom Domain `prepfusion.in`. (The apex record must no longer
   point at Vercel; ClassX has moved.)
3. Worker → Variables: `SITE_ORIGIN = https://prepfusion.in`.
4. Worker → Variables: `CANONICAL_REDIRECT = on`. go.prepfusion.in now 301s to the apex with path
   and query kept.
5. Old ClassX paths on the apex must keep working for old links and search results. Add one
   Bulk Redirect list (Rules → Redirect Rules → Bulk Redirects, or a single dynamic Redirect Rule)
   on `prepfusion.in` sending these paths to the new course host with status 301, keeping path and
   query:
   `/courses*`, `/new-courses*`, `/zero-price-courses*`, `/test-series*`, `/refund-policy`,
   `/terms`, `/privacy-policy`, `/login*`, `/signup*`, `/my-courses*`, `/course/*`, `/checkout*`.
   Ask ClassX for their full list of public paths first and add any missing ones.
   (Alternative: add the same path list to `hosting/lib.js` as redirects in the Worker.)

Steps 2 to 4 are the switch: a domain and two variables in the dashboard. Step 1 and step 5 are
preparation that can be done just before.

Also, once the apex serves this page, the old `prepfusion-landing-apex` Worker (route
`prepfusion.in/`) must be removed or its route deleted, or it will redirect the apex root back to
go.prepfusion.in, a loop with step 4. Do that in the same sitting as step 2.

**Rollback:** set `CANONICAL_REDIRECT = off`, `SITE_ORIGIN = https://go.prepfusion.in`, remove the
apex custom domain and point the apex back wherever ClassX wants it. go.prepfusion.in keeps serving
the page throughout.

## Checks to run before and after each step

```bash
curl -sI https://go.prepfusion.in/                        # 200 (step 1), 301 → apex (after step 2)
curl -s  https://go.prepfusion.in/ | grep -i canonical    # matches SITE_ORIGIN
curl -sI https://go.prepfusion.in/banners.json            # 200, Cache-Control max-age=60
curl -sI "https://go.prepfusion.in/styles.css?v=20261107a" # immutable
curl -sI https://hub.prepfusion.in/ https://store.prepfusion.in/ https://pyq.prepfusion.in/
```

- **INR pricing on the course host, from India.** Open a batch page (for example
  `/new-courses?examId=6`) on the course host from an Indian connection and confirm prices in ₹.
  This is the failure that rolled back the last apex attempt.
- **Canonical, og:url, og:image and JSON-LD** all show the new origin (view source; or paste the URL
  into a WhatsApp chat and check the preview card).
- **Banners:** the carousel shows the slides from `banners.json`. Then make a test edit in the admin
  portal and confirm it appears within a few minutes (deploy + 60 s cache).
- **Every outbound link:** course and policy links (ClassX), the five app download links, WhatsApp,
  YouTube, Telegram, Study Hub, Bookstore, Library.
- **Theme:** choose light on hub.prepfusion.in, then open this page: it should open light.

## Local testing

```bash
node --test hosting/worker.test.mjs
npx wrangler dev
npx wrangler dev --var SITE_ORIGIN:https://prepfusion.in --var COURSES_ORIGIN:https://courses.prepfusion.in --var CANONICAL_REDIRECT:on
curl -s -D - -o /dev/null -H "Host: go.prepfusion.in" http://localhost:8787/faq   # 301 → https://prepfusion.in/faq
```
