# CHANGES.md — joinery-configurator

Everything that differs from `MY_DEMOS/dhk-windows-doors`. The original is untouched.

Slug: `joinery-configurator` · Deploy path: `/demos/joinery-configurator/`
Source: Marevo Vision · 100 of 100 commits yours

---

## Sanitisation

### Client name

`DHK` → `Joinery` across **25 files**, applied longest-token-first so no rule could eat
another's prefix:

| from | to |
|---|---|
| `__DHK_ASSET_BASE__`, `__DHK_PRODUCT_TYPE__` | `__JOINERY_ASSET_BASE__`, `__JOINERY_PRODUCT_TYPE__` |
| `dhk-configurator` (build output filename) | `joinery-configurator` |
| `DHK_CONFIG`, `DHK_DEBUG` | `JOINERY_CONFIG`, `JOINERY_DEBUG` |
| `window.dhk` (console test handle) | `window.joinery` |
| `DHK` / `dhk` in prose, titles, comments | `Joinery` / `joinery` |

`js/libs/` was excluded — vendored code is not ours to rewrite. **0 occurrences remain**
outside it. All 111 tests still pass afterwards, which is what makes an identifier
rename of this size safe to do at all.

### A *different* client's branding was in here

`src/index/` held `HelloChairHeader{,2,3}.png`, `HelloChairHeader* copy.png`,
`Hellotable_logo.jpg` and `Hellotable_logo.png` — leftovers from the skeleton this
project was started from. Two were live, not dead:

- `.marevo_loader__logo` used **`Hellotable_logo.jpg` as the loading-screen logo**. So
  the first thing a visitor saw was another client's brand mark. Replaced with a
  generated neutral `loader-logo.png`.
- `#hello-table-header` / `#hello-table-footer` referenced `HelloChairHeader2.png` and
  `HelloChairHeader3.png`. Those ids appear in **no HTML anywhere in the project** and
  the rules are marked `/*! TEMP */` upstream — dead scaffolding. Rules and images both
  removed.

### Client documentation removed

`docs/integration/` (contract v1, requested parameter options, accepted values,
pre-integration docs, coverage notes) is the client's commercial integration contract,
not a code sample. Removed in full.

### What was *not* sanitised, and why

There were **no outbound CTAs, no quote form, no cart and no auth** to disable — this
build never had any. The `data-demo-disabled` treatment the brief describes has nothing
to attach to here. The product geometry and the finish/hardware catalogue are the real
ones; the profile values (PVC 70/90/120, ALU 70/90/120) are industry-standard sizes.

## Third-party requests — all three removed

The demo now makes **zero external requests**. Verified from
`performance.getEntriesByType('resource')` on a real load: 67 requests, all same-origin.

| was | now |
|---|---|
| `quickchart.io/qr?text=<page URL>` for the AR QR code | Generated locally. **This one mattered**: it sent the full page URL — configuration state and all — to a third party every time the AR panel opened, and put a live demo at the mercy of someone else's uptime. Replaced with `js/libs/qr/qrcode.js`, the same from-scratch module the stairs configurator uses. |
| `fonts.googleapis.com` + `fonts.gstatic.com` (Rubik) | Self-hosted `rubik-latin-{400,700}-normal.woff2` in `src/fonts/` + `css/rubik.css`. Every visitor's IP reached Google before first paint; that is a consent question this portfolio does not want to have. |
| `modelviewer.dev/shared-assets/icons/hand.png` (AR prompt) | Local `src/ar-ui-icons/ar-hand.svg`. |

Also removed: `loadThreeJSFonts()` in `js/system/utils3d.js`, which fetched a typeface
from `threejs.org` at runtime. It was exported but **called from nowhere** in the
project — dead code holding a live external dependency.

## Assets — 53.9 MB → 33.8 MB

| change | saved |
|---|---|
| `window_door_demo.glb` removed — a superseded model referenced nowhere in the codebase (the build script's own comment notes `src/models` holds work-in-progress and superseded models) | 10.2 MB |
| 6 of 7 environment maps removed — `ENV_MAP_OPTIONS` only feeds the debug GUI, and `GUI_MODE_LIGHTING` is `false`, so only `studio_kontrast_02_1k.hdr` is ever loaded | 9.5 MB |
| `docs/integration/`, foreign-client images | 0.4 MB |

### The compression attempt that failed, and why that's the interesting part

Unlike the stairs model (99.8% textures), these are **~95% geometry** — `door_demo.glb`
is 13.19 MB of vertex data against 0.60 MB of textures. So the levers are Draco or
quantization, and I tried both:

| approach | result | verdict |
|---|---|---|
| `KHR_mesh_quantization` (14-bit position) | 39.6 → 26.0 MB (1.5×) | **rejected — broke the tests** |
| Draco (`edgebreaker`) on `window_demo` | 4.11 → 3.01 MB (1.4×) | not worth it |

Draco underperformed because it compresses a primitive's *base* attributes and leaves
morph targets alone — and the payload here is nearly half morph-target deltas
(`door_demo`: 6.50 MB base, 6.03 MB morphs across 486 targets). It would also have
needed a decoder that the vendored three build doesn't carry and that `DRACOLoader`
fetches from a Google CDN by default.

Quantization *did* apply to morph targets, and that is exactly why it failed. **The
project's own test suite caught it — six tests, all of them substantive:**

```
✖ each frame shares a height-morph delta with the leaf it is paired with
    alum_door_glass_back: leaf morphs 29951000.0mm but its frame morphs 29195000.0mm
✖ every tintable material in the map exists in the model
    ekoline_72_73_alum_inside_planar_y is not a material in the model
✖ atlas designs keep baked UVs inside the texture
```

Two real breakages, not test brittleness:

1. `dedup()` **merged materials**, so a material the app tints *by name* at runtime
   stopped existing. That would have broken colour selection in the running demo, not
   just in CI.
2. Quantization perturbed morph deltas that the product logic compares between paired
   meshes, and pushed atlas UVs outside their texture bounds.

`prune()` separately removed a mesh from `door_demo_back.glb` that nothing in the glTF
referenced — but the configurator resolves meshes by name at runtime, so an
unreferenced node is not an unused one.

**Original models restored.** 111 tests pass. The honest summary: these models can't be
compressed with off-the-shelf tooling because the morph rig *is* the product logic —
getting them smaller means re-authoring them in Blender, not running a CLI over them.

### Load profile (measured, not estimated)

| | |
|---|---|
| Initial page load | **8.08 MB over 67 requests, 0 external** |
| of which `window_demo.glb` | 4.11 MB |
| of which `studio_kontrast_02_1k.hdr` | 1.33 MB |
| of which `model-viewer.min.js` | 0.93 MB |
| Other product models | loaded on demand (`door_demo` 14.2 MB, `door_demo_back` 11.0 MB) |
| dist/ total on disk | 33.8 MB |

Over the brief's 5 MB target, and I don't think it can get under it without
re-authoring the geometry. The HDR is the one easy remaining win (~1.1 MB by dropping
to 512²) if you want it.

## Loading progress added

The models are 4–15 MB — several seconds on a phone — and the existing loader was a
bare spinner reading "Configurator loading…", which at that length reads as a hang.
`loadModel()` now passes an `onProgress` handler to `GLTFLoader.loadAsync` and renders
a percentage. Falls back to megabytes-downloaded when the server sends no
`Content-Length`, rather than showing a percentage that would be a guess.
Verified reaching `100%` on a real load.

## Build

Two builds now, because there were two jobs sharing one output folder:

| command | output | purpose |
|---|---|---|
| `npm run build` | `dist/` | the deployable site — `scripts/build-site.mjs`, new |
| `npm run build:embed` | `dist-embed/` | the original three single-product client embeds — `scripts/build.mjs`, unchanged apart from the output path |

`tests/build-output.test.mjs` and `scripts/stage-deploy.mjs` were repointed to
`dist-embed/` so the contract tests keep guarding the embed build.

**No Vite here, deliberately** — same reasoning as the stairs demo. The page resolves
`three` through a native importmap and loads assets by relative path, so `dist/` works
at any subpath with no base rewrite. Adding a bundler would also collide with the
existing esbuild pipeline, which has contract tests asserting on its output shape.

## Portfolio scaffolding

`DEMO_NOTICE.md`, HTML comment notice, `portfolio/badge.{css,js}`, `.nvmrc` → `24`,
`package.json` description/author crediting Marevo Vision.

The badge is anchored to `#ar_model_viewer` via `data-pf-badge-anchor` (that element is
already `position: relative`), so it sits inside the 3D viewport and clears the control
panel at every width.

## Verification run

| Check | Result |
|---|---|
| `node --test` | **111 tests, 105 pass, 0 fail** (6 skip without `dist-embed/`) |
| `npx eslint js scripts tests` | 2 errors — **both pre-existing**, see below |
| `npm run build` | dist/ 33.76 MB |
| Loads at `/demos/joinery-configurator/` | title, WebGL context, 3 product buttons |
| External requests | **0 of 67** |
| Secrets / `.env` / keys | none (one grep hit is a security test asserting `file:///etc/passwd` is rejected) |
| Remaining `dhk` outside `js/libs/` | **0** |
| Loading progress | reaches 100% |
| Desktop | no horizontal overflow |
| Mobile 380 × 760 | no overflow, no sideways scroll; viewer 380×304 (40dvh, as designed); badge inside the viewer; controls reachable |

### Two pre-existing lint errors — your call

```
js/system/morphSystem.js
  14:10  'setPlanarTextureScale' is defined but never used
  19:10  'Shader_ChangeVertexToWorldposOld' is defined but never used
```

**These fail in the original too** — I checked before touching anything. I left them
alone: `Shader_ChangeVertexToWorldposOld` is clearly kept on purpose as a reference
implementation, and deleting your code is sanitisation overreach. But a recruiter who
runs `npm run lint` sees a red result. Delete them, or add an `eslint-disable` with a
one-line reason — either is a thirty-second fix, and it should be your decision.

### Not verified

The rendered image and the interaction behaviour — the Browser pane doesn't composite
for me, so everything above is structural, network-level and test-level. Worth a manual
pass on: colour selection (the material-name lookup the failed compression would have
broken), the door open/close animation, and AR on an actual phone.
