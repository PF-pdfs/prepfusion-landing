# prepfusion.in root → go.prepfusion.in

Only `prepfusion.in/` (the bare root, any query string) redirects to `https://go.prepfusion.in/`.
Every other apex path (`/courses`, `/terms`, ...) and every subdomain behaves exactly as before.

> [!WARNING]
> **Do NOT switch the `prepfusion.in` A record to Proxied.** Tried on 2026-09-13 and rolled back
> ([issue #3](https://github.com/PF-pdfs/prepfusion-landing/issues/3)). The redirect itself worked, but
> the apex is ClassX's course site on Vercel, and ClassX picks the price **currency from the
> visitor's IP**. Behind Cloudflare, every visitor reaches Vercel from a Cloudflare server
> (`x-vercel-id` went from `bom1::bom1` to `sin1::bom1`), so Indian students were shown **SGD
> prices**. It went back to INR as soon as the record was DNS-only again. The same thing happened
> in an earlier attempt.
>
> The proxy is all-or-nothing per hostname, Workers and Redirect Rules only run on proxied traffic,
> and ClassX have declined to add the root redirect themselves. So there is currently **no safe
> way** to redirect only the root. The Worker below stays deployed but inert (it never runs while
> the record is DNS-only). Only revisit this if ClassX start geolocating by Cloudflare's
> `CF-IPCountry` header or add the redirect on their side, and re-test pricing on
> `/new-courses?examId=6` from India before and after.

## Why the earlier attempt "did nothing"

The Aug 17 deploy of this same redirect (version `af95ada5`, route `prepfusion.in/`) is **live and
correct**: `https://prepfusion-landing-apex.prepfusion-edu-gate.workers.dev/` returns the 301. But
the apex DNS record is **DNS-only (grey cloud)**: `prepfusion.in` resolves to `76.76.21.21`
(Vercel), and responses come back with `Server: Vercel` and no `CF-RAY`. Traffic never passes
through Cloudflare, so no Worker route, Redirect Rule or Page Rule can fire. The code isn't the
problem. The missing step is putting Cloudflare in the path.

## The one real risk: proxying Vercel

Turning the apex record orange puts Cloudflare in front of Vercel for **every** apex path, not just
`/`. If the zone's SSL/TLS mode is **Flexible**, Cloudflare talks to Vercel over HTTP, Vercel 308s to
HTTPS, and every apex page turns into `ERR_TOO_MANY_REDIRECTS`. **SSL/TLS mode must be Full (strict)
before proxying.** Also check the zone for anything that would alter proxied traffic: Rocket Loader,
Bot Fight Mode, cache rules or Page Rules that match `prepfusion.in/*`.

## Activation (owner approval required) (BLOCKED, see the warning at the top)

Don't follow these steps as things stand: step 4 is what caused the SGD pricing. They are kept for
if the ClassX side ever changes.

1. Dashboard → prepfusion.in → SSL/TLS → Overview: confirm **Full (strict)**.
2. Test the new code on its version preview URL, without deploying it:
   `cd cloudflare && npx wrangler versions upload` (prints a preview URL; `/` should 302 and
   `/courses` should 404).
3. Deploy the Worker (route stays `prepfusion.in/`): `cd cloudflare && npx wrangler deploy`.
4. DNS → the `prepfusion.in` A record (`76.76.21.21`) → switch to **Proxied** (orange).
   Leave `www` alone: it is a CNAME to the apex, and `https://www.prepfusion.in` already fails
   today because Vercel has no certificate for it.
5. Run the checklist below immediately.

## Rollback

- Fastest and complete: set the apex A record back to **DNS-only** (grey). Cloudflare leaves the
  path and everything is exactly as today. DNS TTL applies, so it can take a few minutes.
- To keep the proxy but drop the redirect, remove the `prepfusion.in/` route in Workers → Routes.

## Verify after activation

```bash
curl -sI https://prepfusion.in/                     # 302 → https://go.prepfusion.in/
curl -sI "https://prepfusion.in/?utm_source=t"      # 302 → https://go.prepfusion.in/?utm_source=t
curl -sI http://prepfusion.in/                      # redirect to https, then 302
curl -sI https://prepfusion.in/courses              # 200, Server: cloudflare, from Vercel (X-Powered-By: Next.js)
curl -sI https://prepfusion.in/some-random-path     # 404 from Vercel, same as today
curl -sI http://prepfusion.in/courses               # 30x → https://prepfusion.in/courses, NOT a loop
curl -sI https://go.prepfusion.in/                  # 200
curl -sI https://notes.prepfusion.in/               # 302 → hub.prepfusion.in/notes
curl -sI https://hub.prepfusion.in/                 # 200
curl -sI https://store.prepfusion.in/               # 200
curl -sI https://pyq.prepfusion.in/                 # 200
```

Also click through a real browser: log in, open a course, and start a checkout on `prepfusion.in`.
Once everything has passed for a few days, change `REDIRECT_STATUS` to `301` in `worker.js` and
redeploy.

## Tests

`node --test cloudflare/worker.test.mjs`
