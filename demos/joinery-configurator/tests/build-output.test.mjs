import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const DIST = join(ROOT, 'dist-embed');

// The build needs esbuild and writes ~85 MB, so it is not a test prerequisite.
// These assertions describe dist/ when it exists and skip on a clean checkout.
const noDist = existsSync(DIST) ? false : 'dist/ absent — run `npm run build:embed` first';

const PRODUCTS = [
  { dir: 'window', model: 'window_demo.glb' },
  { dir: 'door', model: 'door_demo.glb' },
  { dir: 'backdoor', model: 'door_demo_back.glb' },
];

const HDR = 'assets/src/environment/studio_kontrast_02_1k.hdr';

/** Every file under `dir`, relative to it, with / separators. */
function walk(dir, prefix = '') {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => (
    e.isDirectory()
      ? walk(join(dir, e.name), `${prefix}${e.name}/`)
      : [`${prefix}${e.name}`]
  ));
}

test('each product folder splits into dev and prod', { skip: noDist }, () => {
  for (const { dir } of PRODUCTS) {
    assert.deepEqual(readdirSync(join(DIST, dir)).sort(), ['dev', 'prod']);
  }
});

// Exhaustive on purpose: an allowlist also catches a file we stop needing,
// which a list of forbidden paths never would.
test('prod holds the script, the models and the HDR — nothing else', { skip: noDist }, () => {
  for (const { dir, model } of PRODUCTS) {
    assert.deepEqual(walk(join(DIST, dir, 'prod')).sort(), [
      HDR,
      `assets/src/models/${model}`,
      'joinery-configurator.js',
    ].sort());
  }
});

// Restated separately from the manifest above so a regression names itself
// instead of surfacing as a diff of two long arrays.
test('prod ships no stylesheets, fonts, icons, sourcemap or demo page', { skip: noDist }, () => {
  for (const { dir } of PRODUCTS) {
    for (const file of walk(join(DIST, dir, 'prod'))) {
      assert.doesNotMatch(file, /(^|\/)(css|fonts|ar-ui-icons)\//, `dist/${dir}/prod ships ${file}`);
      assert.doesNotMatch(file, /\.map$/, `dist/${dir}/prod ships ${file}`);
      assert.notEqual(file, 'demo.html', `dist/${dir}/prod ships demo.html`);
    }
  }
});

test('dev keeps the full asset set, the sourcemap and the demo page', { skip: noDist }, () => {
  for (const { dir, model } of PRODUCTS) {
    const files = walk(join(DIST, dir, 'dev'));

    for (const expected of [
      'joinery-configurator.js',
      'joinery-configurator.js.map',
      'demo.html',
      'assets/css/3d_ar.css',
      'assets/css/styles.css',
      'assets/src/fonts/Surt-Normal-Bold.otf',
      'assets/src/fonts/Surt-Normal-Regular.otf',
      'assets/src/ar-ui-icons/cube.svg',
      `assets/src/models/${model}`,
      HDR,
    ]) {
      assert.ok(files.includes(expected), `dist/${dir}/dev is missing ${expected}`);
    }
  }
});

// A size ratio is the obvious check and the wrong one: three.js is vendored
// pre-minified (js/libs/three.0.183.2/build/three.module.min.js) and dominates
// both bundles, so minify:false only shrinks our own code — dev lands at ~1.41x
// prod, not the 2x+ you would expect. Our identifiers surviving is the property
// that actually matters. resolveAsset() is in js/asset-paths.js, which every
// product imports.
test('dev keeps our source identifiers, prod mangles them', { skip: noDist }, () => {
  for (const { dir } of PRODUCTS) {
    const dev = readFileSync(join(DIST, dir, 'dev', 'joinery-configurator.js'), 'utf8');
    const prod = readFileSync(join(DIST, dir, 'prod', 'joinery-configurator.js'), 'utf8');

    assert.ok(
      dev.includes('function resolveAsset'),
      `dist/${dir}/dev has no readable resolveAsset — it was minified`,
    );
    assert.equal(
      prod.includes('function resolveAsset'),
      false,
      `dist/${dir}/prod has a readable resolveAsset — it was not minified`,
    );
  }
});

const DEPLOY = join(ROOT, 'deploy');
const noDeploy = existsSync(DEPLOY) ? false : 'deploy/ absent — run `npm run stage` first';

// deploy/dev is the unbundled panel; deploy/prod/<p> is the embed. The dist
// split must not add a second dev//prod level underneath either of them.
test('staging flattens prod into deploy/prod/<product>', { skip: noDeploy }, () => {
  for (const { dir } of PRODUCTS) {
    const files = readdirSync(join(DEPLOY, 'prod', dir));

    assert.ok(files.includes('joinery-configurator.js'), `deploy/prod/${dir} has no script`);
    assert.equal(files.includes('prod'), false, `deploy/prod/${dir}/prod — the dist split leaked into deploy/`);
    assert.equal(files.includes('dev'), false, `deploy/prod/${dir}/dev — the dev bundle should not be staged`);
  }
});
