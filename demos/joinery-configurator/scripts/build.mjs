/**
 * Produces dist/ — one folder per product, each split into dev/ and prod/.
 *
 * prod/ is the drop-in bundle Joinery deploys: the minified script, the models and
 * the environment map. dev/ is what we develop against — unminified, with a
 * sourcemap, the demo page, and unused copies of the css/fonts/icons kept so
 * dev/ mirrors the pre-split folder. Nothing under js/ ever fetches them, so
 * shipping them to Joinery was 86 kB of files a browser never requested.
 *
 * `three` is bundled in rather than left as a bare specifier: the client page
 * has no importmap of ours, and if it has one of its own, a bare `three` would
 * resolve to their copy.
 *
 * Assets keep their src/-relative paths inside dist/assets so resolveAsset()
 * works identically bundled and unbundled.
 */

import { build } from 'esbuild';
import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// dist-embed/, not dist/: dist/ is the deployable site produced by build-site.mjs,
// so that `npm run build` means the same thing here as in every other demo.
const DIST = resolve(ROOT, 'dist-embed');

// Small enough to take wholesale, and 3d_ar.css references them by name.
const ASSET_DIRS = [
  'src/fonts',
  'src/ar-ui-icons',
  'css',
];

// Models and HDRs are listed one by one instead. src/models also holds work in
// progress and superseded models — copying the directory shipped 22 MB Joinery
// never loads, including products we have not released. The GUI's other HDRs
// stay out because GUI_MODE_LIGHTING is off in any build.
const SHARED_ASSET_FILES = [
  'src/environment/studio_kontrast_02_1k.hdr',
];

// One entry per shipped script. `dir` is the folder Joinery receives; `models` are
// the GLBs only this product loads — listing them per product is what takes the
// window embed from 33 MB to 6.6 MB.
const PRODUCTS = [
  {
    type: 'window',
    dir: 'window',
    entry: 'js/integration/entry-window.js',
    models: ['src/models/window_demo.glb'],
    demo: 'demo/window.html',
    foreign: ['js/door-controller.js', 'js/back-door-controller.js', 'js/door-leaf.js'],
  },
  {
    type: 'door',
    dir: 'door',
    entry: 'js/integration/entry-door.js',
    models: ['src/models/door_demo.glb'],
    demo: 'demo/door.html',
    foreign: ['js/window-controller.js', 'js/back-door-controller.js'],
  },
  {
    type: 'backDoor',
    dir: 'backdoor',
    entry: 'js/integration/entry-backdoor.js',
    models: ['src/models/door_demo_back.glb'],
    demo: 'demo/backdoor.html',
    foreign: ['js/window-controller.js', 'js/door-controller.js'],
  },
];

// Dev-only surface that must never leak into any product bundle. Checked
// against all three in addition to each product's own `foreign` list — the
// per-product lists only catch a *sibling* controller, so ui-controller.js
// leaking into the window bundle (it legitimately imports window-controller.js)
// would otherwise slip through unnoticed.
const DEV_ONLY_MODULES = ['js/ui-controller.js', 'js/dev-products.js', 'js/dev-console.js'];

// What separates the two folders. Everything not listed here — the entry point,
// the shared assets, the product's own models — is identical in both.
const VARIANTS = [
  { name: 'dev', minify: false, sourcemap: true, assetDirs: ASSET_DIRS, demo: true },
  { name: 'prod', minify: true, sourcemap: false, assetDirs: [], demo: false },
];

const THREE_ROOT = 'js/libs/three.0.183.2';
const ADDONS_PREFIX = 'three/addons/';

// The browser resolves `three` and `three/addons/` through the importmap in
// index.html. esbuild has no importmap, so it needs the same two rules.
const threeImportmap = {
  name: 'three-importmap',
  setup(build) {
    build.onResolve({ filter: /^three$/ }, () => ({
      path: resolve(ROOT, THREE_ROOT, 'build/three.module.min.js'),
    }));

    build.onResolve({ filter: /^three\/addons\// }, args => ({
      path: resolve(ROOT, THREE_ROOT, 'examples/jsm', args.path.slice(ADDONS_PREFIX.length)),
    }));
  },
};

await rm(DIST, { recursive: true, force: true });

for (const product of PRODUCTS) {
  for (const variant of VARIANTS) {
    const out = resolve(DIST, product.dir, variant.name);
    await mkdir(out, { recursive: true });

    const result = await build({
      entryPoints: [resolve(ROOT, product.entry)],
      outfile: resolve(out, 'joinery-configurator.js'),
      bundle: true,
      format: 'esm',
      target: 'es2022',
      minify: variant.minify,
      sourcemap: variant.sourcemap,
      legalComments: 'none',
      metafile: true,
      plugins: [threeImportmap],
      // jQuery and GSAP are page globals loaded by <script>, not modules.
      external: ['jquery', 'gsap'],
      define: {
        __JOINERY_ASSET_BASE__: '"./assets/"',
        __JOINERY_PRODUCT_TYPE__: JSON.stringify(product.type),
      },
    });

    // The split is only real if the other products' controllers are gone. A
    // stray static import would otherwise ship all three again, silently.
    // Run against both variants: the metafile is produced either way, and
    // checking prod alone would let dev drift into a sibling import unnoticed.
    const inputs = Object.keys(
      Object.values(result.metafile.outputs).find(o => o.entryPoint).inputs,
    );

    for (const foreign of [...product.foreign, ...DEV_ONLY_MODULES]) {
      if (inputs.includes(foreign)) {
        throw new Error(
          `build: the ${product.type} ${variant.name} bundle still contains ${foreign} — ` +
          'something imports it statically outside its entry file.',
        );
      }
    }

    for (const dir of variant.assetDirs) {
      await cp(resolve(ROOT, dir), resolve(out, 'assets', dir), { recursive: true });
    }

    // A renamed model must break the build here rather than 404 on Joinery's site.
    for (const file of [...SHARED_ASSET_FILES, ...product.models]) {
      const from = resolve(ROOT, file);
      try {
        await stat(from);
      } catch {
        throw new Error(`build: ${file} is listed for ${product.type} but does not exist`);
      }
      const to = resolve(out, 'assets', file);
      await mkdir(dirname(to), { recursive: true });
      await cp(from, to);
    }

    // The demo page is our reference, not a deployable — hence dev only. The
    // source version imports the unbundled modules so we can develop against
    // it; this copy points at the bundle and drops the importmap, since three
    // is compiled in.
    if (variant.demo) {
      const demo = await readFile(resolve(ROOT, product.demo), 'utf8');

      await writeFile(
        resolve(out, 'demo.html'),
        demo
          .replace(`../${product.entry}`, './joinery-configurator.js')
          .replace(/\s*<!-- Three\.js is bundled[\s\S]*?<\/script>\r?\n/, '\n'),
        'utf8',
      );
    }

    const bytes = Object.values(result.metafile.outputs)
      .reduce((sum, o) => sum + o.bytes, 0);
    const note = variant.sourcemap ? ' (incl. sourcemap)' : '';

    console.log(
      `dist/${product.dir}/${variant.name}/joinery-configurator.js — ${(bytes / 1024).toFixed(0)} kB${note}`,
    );
  }
}
