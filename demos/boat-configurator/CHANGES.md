# CHANGES.md — boat-configurator

Everything that differs from `MY_DEMOS/react_alba`. The original is untouched.

Slug: `boat-configurator` · Deploy path: `/demos/boat-configurator/`
Source: Avada Media · 271 of 776 commits yours

---

## The schema problem, and how it was solved

You confirmed there is no saved copy of the `VITE_SCHEMA_API` response, and said to
simplify as much as needed. So rather than reconstructing the client's generated UI
from its reducers, this build **keeps the 3D layer and replaces the schema-driven UI
with a hand-built control panel**.

That works because of how the original was built: `BoatApplication` never saw the
schema. It exposes an imperative API — `setEngine(path)`, `setColor(name, hex)`,
`setModelTexture({ objName, texture, color })`, `moveCameraToConsole()`,
`moveCameraToBoat()` — and the React layer resolved schema entries into those calls.
Swapping the source of the options changes nothing below that line.

`src/db/boat.ts` now declares the catalogue locally: 11 engines + "no engine", three
upholstery materials, six colours. **Invented values in the production shape.**

## Sanitisation

| Item | Action |
|---|---|
| `.env` | **Deleted.** Held a live `VITE_API_KEY`, `VITE_DOMAIN_ID` and ~30 production endpoint URLs. |
| Client brand ("Alba", "Albatross") | Gone. Title is now "Boat Configurator". |
| `yamaha_*.glb` ×10, `mercury_250_300.glb` | Renamed `outboard-01…11.glb`. Two manufacturers' trademarks in filenames. Geometry untouched; labels in the panel are neutral capacities ("50–60 hp · tiller"). |
| `src/services/` (auth fetcher, axios config, token service) | Removed — no backend, no auth. |
| `src/store/` — 12 slices wrapping API thunks | Replaced with one local `configurator` slice. |

Verified: grep for `api_key|secret|password|access_token|bearer|domain_id` → **0 matches**.
Grep for `alba|albatross|yamaha|mercury` across `src/`, `public/`, `index.html`,
`package.json` → **0 matches**. No `.env`, no keys.

## Removed with the shell

`src/components` (all screens), `src/services`, `src/store` (rewritten),
`src/dictionares`, `src/constants`, `src/utils`, `src/types`, `src/assets`, `email/`,
and seven hooks that only served removed screens.

Dependencies dropped: `axios`, `react-router-dom`, `redux-persist`, `react-hook-form`,
`react-select`, `react-toastify`, `react-input-mask`, `react-code-input`,
`@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`,
`vite-plugin-style-import`.

`gsap` was dropped and then **put back** — it drives the camera transitions inside
`BoatApplication`, so it is scene code, not shell code. Caught by grepping `src/`
before trusting the prune.

Redux Toolkit stays. The point of this demo is Three.js *inside a React/TS
architecture*, and deleting the store would delete half the claim. One slice
(`status`, `progress`, four selections) replaces twelve.

## External requests — all removed

| was | now |
|---|---|
| `https://www.gstatic.com/draco/versioned/decoders/1.5.6/` | **Vendored to `public/draco/`.** This one was load-bearing, not cosmetic: the models *are* Draco-compressed, so without the decoder nothing renders at all. A demo should not need a Google CDN to draw its own geometry. |
| `fonts.googleapis.com` / `fonts.gstatic.com` (Exo 2) | Self-hosted `exo-2-latin-{400,600}-normal.woff2` + a local `@font-face` block. |

Measured on a real load: **10 requests, 0 external, 0 failed.**

## Four broken asset paths — all of which would have 404'd at a subpath

The audit noted `base: './'` was already set, so I expected asset paths to be fine.
They were not — three loaders build their URLs in JS, where Vite's `base` does not
reach:

| file | was | now |
|---|---|---|
| `boat-configurator/index.js` | `'/models/boat-4.glb'` | `'./models/boat-4.glb'` |
| `boat-configurator/index.js` | `` `/textures/${texture}/normal_map.jpg` ``, `ao_map.jpg` | `./textures/…` |
| `utils/Renderer.js` | `"/textures/lake_env.hdr"` | `"./textures/lake_env.hdr"` |
| `utils/AnnotationMaker.js` | `"/textures/bicycle-textures/circle.png"` | `"./textures/annotation-dot.png"` |

The last one is worth calling out: **`bicycle-textures/` does not exist in this
project.** It is a dangling path from an earlier configurator, so the annotation
sprite 404'd upstream too. Replaced with a generated dot.

Caught by asserting on `responseStatus >= 400` across every request rather than by
eyeballing the page — the first pass looked fine and was quietly missing four files.

## Loading progress

`init()` used to subscribe to `loadedProgress` with an **empty callback** — the
loading manager reported progress and the app threw it away, so the UI could only
show a spinner. `init()` now takes an `onProgress` callback, the store holds the
value, and `Canvas` renders a real progress bar. The model is 3.65 MB after Draco;
that is several seconds on a phone.

## New code (mine, not yours)

- `src/App.tsx`, `src/main.tsx` — one screen, no router, no `PersistGate`.
- `src/components/Canvas.tsx` — owns the THREE lifecycle. The instance lives in a
  `ref`, not the store: it holds WebGL resources and mutates every frame, so putting
  it in Redux would mean either a non-serialisable value in state or a re-render per
  frame. Guarded against StrictMode's double-invoke, since `BoatApplication` is a
  singleton and a second init would re-add the model.
- `src/components/ControlPanel.tsx` — maps store state to scene calls. Every effect is
  guarded on `status === 'ready'`, because the setters walk `scene.traverse` and
  silently no-op before the model exists, which looks like a broken control rather
  than an early one.
- `src/store/configurator/configurator.slice.ts`, `src/store/store.ts`.
- `src/styles/fonts.scss`, `App.scss`, `Canvas.scss`, `ControlPanel.scss`.

**The disabled CTA:** "Request a quote" is rendered, greyed, `data-demo-disabled`,
`cursor: not-allowed`, with a line of explanation underneath — per the brief, a
disabled button tells a better story than a missing one.

## Build

`npm run build` → `dist/` (**14.49 MB**). Initial load **7.30 MB over 10 requests**,
of which `boat-4.glb` is 3.65 MB (already Draco) and `lake_env.hdr` is 1.6 MB.

Removed `@import "react-toastify/ReactToastify.min.css"` from `global.scss` — it broke
the build once the package was pruned, and there is nothing left to toast about (no
cart, no auth, no form submissions).

**Over the 5 MB target.** The available win is `lake_env.hdr`: an uncompressed 1.6 MB
Radiance file where a 512² version would be ~400 KB. I left it rather than change the
lighting the scene was authored against — your call.

## Portfolio scaffolding

`DEMO_NOTICE.md`, HTML comment notice, `portfolio/badge.{css,js}`, `.nvmrc` → `24`,
package renamed with description and author crediting Avada Media.

## Verification run

| Check | Result |
|---|---|
| `npm run build` | clean (`tsc` passes) |
| Loads at `/demos/boat-configurator/` | canvas present, panel renders |
| Panel controls | 12 engine options, 3 material chips, 12 colour swatches, 1 disabled CTA |
| Runtime errors | **none** (`error` + `unhandledrejection`, 5 s window) |
| Failed requests | **0** (was 4 before the path fixes) |
| External requests | **0** |
| Draco decoder | loads from `./draco/` |
| Model | `boat-4.glb` loads |
| Secrets / brand / trademarks | **0 matches** |
| Desktop 1280 px | no overflow, no sideways scroll |
| Mobile 380 px | no overflow, no sideways scroll (panel stacks under the canvas at ≤900 px) |
| `npx eslint src` | 2 errors — **pre-existing**, `@ts-nocheck` in `EventEmitter.ts`; identical in the original |

### Not verified

**Whether the configurator visually works** — whether the engine appears in the right
place, the upholstery texture applies to the right meshes, and the camera transitions
land. The harness's browser pane doesn't composite, so there is no render loop and no
screenshot.

This is the demo where that matters most, because the control panel is new code
calling a scene API I did not write. The three things to click first: **engine swap**
(does it attach at `engine-point`?), **upholstery** (does `inner-carpet` retexture?),
and **Console view / Full view** (do the gsap camera tweens run?).
