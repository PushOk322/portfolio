/* Static site build: copy the deployable surface into dist/.
 *
 * The configurator page resolves `three` through a native importmap and loads every
 * asset by a relative `./` path, so there is nothing to bundle for a standalone
 * deploy — dist/ works at any subpath as-is. This exists to give the same contract as
 * every other demo: `npm run build` produces a dist/ that drops in at /demos/<slug>/.
 *
 * The other build (scripts/build.mjs, `npm run build:embed`) is a different job: it
 * bundles three separate single-product embeds for a host page that has no importmap
 * of ours. That one writes to dist-embed/ and is covered by tests/build-output.test.mjs.
 */
import { cp, rm, mkdir, readdir, stat } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

// Shipped to the browser. Anything not listed — tests/, scripts/, docs/, demo/,
// configuratorConfig.js, the eslint config — stays out of the deploy.
const INCLUDE = ['index.html', 'css', 'js', 'src', 'portfolio', 'DEMO_NOTICE.md'];

async function dirSize(dir) {
  let total = 0;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    total += entry.isDirectory() ? await dirSize(full) : (await stat(full)).size;
  }
  return total;
}

await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });

for (const entry of INCLUDE) {
  await cp(join(ROOT, entry), join(DIST, entry), { recursive: true });
}

console.log(`dist/ built — ${((await dirSize(DIST)) / 1048576).toFixed(2)} MB`);
