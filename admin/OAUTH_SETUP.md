# One-time setup: banner admin login

The `/admin` panel (Decap CMS) is already built and wired to `banners.json`.
The one piece that needs your account access — I can't do this for you — is
letting it log in with GitHub. That's a deliberate two-step, ~10 minute setup,
done once and never touched again.

## Step 1 — Create a GitHub OAuth App

1. Go to https://github.com/settings/developers → **OAuth Apps** → **New OAuth App**.
   (Do this under the `PF-study-hub` org if you want it org-owned, or your
   personal account — either works, it just controls who can edit the App later.)
2. Fill in:
   - **Application name:** `PrepFusion Banner Admin` (or anything recognizable)
   - **Homepage URL:** `https://go.prepfusion.in` (or wherever this site ends
     up live — the exact value doesn't matter functionally)
   - **Authorization callback URL:** `https://<your-worker-name>.workers.dev/callback`
     — you'll get the exact `workers.dev` URL in Step 2, so it's fine to
     come back and fill this in after deploying the Worker.
3. Click **Register application**.
4. You'll see a **Client ID** — copy it.
5. Click **Generate a new client secret** — copy it immediately (GitHub only
   shows it once).

## Step 2 — Deploy the OAuth proxy Worker

The code is already written: `oauth-worker/worker.js` in this repo. You just
need to deploy it to your Cloudflare account (the same one your DNS is on).

Easiest path — Cloudflare's dashboard, no CLI needed:
1. Log into the Cloudflare dashboard → **Workers & Pages** → **Create** → **Create Worker**.
2. Give it a name (e.g. `prepfusion-decap-oauth`) — this becomes part of your
   Worker's URL: `https://prepfusion-decap-oauth.<your-subdomain>.workers.dev`.
3. Click **Edit code**, delete the placeholder content, and paste in the
   contents of `oauth-worker/worker.js` from this repo. Deploy.
4. Go to the Worker's **Settings → Variables and Secrets** and add two
   **secret** (encrypted) variables:
   - `GITHUB_CLIENT_ID` — from Step 1
   - `GITHUB_CLIENT_SECRET` — from Step 1
5. Copy the Worker's `workers.dev` URL.

(If you'd rather use the `wrangler` CLI instead of the dashboard,
`oauth-worker/wrangler.toml` is already set up — `wrangler secret put
GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`, then `wrangler deploy` from
inside `oauth-worker/`.)

## Step 3 — Wire the two pieces together

1. Back in the GitHub OAuth App (Step 1), set the **Authorization callback
   URL** to `<your-worker-url>/callback` (e.g.
   `https://prepfusion-decap-oauth.you.workers.dev/callback`) and save.
2. In this repo, edit `admin/config.yml` and replace the placeholder:
   ```yaml
   base_url: https://REPLACE-WITH-YOUR-OAUTH-WORKER.workers.dev
   ```
   with your actual Worker URL (no trailing slash, no `/callback` — just the
   Worker's own root, e.g. `https://prepfusion-decap-oauth.you.workers.dev`).
3. Commit and push that one-line change.

## Step 4 — Test it

Visit `https://go.prepfusion.in/admin/` (or your current preview URL +
`/admin/`), click **Login with GitHub**, authorize the app, and you should
land in the CMS with the "Homepage Banners" collection visible. Add or edit a
banner and hit **Publish** — that commits straight to `banners.json` in this
repo, and the live site picks it up on its next load (GitHub Pages rebuilds
automatically within a minute or so of the commit).

If login fails, the most common causes are: the callback URL in the GitHub
OAuth App doesn't exactly match `<worker-url>/callback`, or `base_url` in
`admin/config.yml` has a typo/trailing slash.
