/* Static build: copy the deployable surface into dist/.
 *
 * There is no bundler here on purpose. The app resolves `three` through a native
 * importmap and has zero runtime dependencies, so a bundler would add a build
 * system to the one project whose point is not having one. What it does need is
 * the same contract as every other demo — `npm run build` produces a `dist/` that
 * drops in at /demos/<slug>/ — and that is all this does.
 *
 * Every path in index.html is already relative ("./css/…"), so dist/ works at any
 * subpath without a base-path rewrite. Do not change those to absolute paths.
 */
import { cp, rm, mkdir, readdir, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, 'dist');

// Shipped to the browser. Anything not listed (tests/, docs/, eslint config,
// build.mjs itself) stays out of the deploy.
const INCLUDE = ['index.html', 'css', 'js', 'src', 'portfolio', 'DEMO_NOTICE.md'];

async function dirSize(dir) {
  let total = 0;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    total += entry.isDirectory() ? await dirSize(full) : (await stat(full)).size;
  }
  return total;
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const entry of INCLUDE) {
  await cp(join(root, entry), join(dist, entry), { recursive: true });
}

const bytes = await dirSize(dist);
console.log(`dist/ built — ${(bytes / 1048576).toFixed(2)} MB`);
