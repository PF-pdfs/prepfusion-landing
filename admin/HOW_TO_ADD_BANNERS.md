# How to add or change homepage banners

This is the guide for actually using the admin panel day to day — not the
one-time technical setup (that's `admin/OAUTH_SETUP.md`, and you only need
it once, before you can log in at all).

## Where to go

Visit `/admin` on the live site (e.g. `https://go.prepfusion.in/admin/`),
log in with GitHub, and click **Homepage Banners** on the left. You'll see
a list of the banners currently on the site, in the order they play.

Whatever you save here goes live on the actual website within about a
minute — no developer needs to touch anything.

## The two banner styles

Every banner is one of two styles. Pick whichever fits what you're
uploading — you don't need a developer to decide, just answer "do I have a
finished graphic, or just a photo/color and some text?"

### 1. Text banner

Use this when you want the site to build the banner for you: a small label,
a bold headline, a short description, and a button — laid out consistently
with the rest of the site's look, on a plain background or (optionally) a
photo you upload behind it.

**Use this for:** quick announcements, new batch openings, anything you can
describe in a sentence or two.

Fields that matter: **Headline**, **Small label**, **Description**,
**Button text**, **Link**, and optionally an **Image** to use as the
background photo.

The **Small label** and **Button text** fields already have sensible
defaults filled in, and the hint under each field lists a few phrases
you've used before — leave the default, copy one of those, or type
whatever you want. Nothing is locked.

### 2. Full image banner

Use this when someone has already designed a complete banner graphic for
you — like the "Campus to Core VLSI" or "GATE 2027 TITANS Batch" style
posters, with the text, logo and photos already baked into the image
itself.

**Use this for:** anything that already looks finished on its own. The
site will **not** add any of its own text on top — your image is shown
exactly as you made it, in full, never cropped.

Fields that matter: **Image** (your finished graphic) and **Link**. You can
leave Headline/Small label/Description/Button text blank — they're ignored
for this style.

**What size image to use:** there's no single perfect size, because the
banner box is very wide and short on desktop and taller on phones, and the
same image has to work in both. Whatever you upload will always be shown
in full (nothing gets cropped) — a size close to the examples above
(roughly 3:2, landscape) works well with only a little empty space around
the edges. A very tall or very square image will have more empty space on
desktop specifically, but will still display correctly.

## Adding a new banner

1. Click **Homepage Banners** → **Banners** → **Add Banners**.
2. Pick a **Banner style** (Text or Full image, see above).
3. Fill in the fields for that style.
4. Set **Link** — this is where the whole slide goes when someone clicks
   it. It opens in the same tab, like every other link on the site.
5. Drag the new entry to where you want it in the list — the order here is
   the order the banners rotate in.
6. Click **Publish** (top right). That's it — live in about a minute.

## Editing or removing a banner

Click into any existing banner to edit its fields, or use the delete
option on that entry to remove it. Publish afterwards the same way.

## If something looks wrong

- **Banner not showing at all / site shows the old default banners:**
  the site falls back to a small built-in set of banners if `banners.json`
  is empty or unreachable — check that you actually clicked Publish, and
  that at least one banner exists in the list.
- **Text banner's text is hard to read over the photo:** the site adds a
  dark tint over background photos automatically, but a very bright photo
  can still be tricky — try a different photo, or switch to no background
  photo (plain color).
- **Login doesn't work at all:** that's the one-time setup in
  `admin/OAUTH_SETUP.md`, not something wrong with a banner.
