# Study Hub design system (current state)

Documents what ships today, read from `web/src/index.css` (palette block near the top, roughly lines 73-191) and `web/index.html`. The CSS is the source of truth: if this file and the CSS disagree, the CSS wins and this file should be updated.

## Themes

- Two themes via `data-theme` on `<html>`: `:root` is light, `:root[data-theme='dark']` is dark.
- **Dark is the default**, not the OS preference. An inline script in `web/index.html` sets `data-theme` before first paint from `localStorage['pf-theme']` (falls back to dark); `web/src/theme.js` toggles it, and a signed-in user's account theme overwrites the same key.
- There is no `prefers-color-scheme` handling; do not add one without a product decision.
- `color-scheme` is set per theme so native controls follow.

## Palette tokens (light / dark)

Every text/background pair is designed to clear WCAG AA in both themes.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--paper` | `#f2f5fa` | `#0a1020` | page background (body) |
| `--card` | `#ffffff` | `#151f36` | card / panel surface |
| `--ink` | `#0a1020` | `#f2f6ff` | primary text |
| `--ink-soft` | `#475a78` | `#a9b8d6` | secondary text |
| `--ink-faint` | `#4f6080` | `#94a4c4` | tertiary text (AA on `--chipbg`) |
| `--line` | `#dde4f0` | `#2a3854` | hairlines, borders |
| `--line-strong` | `#c3cddf` | `#3c4d70` | stronger borders, field outlines |
| `--brand` | `#14307f` | `#9db6ff` | links, focus rings (muted navy) |
| `--wordmark` | `#1668d6` | `#4d92ff` | the blue "Fusion" accent; the visible brand blue |
| `--accent` | `#ffcf2d` | `#ffd54a` | yellow fills and dots only, never text in light |
| `--accent-ink` | `#7a4200` | `#ffd54a` | the accent when it colours text |
| `--chipbg` | `#e9eef7` | `#1e2942` | chips, pills, subtle fills |
| `--on-ink` | `#ffffff` | `#0a1020` | text on an `--ink` fill |
| `--soon-bg` / `--soon-ink` | `#fff9e6` / `#735d14` | `#3f403a` / `#ffd54a` | "coming soon" state |
| `--ok` / `--ok-bg` | `#1d6b33` / `#eefaf1` | `#6ed3a3` / `#17301f` | correct, success |
| `--warn` | `#8a5300` | `#f0c26a` | warning text |
| `--bad` / `--bad-bg` | `#b3261e` / `#fdf1f0` | `#ff8a80` / `#3a1f1d` | wrong, error |
| `--seen` / `--seen-bg` | `#8a6a00` / `#fff6d6` | `#e6c24a` / `#3a3214` | already-seen / revisit |

Data scales:

- `--heat-0` ... `--heat-4`: activity heatmap, 5-step **green** (`--heat-0` is a neutral empty cell, not green at 0%). Light `#e9eef7 #b9e6cb #7bcf9d #3fae74 #1d6b33`; dark `#1e2942 #17472c #1f6b3d #2f9c58 #6ed3a3`.
- `--mk-0` ... `--mk-4` with `--mk-ink-0` ... `--mk-ink-4`: marks-distribution heatmap, 5-step **blue**, deliberately a different family from `--heat-*`. Each step has its own AA text colour because the number is printed in the cell. Dark inverts the ramp (heavy end is brightest) and flips ink one step earlier.
- Series colours: `--sc` (light) and `--sc-d` (dark) are set per element from `web/src/series.js`; rules read `--sc-use`, which `.card, .chip, .shelf, .sec-card, .qlist-head` map to the right one per theme. Do not introduce other `--sc-*` names.

## Typography

Loaded from Google Fonts in `web/index.html` (`display=swap`): Sora 600/700/800, Inter 400/500/600/700, IBM Plex Mono 400/500/600.

| Token | Stack | Role |
|---|---|---|
| `--display` | `'Sora', 'Inter', system-ui, sans-serif` | headings, wordmark, hero; weights 600-800 |
| `--sans` | `'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif` | body and UI; base `400 16px/1.65` on `body` |
| `--mono` | `'IBM Plex Mono', ui-monospace, 'Cascadia Mono', Consolas, monospace` | code, data, scores, timers |

- Rules mostly use the `font:` shorthand, e.g. `font: 600 14px/1.4 var(--sans)`.
- Note: some rules use weight 650 for Sora/Inter, which is not in the loaded weight set and renders at the nearest loaded weight.
- KaTeX math fonts are self-hosted via `@font-face` at the top of `index.css`.
- House rule: `--mono` is not for labels. Existing label uses are audit debt, not precedent.

## Shape and depth

| Token | Light | Dark |
|---|---|---|
| `--radius` | `18px` (cards, panels) | same |
| `--shadow` | `0 1px 2px rgba(10,16,32,.06), 0 10px 30px -14px rgba(10,16,32,.22)` | `0 1px 2px rgba(0,0,0,.45), 0 10px 30px -14px rgba(0,0,0,.75)` |
| `--shadow-lift` | `0 3px 8px rgba(10,16,32,.1), 0 26px 50px -18px rgba(10,16,32,.32)` | `0 3px 8px rgba(0,0,0,.55), 0 26px 50px -18px rgba(0,0,0,.9)` |

Smaller radii are literal values today: `999px` for pills (most common), then `12px`, `10px`, `8px`, `14px`, `6px`, and `50%` for circles. Prefer one of these over a new value.

## Layout

- Content container `.wrap`: `max-width: 1180px; margin: 0 auto; padding: 0 24px`.
- Breakpoints are `max-width` media queries, mostly 820, 640, 620, 560, 480 and 420px (no shared token; match a nearby rule's breakpoint).
- `html` has `scroll-behavior: smooth` and `scroll-padding-top: 80px` (sticky header).
- `body` transitions background and colour over 0.2s for theme switches.
- `[hidden]` is forced to `display: none !important`.

## Motion

- Many components already carry `@media (prefers-reduced-motion: reduce)` overrides; follow that pattern for anything new.

## Meta

- `<html lang="en">`, viewport `width=device-width, initial-scale=1.0`, title "PrepFusion Study Hub".
- Open Graph / Twitter card point at `https://hub.prepfusion.in/social-card.png` (2400x1260). Favicon `/favicon.png`, apple-touch-icon `/logo.png`.
