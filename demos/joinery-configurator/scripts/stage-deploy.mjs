/**
 * Stages the two folders that get uploaded to the test server.
 *
 * deploy/dev  — index.html plus unbundled sources: the full UI panel, and
 *               window.joinery for driving state from the console.
 * deploy/prod — one folder per product, from dist/<product>/prod/: the drop-in
 *               bundle Joinery embeds, with the integration API on its exports. The
 *               dev/ variant beside it in dist/ — unminified script, sourcemap,
 *               demo page, css, fonts, icons — is ours and is not staged.
 *
 * Both are self-contained and path-relative, so either can sit at any URL.
 * Run `npm run build` first — prod is a copy of dist/, not a rebuild.
 */

import { access, cp, mkdir, readdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEPLOY = resolve(ROOT, 'deploy');
const DIST = resolve(ROOT, 'dist-embed');

// index.html resolves everything ./-relative, and asset-paths.js anchors GLB and
// HDR loads to js/../ — so the tree beside index.html has to keep its shape.
const DEV_ENTRIES = ['index.html', 'js', 'src', 'css'];

try {
  await access(DIST);
} catch {
  console.error('dist/ is missing — run `npm run build` first.');
  process.exit(1);
}

await rm(DEPLOY, { recursive: true, force: true });
await mkdir(resolve(DEPLOY, 'dev'), { recursive: true });

for (const entry of DEV_ENTRIES) {
  await cp(resolve(ROOT, entry), resolve(DEPLOY, 'dev', entry), { recursive: true });
}

// The contents of prod/, not the folder itself — deploy/prod/<product>/ keeps
// the flat shape whoever uploads it already has instructions for.
for (const dir of await readdir(DIST)) {
  await cp(resolve(DIST, dir, 'prod'), resolve(DEPLOY, 'prod', dir), { recursive: true });
}

console.log('deploy/dev            → upload contents to the folder serving the UI-panel build');
console.log('deploy/prod/<product> → one folder per product script (no demo page — see dist/<product>/dev/)');
