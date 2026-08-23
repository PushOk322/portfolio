# Onboarding

A browser 3D stairs configurator. Six sliders drive a procedurally assembled
staircase — no build step, no runtime dependencies, no CDN.

This doc covers **what the pieces are called** and **where the code lives**.
For the rules that will bite you, read `../CLAUDE.md` after this.

## Run it

```bash
npm run serve       # static server; open the printed URL
npm test            # node --test — 130 tests, no deps. NEVER `node --test tests/` (fails on Node 24)
npm run lint        # eslint .
```

Node 18+ (the URL codec uses `CompressionStream`). The browser loads ES modules
directly via the import map in `index.html`.

## Terminology

Get these right — the code is strict about them and several are counter-intuitive.

| Term | Means |
|---|---|
| **riser** | One vertical rise. `riserCount` is **`n`**, `risersPerFlight[i]` is **`k`**. |
| **step piece** | One *tread mesh*. **Not** a riser — there are fewer of them (see below). |
| **tread** | The horizontal surface you stand on; the visible part of a step piece. |
| **flight** | An unbroken run of risers. `flightCount` is **`N`**. |
| **landing** | The slab where one flight ends and the next begins. There are `N - 1`. |
| **going** | Horizontal advance per riser — `stepGoing`. **This is the steepness control.** |
| **rake** | The stair's angle: `atan(h / stepGoing)`. Shorter going = steeper stair. |
| **`h`** | The *actual* riser height, `totalHeight / n`. Not the `stepHeight` slider. |
| **nosing line** | The line through every tread's front edge. The stringer runs parallel to it. |
| **stringer** | The single centre beam under a flight, 0.08 m square. One per flight. |
| **landing bar** | The stringer laid flat across a landing, joining one flight's beam to the next. |
| **drop** | How far the stringer's top face sits below the nosing line, measured **vertically**. |
| **morph** | A GLB shapekey. Sliders drive mesh dimensions through shapekey influence, not scale. |

**Never say "step" where you mean "riser."** The names `stepCount` and
`stepsPerFlight` are banned outright, because they invite exactly the confusion
the next section exists to prevent.

### The one rule that trips everyone

**A flight of `k` risers has only `k - 1` step pieces.** The top riser's tread
*is* the landing above it, so no mesh is emitted for it. The final flight is the
exception — the upper floor isn't modelled, so nothing stands in for its top
tread and it gets a real step piece there.

```
stepPieceCount = n - N + 1          landingCount = N - 1
```

Sanity check: 1 flight / 17 risers → 17 steps, 0 landings. 2 flights / 17 risers
→ `[9, 8]` → 8 + 8 = 16 steps, 1 landing. **If a count looks off by one, it isn't
— re-read this.**

### Units and axes

**Metres, floats, always.** Never millimetres. THREE and glTF are both
metre-native, so there is no conversion boundary anywhere in the codebase.

Directions are an absolute compass, `N`/`E`/`S`/`W`. A floor's direction is the
heading of the flight **leaving** it; the ground flight is always north.

## Structure

One direction, always. **State is the single source of truth; the DOM is only a
view.** Nothing writes back up the chain.

```
control input
  → stateManager.set(key, value)
  → stairs-state clamps/normalizes
  → subscribers notified:
       ├─ 3d-controller:  solveStairs(state) → place instances + morphs → render
       ├─ ui-controller:  refresh derived readouts
       └─ url-adapter:    debounced ?config= update
```

`js/` is grouped by **layer**, and the layers are a dependency ordering: `scene`
and `view` may import `core`, never the reverse.

```
js/
  main.js       boot sequence
  settings.js   tunable constants, shared by every layer
  core/         pure — no THREE, no DOM. The entire tested surface.
  view/         DOM only
  scene/        THREE only
  libs/         vendored (three, model-viewer, qr) — lint-ignored, do not edit
```

| File | Responsibility |
|---|---|
| `core/stairs-layout.js` | **the solver** — state in, pieces out. Where bugs actually hurt. |
| `core/stairs-state.js` | ranges, defaults, clamping |
| `core/state-manager.js` | generic store — **knows nothing about stairs** |
| `core/piece-contract.js` | piece names + morph ranges (THREE-free so tests can import it) |
| `core/morph-system.js` | dimension → morph influence |
| `core/url-adapter.js` | URL persistence |
| `core/configuration-url-codec.js` | deflate+base64 — **kept unchanged from the old project** |
| `view/ui-controller.js` | renders from schema, binds generically |
| `view/controls-schema.js` | controls declared as data |
| `view/drawer.js` | mobile controls drawer — no state, no scene |
| `scene/3d-scene.js` | renderer, camera, env map, render-on-demand |
| `scene/3d-controller.js` | layout → instances; exposes `getStaircaseRoot()` for AR |
| `scene/piece-library.js` | loads and re-anchors the GLB prototypes |
| `scene/ar-controller.js` | GLB export → `<model-viewer>` → AR; desktop QR fallback |

### Why `core/` is walled off

Node cannot resolve the bare specifier `three`. One stray `import ... from 'three'`
in `core/` breaks **the entire test suite at import time** — not one test, all of
them. This is also why `piece-contract.js` exists separately from `piece-library.js`.

The wall is enforced by eslint, not by good intentions: `js/core/**` has `three`,
`three/*`, `../view/*` and `../scene/*` as restricted imports, and has `document`
and `window` switched off so a DOM touch fails `no-undef`. (`globalThis.window`
still passes, deliberately — `url-adapter` uses it as an injectable default.)

## Testing

Tests cover the **pure modules only** — solver, state, morph mapping, codec,
piece contract. This is deliberate: *"UI and 3D wiring stay eyeball-verified —
the solver is where bugs actually hurt."*

Everything in `view/` and `scene/`, plus `main.js`, has **no tests by design and
must not get any.** Verify them by running the app.

One trap worth knowing before you try: **an unpainted browser tab cannot verify
this app at all.** `ResizeObserver` and `requestAnimationFrame` are only
delivered during the browser's rendering steps, which a hidden or occluded tab
never runs — so the loader hangs forever. Nothing is wrong with the code. Use a
genuinely visible window.

## Where to go next

- `../CLAUDE.md` — the hard rules, the geometry derivations, and the traps that
  have already cost someone a debugging session
- `model-brief.md` — what the 3D designer builds
- `stairs-anatomy.svg` — the drawing
- `superpowers/specs/` — design reasoning, newest last
