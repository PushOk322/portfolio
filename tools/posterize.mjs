/* Turn the chosen captures into the three files the site expects per demo:
 *   demos/<slug>/poster.webp          1600x900  (source of record)
 *   site/public/posters/<slug>.webp   1600x900  (what ships)
 *   site/public/posters/<slug>@800.webp  800x450 (srcset small)
 */

import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

// sharp already lives in orbital-slice's devDependencies; borrow it rather than
// pulling another copy down just to write six files.
const require = createRequire(join(HERE, '..', 'demos', 'orbital-slice', 'package.json'));
const sharp = require('sharp');

const SHOTS = join(HERE, 'shots');
const REPO = resolve(HERE, '..');

// Which frame won, per demo.
const PICKS = {
  'canvas-studio': 'canvas-studio.png',
  'orbital-slice': 'orbital-slice-4.png',   // burst frame with the blade mid-swipe
  'joinery-configurator': 'joinery-configurator.png',
  'boat-configurator': 'boat-configurator.png',
  'stairs-generator': 'stairs-generator.png',
  'tv-course-browser': 'tv-course-browser.png',
};

const kb = (p) => (statSync(p).size / 1024).toFixed(0) + ' kB';

for (const [slug, file] of Object.entries(PICKS)) {
  const src = join(SHOTS, file);
  const buf = readFileSync(src);

  const meta = await sharp(buf).metadata();
  if (meta.width !== 1600 || meta.height !== 900) {
    console.error(`  ${slug}: source is ${meta.width}x${meta.height}, expected 1600x900`);
  }

  const big = await sharp(buf).resize(1600, 900, { fit: 'cover' }).webp({ quality: 82 }).toBuffer();
  const small = await sharp(buf).resize(800, 450, { fit: 'cover' }).webp({ quality: 80 }).toBuffer();

  const demoPoster = join(REPO, 'demos', slug, 'poster.webp');
  const sitePoster = join(REPO, 'site', 'public', 'posters', `${slug}.webp`);
  const siteSmall = join(REPO, 'site', 'public', 'posters', `${slug}@800.webp`);

  writeFileSync(demoPoster, big);
  writeFileSync(sitePoster, big);
  writeFileSync(siteSmall, small);

  console.log(`${slug.padEnd(22)} ${file.padEnd(28)} ${kb(sitePoster).padStart(8)} / ${kb(siteSmall).padStart(7)}`);
}
