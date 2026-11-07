# Courses landing page: audit and redesign direction

Audited 7 Nov 2026 against the live page (go.prepfusion.in) at 360, 390, 768, 1280 and 1440 px in both
themes, and against `index.html`, `styles.css` and `script.js` on `main` (7a73f92). House rules are
from `.claude/skills/studyhub-design`, the landing floor from `.claude/skills/scroll-craft-taste`, and
"done right" is the Bookstore redesign (PF-study-hub/bookstore-worker-handoff PR #42,
`docs/storefront-audit.md`). Screenshots of the live page are in `docs/landing-redesign/before/`.

## Lighthouse, mobile, live page (before)

| Metric | Value |
|---|---|
| Performance | 72 |
| LCP | 10.4 s (the first banner JPEG, discovered only after `banners.json` is fetched by JS) |
| FCP | 2.0 s |
| CLS | 0 |
| TBT | 110 ms |
| Transfer on first load | 1,723 KiB in 24 requests (images 1,560, fonts 102, JS 24, CSS 16) |
| Accessibility | 94 (`heading-order`, `aria-required-children`, `label-content-name-mismatch`) |

## What is weak today

### It looks like a different company from the Hub and the Store
- **No shared header.** A transparent fixed bar over the hero with four ClassX links and a "More"
  menu. No round logo, no site label ("Courses"), no line icons, no cross-links in the Store's order.
  The theme button has no `aria-pressed`, and `<meta name="theme-color">` is missing.
- **Tokens are copied three times** (`@media (prefers-color-scheme)`, `[data-theme=dark]`,
  `[data-theme=light]`) and then bypassed: 98 raw hex values in component rules, plus `--deep`,
  `--green` and `--hero-ink` pairs the other sites don't have. The Store's `--raise`, `--edge`,
  `--glow`, `--scrim`, `--btn` family is missing.
- **The hero is a navy block with an animated canvas** (a step-response curve redrawn every frame),
  not the Store's soft blue glow over the page colour.
- **Theme doesn't carry across sites.** `pf-theme` lives in `localStorage`, which is per subdomain, so a
  student who chose light on the Hub lands here in dark.
- **Footer** uses uppercase monospace column headings and a different anatomy from the Store's.

### Hierarchy and first impression
- **The headline doesn't say who it's for.** "Setting a New Standard for GATE & VLSI Preparation"
  (Title Case) plus a 30-word lede of abstractions ("Learn through concepts. Understand through
  intuition."). ECE / EE / IN appears only in an all-caps monospace eyebrow.
- **No primary action in the hero.** The only button above the fold is inside the banner carousel,
  which sits *above* the headline, so on a phone the H1 starts below the fold.
- **The hero-metric template** (big number, small caps label, supporting text) three times, with a
  chip list of 12 AIRs in monospace. The founders' own AIRs, the most checkable proof, sit far down
  the page in "Meet your mentors".
- 11 `text-transform: uppercase` rules and 27 uses of `--mono`, all decorative (eyebrows, AIR chips,
  footer headings, tags, the "Live" pill). IBM Plex Mono is loaded in three weights only for this.
- Em dashes throughout the visible copy (the taste floor's refuse list).

### Courses
- **Six identical cards** (house rule 2) for Free / Full course / Subject-wise / Combo / Placement /
  Test series. None says which branch it's for; "Pathfinders & Titans, ECE and EE" is the only hint.
- The four branch-specific GATE 2027 batches (TITANS and Pathfinders, for EC and for EE) are reachable
  only through the rotating banner, so a student has to wait for the right slide.
- The TITANS vs Pathfinders comparison, the most useful decision aid on the page, is hidden inside an
  FAQ answer.
- Every course link is `href="#0"` until JavaScript runs, so they are dead without JS and to crawlers.
- The "course pages run on a separate system and may need their own account" caveat exists only as a
  hover tooltip on a footer icon.

### Fine print that sets the wrong expectation
- The meta description says "every core subject free forever, the same videos as the paid course",
  the refund answer says "a free version of every core subject", and the FAQ says "not the whole
  syllabus is free". These contradict each other. The FAQ's careful version is used everywhere now.
- Validity ("TITANS runs 3 months longer") and "offline downloads on Android only" are true but buried.

### Testimonials and interviews
- **A marquee.** The testimonial strip auto-scrolls forever (`requestAnimationFrame`), rendered twice
  so the loop is seamless, which means screen readers read all 11 quotes twice.
- **Invented ratings.** Every card shows five stars and `aria-label="5 out of 5"`; there is no rating
  data behind them.
- Cards are clamped and open a "read the full text" popup (house rule 3); the popup and the Rankers'
  panel are `div role="dialog"` with no focus move, no focus return and a tabbable background.
- The banner carousel auto-advances every 6 s with no pause control except mouse hover.

### Accessibility
- No skip link, no `<main>`, heading levels skip.
- Several controls under 44 px on phones (banner dots, carousel arrows, theme button).
- The floating WhatsApp button covers content at 1440 px (it sits on top of the hero proof cards) and
  the bottom of every phone screen.
- App icons for Mac reuse the Apple logo for both Apple silicon and Intel with no grouping.

### Load speed
- The LCP is a 320 KB, 1536 px JPEG shown at about 560 px, injected by JS after a `fetch`. Five banner
  JPEGs (1.4 MB) all load at once because hidden slides are only transparent.
- 10 font files (Sora 3, Inter 4, Plex Mono 3), render-blocking Google Fonts CSS.
- The canvas animation and the marquee each run a `requestAnimationFrame` loop from first paint.
- No canonical, no JSON-LD, Open Graph hard-coded to go.prepfusion.in in five places.

## Chosen direction: "The front desk"

**One idea:** the page is the front desk of a coaching institute. The first thing it asks is the one
thing every visitor already knows about themselves, which GATE paper they're writing (EC, EE or IN),
and it answers with that branch's two batches and one button. Everything below answers the questions
a careful student asks next, in the order they ask them: what's open right now, how the two batches
differ, what else there is (free subjects, single subjects, placements, tests), who has studied here
and what they say, which app it runs in, and the fine print.

**Why it fits:** students arrive knowing their branch, not our batch names. EC and EE get mixed up,
so every branch-specific link says the branch in words ("Only for GATE Electrical (EE)"). IN has no
separate batch, and the page now says so instead of letting an IN student buy an EC batch by mistake.
The proof is the founders' own AIRs, next to their photos, in the hero.

**Visual system:** the Store's tokens and components exactly (header, footer, pill buttons, radius-18
cards, FAQ rows, dialogs, focus ring), dark by default, light by choice. The hero carries the Store's
soft blue glow. Blue (`--wordmark` / `--btn`) is the action colour; yellow (`--accent-ink`) marks AIRs
only. The `--deep` navy appears once, as the closing call to action. Nothing moves on its own: one
short entrance on load, a banner that changes only when asked, all of it off under reduced motion.

**Refused:** eyebrows, uppercase, decorative monospace, identical card grids, marquees, auto-rotating
banners, star ratings without data, em dashes, the hero-metric template.

**Claims used** (only what the page, `banners.json` or the Hub already state): the founders' AIRs
(Himanshu Agarwal AIR 27 EC, AIR 45 IN; Anish Saha AIR 19 IN, AIR 66 EE), the named student results and
quotes already on the page, the Rankers' interview list, the batch feature list, "1000+ hours" (from
the batch banners), and the existing FAQ answers.
