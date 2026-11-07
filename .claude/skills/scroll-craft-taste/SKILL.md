---
name: scroll-craft-taste
description: Rendered-result quality floor (spacing rhythm, type, colour, text over media, depth, cards, motion, refuse list, squint test) plus a desktop/phone/reduced-motion verification checklist, for landing-style sections only. Use when building or reworking the PrepFusion Study Hub home-page hero or other marketing/landing sections. Do NOT use for app screens (courses, tests, contests, leaderboards, settings, admin).
license: MIT (see LICENSE)
---

<!--
Partial vendored copy for PrepFusion Study Hub.
Source: https://github.com/nateherkai/scroll-craft, plugins/nateherk-design/skills/scroll-craft/ (MIT, see LICENSE)
Commit: 75d81f74e83692add18cd7a8a8e078b8a887a579
Only references/taste.md and references/verify.md are copied, unmodified. The upstream skill itself
(cinematic scroll-driven marketing pages, the scrollcraft engine, kie.ai asset generation, and the
scripts/ harness) is NOT vendored. This SKILL.md is our own wrapper.
-->

# Scroll-craft taste floor (landing sections only)

Scope: the Study Hub **home page hero and landing-style sections** (Persuade mode). Every other page is app UI: use `impeccable` in Operate/Read mode instead. Routing lives in `.claude/skills/studyhub-design/SKILL.md`.

## What to read

- [references/taste.md](references/taste.md): the floor. Read before writing markup for a landing section, then check the rendered result against it. The most useful parts here: Spacing (more space above a heading than below), Typography, Colour, Text over media, Depth, Cards, Motion, The refuse list, The squint test.
- [references/verify.md](references/verify.md): read only "What the harness cannot tell you", "The manual passes" (reduced motion, mobile), "The phone is a different machine", "Ask what differs before asking what's broken", and "The harness will photograph the wrong site without telling you".

## How it maps onto this repo

- **Token names.** taste.md refers to scroll-craft's own tokens (`--sc-1` ... `--sc-11`, `--sc-section`, `--sc-gutter`, `--sc-track-*`). Do **not** add them: this project already uses `--sc`, `--sc-d` and `--sc-use` for series colours (see `web/src/index.css` and `src/series.js`), and an `--sc-*` scale would collide. Apply the *principles* with the existing tokens in `.claude/skills/studyhub-design/DESIGN.md`; add any new token to both themes.
- **Harness not available.** verify.md's `node <skill>/scripts/serve.mjs`, `shoot.mjs` and `kie.mjs` commands do not exist here (scripts were not vendored, and we do not use kie.ai). Preview with the Vite dev server and take screenshots at 1440x900 and 390x844, plus one pass with reduced motion emulated, as `studyhub-design` describes.
- **Dead links.** verify.md links `approved-collection.md`, `devices.md` and `assets.md`, which were not copied. Ignore those links and the credit-accounting section.
- **Conflicts.** Where taste.md disagrees with the `studyhub-design` house rules, the house rules win. In particular: monospace is for code, data and timers only, never labels; the incumbent dark-navy identity and Sora/Inter/IBM Plex Mono stack stay.
