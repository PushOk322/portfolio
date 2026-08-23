# Stairs Generator

A browser 3D stairs configurator. Sliders (total height, target step height, tread
length, stair width, flight count) drive a procedurally assembled staircase.

**New here? Read `docs/onboarding.md` first** — structure, terminology, the file map,
and how to run it. This file is the rules and the traps, and assumes that one.

Rebuilt from an imported reference project ("Freedom Bath", a bathroom configurator).
That import survives at commit `d635465` — recover anything with
`git checkout d635465 -- <path>`.

`js/` is layered, and the layers are a dependency ordering — `scene/` and `view/` may
import `core/`, never the reverse:

```
js/  main.js (boot)  settings.js (constants, all layers)
     core/   pure: layout, state, state-manager, morph, piece-contract, url-adapter, codec
     view/   DOM:  ui-controller, controls-schema, drawer
     scene/  THREE: 3d-scene, 3d-controller, piece-library, ar-controller
     libs/   vendored — lint-ignored, do not edit
```

## Hard rules

- **Units are metres, floats.** Never millimetres. THREE and glTF are metre-native, so
  there is no conversion boundary anywhere.
- **Zero external runtime dependencies. No CDN.** The old project fetched `lil-gui` from
  jsdelivr and a DRACO decoder from gstatic. Both are gone. Do not reintroduce either.
  Every request the app makes must be same-origin. **The vendored `<model-viewer>` bundle
  (`js/libs/model-viewer/`) contains hard-coded gstatic DRACO/basis and jsdelivr URLs in its
  source — they are model-viewer's *lazy* decoder locations, fetched only for compressed
  models. Our GLTFExporter output is uncompressed, so they never fire; verified by a clean
  network tab. Do not "clean them out" of the minified bundle, and do not panic when grep
  finds them.** The QR generator (`js/libs/qr/`) is a from-scratch same-origin module.
- **THREE only via bare specifiers** `three` / `three/addons/`. Never a relative path.
- **Nothing in `js/core/` may import `three` or touch `document`.** Node cannot resolve
  `three`, so one stray import breaks the entire test suite at import time. This is why
  `piece-contract.js` exists separately from `scene/piece-library.js`. **Enforced by eslint**
  (`no-restricted-imports` plus `document`/`window` switched off), not by memory — if
  you are moving a file into `core/`, lint will tell you whether it belongs there.
- **Never say "step" where you mean "riser."** `riserCount` is `n`. `stepPieceCount` is
  `n - N + 1`. `risersPerFlight` is `k_i`. The names `stepCount` / `stepsPerFlight` are
  banned precisely because they invite the confusion below.
- **No lights.** Environment map only. If it looks flat, that is the design.
- Debug logging uses the `STAIRS_DEBUG` prefix. Comment WHY, not WHAT.

## The one domain rule that matters

**A flight of `k` risers has only `k-1` step pieces.** The top riser's tread *is* the
landing above it. **The final flight is the exception at the top**: nothing stands in for
its top tread, because the upper floor is not a modelled piece, so it gets a real step
there. Therefore:

```
stepPieceCount = n - N + 1        landingCount = N - 1
```

A departing flight used to skip its first tread too, because its origin was pulled back one
`stepGoing` inside the landing — the skipped tread's surface landed over the landing
itself, so emitting it would have duplicated a surface you already stand on. That pullback
is gone (`ae509bf`, `8219acd`): a flight's origin now sits on the departure edge, so there is
no landing surface left to duplicate, and every flight emits from its first riser like the
sole flight always did. Re-introducing a skip here would silently drop a tread from the
export.

Sanity: 1 flight / 17 risers → 17 steps, 0 landings. 2 flights / 17 → [9,8] → 8 + 8 = 16
steps, 1 landing. If a count looks off by one, re-read this — it is not.

One consequence worth knowing: the long riser the step drop creates lands between a flight's
last tread and the landing above it, so the **final** flight escapes it — its top tread is a
step piece that drops with all the others.

**`stepGoing` is the steepness control, not `stepLength`.** Rake is `atan(h / stepGoing)`, so
a shorter going is a steeper stair: the 0.10–0.48 range spans 16.8°–72.6° (`h` — the actual
step height, not the `stepHeight` control — reaches 0.1450 at the shallow end and 0.3200 at
the steep end across the schema; the shallowest rake pairs that 0.1450 with the widest going,
the steepest pairs 0.3200 with the narrowest). `stepLength` is
the separate tread-mesh-depth control (0.24–0.48); when `stepGoing` drops below it the treads
overlap in plan (ship-stair style), which is intended. `stepLength` is what deliberately
outruns the tread mesh's own 0.3339 maximum — `PIECE_MORPH_OVERREACH` carries the rest.
`stepGoing` caps at 0.48 to match `stepLength`'s own ceiling: the landing-depth clamp,
`2 * (stepGoing + LANDING_BAR_MIN_LEG)`, only fires on a narrow stair, and even there it
stays under the landing mesh's own 1.2009 maximum — 1.16 at the ceiling.

**Each tread drops onto the stringer.** The bracket hangs at the tread's *centre*, where the
nosing line sits half a riser below the tread top, so the gap it bridges is
`0.5h + STRINGER_LANDING_CLEARANCE` — half a riser, **88 mm** at the default `h = 0.1765`
(147 mm before the beam was raised to meet the landing flush). The bracket reaches
`STEP_BRACKET_REACH` (0.1464, measured *after* piece-library's 0.035 re-anchor; the raw
accessor's 0.1114 is wrong by exactly that), which now clears that gap almost everywhere
instead of coming up short of it: it embeds into the beam by **58.2 mm** at the default
riser and up to **73.9 mm** at the shallowest reachable one (`h = 0.145`). It never exits the
far side — the beam's own vertical extent there, `0.08 / cos θ`, is 90.1 mm and 87.0 mm
respectively, always more forgiving than its 80 mm perpendicular section, with as little as
**13 mm** of margin at that worst case. `stepBracketDrop = max(0, 0.5h +
STRINGER_LANDING_CLEARANCE - STEP_BRACKET_REACH)` is what keeps that margin from going
negative at the steep end: it is zero for every `h ≤ 0.2928`, and only pulls the tread down
— at most 13.6 mm, at `h = 0.32` — for the sliver above it. **Below `h = 0.2928`, every riser
in the stair is exactly `h`**: the old cost, where a flight's first riser lost this drop and
its last gained it, is gone rather than capped, and the step off a landing (once a 58 mm
defect against a nominal 176 mm) is nominal like every other riser. Above that threshold the
same cost reopens in miniature — a flight's first riser runs up to 13.6 mm short and, for
every flight but the final one (still exempt, per the consequence above), its last riser runs
the same amount long. `STEP_BRACKET_DROP_RISER_LIMIT` (two-thirds of a riser) still guards
the drop but never binds any more — the uncapped value tops out at 13.6 mm against a 213 mm
cap — so it stays in the code as a tripwire, not a live mechanism. The bracket must not grow
from here: any more reach pushes the tip out through the underside of the beam (see
`docs/model-brief.md`).

Step count is **always derived**, never a control: `n = round(totalHeight / stepHeight)`,
then `h = totalHeight / n`. `totalHeight` is exact; `stepHeight` is a *target*. The UI
shows the resulting actual `h` beside it — without that readout the snapping looks like
a broken slider.

**One centre stringer per flight, following the nosing line, not the flight envelope**:
slope `atan(h / stepGoing)`, sitting on the flight centreline, its top face one drop below
the nosing line measured **vertically**. The gap under the treads is what each step's
embedded attachment bridges. A test asserts the envelope slope is steeper, specifically to
catch anyone "fixing" this.

**The drop is `LANDING_SLAB_THICKNESS + STRINGER_LANDING_CLEARANCE` — a settings constant,
not a derived one.** The `actualStepHeight` term that used to sit in this expression is
gone. On the default stair (`h = 0.1765`, slab 0.07) the old expression left the beam end at
`y = 1.3418`, a full riser (176 mm) below the landing underside at `1.5182` it was meant to
carry — rendered, that read as a bar floating under a slab rather than holding it up.
Dropping the `h` term raises the beam end to `1.5182` too: the gap is **zero**, on all four
headings and at both `stepHeight` extremes, which is what lets the landing bar actually
carry the landing instead of hanging a riser below it. `STRINGER_LANDING_CLEARANCE` (default
0) is the only knob left, and it now reopens the very gap this constant closes — a positive
value pushes the beam down at one millimetre per millimetre, no longer slack on top of a
riser-deep cushion. It stays at 0.

There is no way to close this gap only at landings: the beam runs parallel to the nosing
line, a fixed distance below it, and the landing sits on the same riser grid as every tread.
The clearance under a landing and the clearance under a tread are the *same number* —
closing one closes the other. That is why the fix is one constant rather than a special
case, and why there is no third option between a flush bar and a floating tread.

**The drop is vertical and that is the load-bearing detail.** A vertical drop keeps the
stringer parallel to the nosing line, so it clears *every* floor it touches by the same
`DROP` — which puts both ends of a flight the same distance under their own floor, and that
is what lets the landing bar between them run dead horizontal. Measured perpendicular
instead, the bottom end lands at `DROP / cos θ` and the top at `DROP * cos θ`, 23 mm apart at
the default rake and further apart the more you raise it; a bar spanning ends at two
different depths could not be level. A test asserts both ends sit the same distance under
their own landing.

**Length is exactly `k * hypot(stepGoing, h)` — `k` units, not the `k-1` the step pieces
get.** The top riser's tread is the landing above, so the stringer has to carry it; at `k-1`
the far end dangled a full riser below the landing with nothing under it. There is no
drop-back or embed term: the piece starts on its flight origin and runs exactly `k` units,
landing its far end at one drop below the landing above — the same clearance it starts with,
and exactly where the landing bar picks the beam up.

**A 180° reversal offsets sideways.** When a floor's direction is the exact opposite of
the flight arriving at it, the next flight steps one full `stepWidth` along the landing's
local +X and the landing piece is emitted with `scale: [2, 1, 1]` so it spans both. Every
other turn — including a straight continuation — offsets by nothing. The side is arbitrary
and not user-selectable; the layout is symmetric.

**The beam turns horizontal at a landing and carries on — no fastening anywhere.** A
`landingBar` is the stringer beam laid flat: one per axis-aligned segment of the path from
the arriving flight's stringer end to the departing flight's origin. A straight continuation
is already collinear, so it is one bar. Any turn corners once, on the landing centre: two
bars, `landingDepth/2 - stepGoing` then `landingDepth/2`. A 180° reversal corners on the
opposite side instead — a full `stepWidth` across, then one `stepGoing` back — because the
two flight centrelines are parallel a stair width apart rather than crossing. Bars sit at
the height both stringer ends already share (the vertical drop above is what makes that
level), are scaled along their own length like a stringer, and take their yaw from the
segment itself, not from either flight's heading — a reversal's first leg runs sideways,
along no flight's heading at all.

**Landing bar joints overlap on purpose — a butt joint at either one leaves a gap.** Two
0.08-square bars meeting at a corner cover three quadrants of the corner square; the fourth,
40 × 40 mm, is empty unless the first bar reaches `STRINGER_SECTION / 2` (0.04 m) past the
corner into it — exact on every turn type, so every non-final segment overshoots by that
much. The last segment, where the bar meets the departing stringer's square-cut start face,
overshoots by `STRINGER_SECTION * min(tan θ, 1 / sin θ)` instead: that face is perpendicular
to the beam's own axis, so its underside begins `STRINGER_SECTION * tan θ` forward of its top
corner, leaving a triangle open below that the first term closes exactly. The second term
caps how far the bar is allowed to hang below the beam once closing the triangle would ask
for more — one section, 0.08 m — and the two cross at **θ = 51.8°** (`cos θ = (√5 − 1)/2`):
41.5 mm at the default 27.4° rake (full closure, no cap), 91.9 mm at 60.5° against the
141.4 mm the triangle would need there (capped — a sliver stays open). The *arriving* joint
needs no extension: the same wedge falls inside the bar there, which is why only the
departing end ever showed daylight. Above 51.8° a mitred bar end is the only thing that
closes the rest — see `docs/model-brief.md`'s `stringer` section.

**The departing origin sits on the departure edge because there is nothing to pull it back
for any more.** The old fastening pair needed the arriving and departing ends to land
equidistant from the landing centre, which meant pulling the departing origin in by
`stepGoing`. A landing bar has no such constraint — it just needs to reach from wherever the
arriving beam stops to wherever the departing flight starts, whatever that distance is. The
cost that pullback bought is also gone: `totalRun` gains a full `landingDepth` per landing
now, not `landingDepth - stepGoing`, and a flight's first tread starts flush at the
departure edge instead of overhanging the landing.

**The landing-depth clamp survives for an unrelated reason.** It used to guard against two
fastening plates colliding; now it guards a quarter turn's first leg, `landingDepth/2 -
stepGoing`, from going negative — which it would at an 0.8 m stair with a 0.48 going,
folding the bar back behind its own start. `LANDING_BAR_MIN_LEG` (0.1) is the shortest leg
the clamp will tolerate; wide stairs never come close to needing it.

`PIECE_MORPH_OVERREACH` still exists, now for `step.length` alone: the tread's `length` key
is pushed to 0.48, past the 0.3339 the mesh reaches at shapekey influence 1, legitimate only
because that key is a pure translation of the tread's end faces. A test asserts the map
holds nothing but that one entry.

## Testing

Tests cover `js/core/` and nothing else — that is what the layer *is*. Deliberate,
per spec §11: *"UI and 3D wiring stay eyeball-verified — the solver is where bugs
actually hurt."* Everything in `view/` and `scene/`, plus `main.js`, has **no tests by
design and must not get any**; verify them by running the app. (The QR generator in
`js/libs/qr/` is pure and *could* be tested, but it lives under the lint-ignored
`js/libs`; its `encodeText` was structurally spot-checked by hand.)

## Traps that have already bitten

Each of these was a real bug found by running the thing, not by reading it.

- **`Box3.expandByObject` ignores `.visible`.** The instance pool therefore uses
  *parenting* (`root.add` / `removeFromParent`), not a visibility flag. A hidden-but-
  parented instance silently corrupts the camera fit. Don't "optimise" this back.
- **The camera fit must run against a current aspect ratio.** `create3DScene` doesn't
  render synchronously, so the first fit would otherwise use the placeholder `aspect = 1`
  and place the camera at roughly half the needed distance.
- **The camera fit preserves the user's orbit angle** — it re-fits distance and target
  only. It runs on every state change; resetting the direction would yank the view back
  on every slider tick.
- **Never render before content exists.** `waitForInitialSceneFrame` latches on the first
  rendered frame; a render scheduled before the pieces load would hide the loader over an
  empty scene. That is currently only safe because placeholders resolve in microtasks.
- **Judge "unused" vendor files by the import closure**, not by what our code imports.
  `GLTFLoader` imports `SkeletonUtils` and `BufferGeometryUtils`. Deleting them 404s and
  aborts the whole module graph. The five surviving addons are exactly the closed set.
- **`RGBELoader` is a deprecated subclass of `HDRLoader`** since r180 and warns on
  construction. Use `HDRLoader`.
- **An unpainted tab cannot verify this app at all.** `ResizeObserver` and
  `requestAnimationFrame` are both delivered during the browser's rendering steps, which
  a hidden or occluded tab never runs — so the loader hangs forever, the drawing buffer
  never resizes, and even a freshly constructed observer never gets its initial delivery.
  Nothing is wrong with the code. Force a paint (a screenshot will do) or use a genuinely
  visible window. Measured layout — computed styles, `getBoundingClientRect` — stays
  trustworthy throughout, because layout is computed on demand.

## Reserved, not built

| Feature | What already enables it |
|---|---|
| Railings | Not modelled. `layout.railingPath` is emitted but **its flight segments use the envelope slope, not the nosing slope** — recompute it, don't adopt it. `scene/3d-controller.js` has a reserved region. |
| localStorage | Second adapter against the existing seam. Precedence must be URL > localStorage > defaults. |
| Sawtooth stringer | Centre is the only variant built. Sawtooth needs per-step geometry — a different approach. |
| Stringer-to-landing joint | Built: a `landingBar` continues the beam horizontally across the landing — see "the beam turns horizontal" and "landing bar joints overlap" above for how the corner and departure gaps are closed without a mesh change. Two residuals survive, both square-cut artefacts: the undersides don't quite line up where a raked stringer meets a level bar — a step of `0.08 * (1 - cos θ)`, 9.0 mm at the default rake, up to 56 mm at the steepest — which falls inside the overlap and reads as a seam, not a gap; and above a 51.8° rake the departure overlap itself is capped, leaving a real sliver open, up to 172 mm at the schema's steepest 72.6° rake. A mitred bar end would close either; not built. |

## AR (built)

`js/scene/ar-controller.js` exports the assembled staircase (`getStaircaseRoot()` from
`scene/3d-controller.js`) to a GLB via `GLTFExporter`, hands the blob to a hidden `<model-viewer>`,
and calls `activateAR()` — Scene Viewer on Android, Quick Look on iOS. On desktop, where
`model-viewer.canActivateAR` is false, it shows a **QR** of the current config URL plus
`&ar=1`; scanning it opens the stair on a phone and auto-launches AR (`main.js` fires the AR
button when it sees `ar=1`). The QR is drawn by the from-scratch `js/libs/qr/` generator. All
of this is view-layer and **eyeball-verified** — no Node tests, and the actual AR handoff
needs a real device (the browser preview can only prove the export + QR halves).

**Flights are UI-capped at 1–2** (`view/controls-schema.js` pins the segmented `options`), but the
solver and its turn/reversal tests still run 1–4 — a stale URL can still encode more.

## The model

`src/model/step.glb` (the filename is legacy) holds the three loaded pieces and is **live** —
`USE_PLACEHOLDER_PIECES` in `settings.js` is `false`. Flip it back for box placeholders
matching the same contract. `step` arrives as a **Group**: a `wood_planar` tread plus the
`metal` bracket that reaches for the stringer. `landingBar` is not a fourth object in the
file — `PIECE_SOURCE_NAMES` aliases it to `stringer`, so it loads and clones from the same
mesh.

**The file still carries a `fastening` object from the old joint design.** Nothing loads it
— it isn't in `PIECE_TYPES` — so it just rides along unused. Leave it there; deleting it buys
nothing, and re-adding it to `PIECE_TYPES` as a "missing piece" would be a regression.

**The delivered origins are centred, not on the contract points.** `scene/piece-library.js`
re-anchors each prototype from its base-mesh bounds — top face to `y = 0`, stringer start
to `z = 0`. Deriving the shift from the bounds rather than hardcoding it is what makes a
corrected re-export shift by zero instead of double. Bounds come from the base positions,
never `Box3.setFromObject`, which expands by the morph targets.

Its shapekey extremes miss the slider ranges by 2–4 mm (`step.length` reaches 0.3339, not
0.33). `PIECE_MORPH_RANGES` still derives from `STAIRS_SCHEMA` on purpose — that slop is
below the visible threshold and the single source of truth is worth more.

See `docs/model-brief.md` for the piece list and `docs/stairs-anatomy.svg` for the
drawing.

## Docs

- `docs/onboarding.md` — structure, terminology, the file map. Start here.
- `docs/model-brief.md` — what the designer builds (send this to them)
- `docs/stairs-anatomy.svg` — designer-facing drawing
- `docs/superpowers/specs/` — design reasoning, one file per feature, newest last

The step-by-step build plans were deleted at `dafafa1` once the work shipped; recover
one with `git checkout dafafa1^ -- docs/superpowers/plans` if you ever need the history.
