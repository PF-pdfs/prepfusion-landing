// One-off image optimiser. Run by hand, never by a build:
//
//   cd tools && npm install && node optimize-images.mjs
//
// Writes AVIF, WebP and a JPEG fallback at a few widths into assets/img/opt/,
// which are committed. The site itself still has no build step: index.html
// and script.js reference these files by name.
//
// Naming
//   Mentor photos:  opt/<name>.<hash8>-<width>.<ext>   (hash of the source, so
//                   a replaced photo gets a new URL and can be cached forever)
//   Banners:        opt/banners/<source basename>-<width>.<ext>. The admin
//                   portal already gives every upload a unique timestamped
//                   name, and script.js derives these names from the
//                   banners.json "image" path, so they must not carry a hash.
//
// After the admin portal uploads a NEW banner, run this again and commit the
// output. Until then script.js falls back to the original JPEG for that slide
// (one 404 per variant request, then the original loads).
//
// It also prints a tiny blurred preview (data URI) and the dominant colour of
// each mentor photo, which index.html inlines as the placeholder.
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const img = path.join(root, 'assets', 'img');
const opt = path.join(img, 'opt');
fs.mkdirSync(path.join(opt, 'banners'), { recursive: true });

const MENTOR_WIDTHS = [240, 400, 600];
const BANNER_WIDTHS = [480, 800, 1200];

async function variants(src, outBase, widths) {
  const meta = await sharp(src).metadata();
  for (const w of widths) {
    const width = Math.min(w, meta.width);
    const pipe = () => sharp(src).resize({ width, withoutEnlargement: true });
    await pipe().avif({ quality: 50, effort: 6 }).toFile(`${outBase}-${w}.avif`);
    await pipe().webp({ quality: 72, effort: 6 }).toFile(`${outBase}-${w}.webp`);
    await pipe().jpeg({ quality: 76, mozjpeg: true, progressive: true }).toFile(`${outBase}-${w}.jpg`);
  }
}

async function placeholder(src) {
  const buf = await sharp(src).resize(12).blur(1).webp({ quality: 40 }).toBuffer();
  const { dominant } = await sharp(src).stats();
  const hex = '#' + [dominant.r, dominant.g, dominant.b].map((v) => v.toString(16).padStart(2, '0')).join('');
  return { dataUri: 'data:image/webp;base64,' + buf.toString('base64'), dominant: hex };
}

const report = {};
for (const name of ['himanshu', 'anish']) {
  const src = path.join(img, `${name}.jpg`);
  const hash = crypto.createHash('sha256').update(fs.readFileSync(src)).digest('hex').slice(0, 8);
  await variants(src, path.join(opt, `${name}.${hash}`), MENTOR_WIDTHS);
  report[name] = { base: `assets/img/opt/${name}.${hash}`, ...(await placeholder(src)) };
}

for (const file of fs.readdirSync(path.join(img, 'banners'))) {
  if (!/\.(jpe?g|png|webp)$/i.test(file)) continue;
  const base = file.replace(/\.[^.]+$/, '');
  const out = path.join(opt, 'banners', base);
  if (fs.existsSync(`${out}-${BANNER_WIDTHS[0]}.avif`)) continue; // already done
  await variants(path.join(img, 'banners', file), out, BANNER_WIDTHS);
  report[`banners/${base}`] = 'written';
}

console.log(JSON.stringify(report, null, 2));
