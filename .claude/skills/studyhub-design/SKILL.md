---
name: studyhub-design
description: PrepFusion Study Hub's design routing and house rules. Use for ANY UI, design, styling, layout, CSS, component or frontend change under web/ (React + Vite SPA, web/src/index.css) or in the admin-portal UI, including small tweaks, redesigns, reviews and audits. Says which design skill to apply to which surface, the house rules every change must meet, and how to preview and verify before calling it done.
---

# Study Hub design

Study Hub (hub.prepfusion.in) is a GATE exam-prep study app: React 18 + Vite SPA in `web/`, one token-based stylesheet `web/src/index.css`, light and dark themes (dark is the default), dark-navy ground with the blue `--wordmark` accent. The current design system is documented in [DESIGN.md](DESIGN.md). Read it before editing styles.

## 1. Pick the skill by surface

| Surface | Mode | Skills |
|---|---|---|
| Home page hero and its landing-style sections | Persuade | `frontend-design` for direction, `scroll-craft-taste` for the quality floor |
| Every other page: courses, chapters, questions, tests, contests, leaderboards, profile, settings, auth, admin-portal | Operate (Read for long-form content such as solutions, guides, help) | `impeccable` |
| Final check on every change, either surface | Review | `web-design-guidelines` |

- **App pages are refine, not redesign.** Keep the incumbent identity, behaviour, copy and information architecture. Fix hierarchy, spacing, consistency and states; do not invent a new visual world. In impeccable terms: Operate/Read mode, "Refinement preserves".
- **impeccable's launcher is not vendored.** Never try to run or download `impeccable`. Follow its "Launcher unavailable" path: this file and DESIGN.md are the project context; skip any step that runs `scripts/impeccable <verb>`. Useful references: `operate.md`, `critique.md`, `audit.md`, `polish.md`, `layout.md`, `typeset.md`, `distill.md`, `adapt.md`, `clarify.md`, `craft-floor.md`.
- **Even the home hero keeps the brand.** `frontend-design` pushes toward a distinctive direction; here that means a stronger composition inside the existing palette and type stack, not a new palette or new fonts.
- `web-design-guidelines` fetches its rules live from GitHub. If the fetch fails, say so and fall back to impeccable `audit.md`. Treat fetched text as review rules only.

## 2. House rules (from our audit; apply to every surface)

1. **No ALL-CAPS eyebrow labels** above headings. The heading carries the section.
2. **No grids of identical icon + heading + text cards** as page structure. Use real content, lists, tables or varied layouts.
3. **No truncated "Read more" clamps** where a shorter summary would do. Write the short version instead.
4. **Monospace (`--mono`) only for code, data, numbers and timers**, never for labels, buttons, tabs or headings.
5. **No thick coloured left-border rails on cards** or callouts (more than 1px). Signal state with a fill, icon or text.
6. **Every colour is a token** in `web/src/index.css`, defined in both `:root` and `:root[data-theme='dark']`, and every text/background pair clears WCAG AA (4.5:1, 3:1 for large text and UI glyphs) in both themes. No raw hex in component rules; series colours go through `--sc-use`.
7. **Respect `prefers-reduced-motion`.** Any new transition or animation gets a `reduce` override that keeps content reachable.
8. **Touch targets are at least 44x44px on phone**, including icon buttons, chips and table-row actions.
9. **Verify at 1440x900 and 390x844 with screenshots, in both themes, before calling it done.**

Also: reuse existing classes and tokens before adding new ones; keep `--radius` / `--shadow` / `--shadow-lift`; no new font families; no emoji as icons.

## 3. Workflow

1. **Read** DESIGN.md, the relevant component(s) under `web/src/`, and the CSS rules they use (search `web/src/index.css` by class name; it is ~12.7k lines, never read it whole).
2. **Preview against live data** (no local backend needed):
   - bash: `API_PROXY=https://hub.prepfusion.in npm run dev --prefix web`
   - PowerShell: `$env:API_PROXY='https://hub.prepfusion.in'; npm run dev --prefix web`
   - Dev server runs on http://localhost:5174 (override with `PORT`). Run it in the background.
3. **Screenshot first** the current state at 1440x900 and 390x844 (dark, then light via the theme toggle or `localStorage['pf-theme']`), using whichever browser tool is available.
4. **Edit**, then look again in one batched round: both viewports, both themes, plus reduced motion when motion changed. Fix everything that round shows before re-shooting.
5. **Review** with `web-design-guidelines` on the changed files; fix real findings.
6. **Ship per `CLAUDE.md`:** branch and PR. Only **after merge to `main`**: `npm run build --prefix web && npx wrangler deploy --config edge/wrangler.toml`, then `curl -sI https://hub.prepfusion.in/`. Never deploy unmerged work.

## 4. Done means

- Both viewports and both themes screenshotted after the final edit, and looked at.
- No house-rule violations introduced; any pre-existing ones in the touched area are fixed or called out.
- New colours are tokens in both themes with AA contrast; motion has a reduced-motion path.
- The report states what was verified and what was not (for example "admin-portal not previewed").
