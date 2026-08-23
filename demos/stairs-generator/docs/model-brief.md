# Model brief — Stairs Generator

**For the 3D designer.** This is the complete list of pieces the configurator needs, now
and planned. Accompanying drawing: `stairs-anatomy.svg`.

## What the app does with your model

Sliders drive a staircase that is **assembled at runtime from a handful of pieces**. You
model each piece **once**; the app clones and positions it. A staircase is 11 to ~205
pieces depending on settings (a 30 m stair is a lot of treads).

Pieces resize two ways:

- **Shapekeys (morph targets)** for dimensions the user controls — a step modelled at its
  minimum width stretches to its maximum as an influence goes 0 → 1.
- **Scale** for one prismatic piece (the stringer) whose length spans a ~23× range, where
  a shapekey would be miserable to author and axial scaling is exact anyway.

## Delivery

**One file**, containing the named objects below at the top level. It lands in the repo at
`src/model/step.glb` — the filename is legacy, from when the file held only the step.

### Universal conventions — these are not negotiable, the maths depends on them

- **Metres.** The app is metre-native throughout; no conversion happens anywhere.
- **+Y is up. +Z is the direction of ascent. +X is the width across the flight.**
- **Apply all transforms.** No parent transforms, and **no transform on the object node
  itself** — the app overwrites each instance's position/rotation/scale, so a baked node
  transform (Blender's glTF exporter likes to put the +Y-up conversion there) would be
  silently destroyed. The loader now throws a clear error if it finds one, rather than
  quietly misorienting your piece.
- **Base mesh at the MINIMUM of every range.** Shapekey value 1.0 = the maximum.
- **One shapekey per axis**, named lowercase exactly as listed. Each key must displace
  vertices **only along its own axis** so keys compose additively without cross-talk.
- **No other shapekeys in the file.** No animations, no cameras, no lights.
- Keep it low-poly. There are no lights — the scene is lit by an environment map only.

---

## Part 1 — Required now (V1)

Three pieces, loaded by name from the delivered file. A fourth object, `fastening`, is
still in the file from an earlier joint design, but the app no longer reads it — leave it or
strip it, your call, it makes no difference to the app. (A landing bar is a fourth piece
*type* in the app, but not a fourth mesh: see the `stringer` section below.) Sizing and
placement are correct as delivered, including the `step`'s bracket length — it must **not**
grow from here; see the `step` section below for why. **One action is still open**: a mitred
end on the `stringer`'s start face, asked for in the `stringer` section below. The app's own
overlap fix closes the joint gap that end leaves except at steep rakes — see there for why
the mitre matters more now, not less.

### 1. `step`

The tread. The single most-cloned piece: **4 to ~200 per staircase** (a tall stair is mostly treads).

| | |
|---|---|
| Shapekey `width` | 0.80 → 1.20 (across the flight) |
| Shapekey `length` | 0.24 → 0.33 authored; **the app drives it to 0.48**, see below |
| Fixed | thickness — your call, ~0.04–0.05 |
| **Origin** | **centre of the TOP face** |

`width` grows symmetrically along ±X, `length` symmetrically along ±Z, thickness extends
downward (−Y). The app places this origin directly at the tread's top-centre.

A nosing overhang is welcome — model it into the piece, it is not separate.

**Carries the downward attachment into the centre stringer.** Each flight has a single
stringer on its centreline rather than one under each edge (see `stringer` below), so the
step brings its own attachment — the bracket already in the delivered file — whose end must
sit *inside* the stringer so the two read as welded rather than floating apart.

**The bracket is the correct length — do not lengthen it.** It hangs at the tread's
*centre*, where the nosing line sits half a riser below the tread top there, so the gap it
bridges is half a riser, roughly **73 to 160 mm** across the slider range — not the one and
a half risers an earlier version of this brief asked you to close. The delivered stem
reaches 0.1464 m below the underside, which now *exceeds* that gap almost everywhere instead
of falling short of it: the tip embeds into the beam by up to about 74 mm at the shallowest
rake, and the beam is deep enough to take it with roughly 13 mm to spare at that worst case.
That is the welded look this brief has been asking for. **Any more stem pushes the tip out
through the underside of the beam** — there is no shortfall left to close.

Below an actual riser height of 0.2928 m, every riser in the stair is exactly equal. That
used to depend on the bracket reaching the beam; it no longer does — the beam itself was
raised to meet each landing flush, and that is what fixed it. Above that height — the top of
the schema's 0.145–0.320 m actual range, see the reference table below — the same gap the
bracket used to leave reopens in miniature: a flight's first riser (off its landing) runs up
to 13.6 mm short of the rest, and, for every flight but the last, its own last riser (up onto
the landing above) runs the same amount long. The bracket's length has nothing to do with
riser evenness either way — it is fixed, and must not grow (see below).

**A tread now stretches to 0.48**, past the 0.3339 your `length` key reaches at 1.0 — the
app extrapolates the key, safe only because it translates the two end faces rigidly. If the
nosing profile looks wrong on a very long tread, that is why.

### 2. `landing`

The platform between flights. **0–3 per staircase.** Same origin convention as `step`.

| | |
|---|---|
| Shapekey `width` | 0.80 → 1.20 |
| Shapekey `length` | 0.80 → 1.20 |
| Fixed | thickness — match `step` |
| **Origin** | **centre of the TOP face** |

Note `length` uses the **width** range, not the tread range. Landing depth is normally the
stair width, so most landings are square — but on a narrow stair a long going would shrink a
quarter turn's first landing bar below a workable minimum, so past roughly a 0.30 going on
the narrowest stair the depth grows to `2 × going + 0.2` instead. It tops out at 1.16, just
inside what your `length` key reaches. **The exception: a 180° switchback stretches the landing 2× along its local X**
(the app applies this as `scale`, not the shapekey) so it spans the outgoing and returning
flights. **Do not author X-asymmetric edge detail** — a beveled corner or logo on one side
only — because on a switchback that detail visibly stretches with the rest of the slab.

It can have its own edge profile and support detailing — that is why it is a separate
piece rather than a stretched `step`.

### 3. `stringer`

The sloped board carrying each flight, on its centreline. **One per flight, 1–4 per
staircase.**

| | |
|---|---|
| Shapekeys | **none** |
| Length | model at **exactly 1.0 m** along local +Z |
| Fixed | cross-section — a centre spine, not an edge board; delivered at 0.08 × 0.08 |
| **Origin** | **start (bottom) end, at the TOP EDGE of the cross-section** |

**Why no shapekey:** its length runs 0.60 m to 13.56 m — a ~23× range. It is a prismatic
beam, so the app scales it along +Z, which is mathematically exact and distorts nothing.
Modelling at exactly 1.0 m means the app can use the length directly as the scale factor.

**Why the origin is at the top edge, not centred:** the app hangs the stringer a fixed drop
**straight down** from the nosing line — the line touching the front-top corner of every
tread. So the origin is the top edge of the cross-section, at the near end, and the board
hangs *below* it rather than straddling it.

**That drop is a number we pick, not derive** — the landing's slab thickness plus a small
clearance value the app can add on top (currently zero) — so a flat **0.07 m**, the same at
every rake, not the riser height any more. A flight starts right on the landing's departure
edge, and the beam's top face now comes out exactly level with the underside of the landing
it carries, on every heading — that is the flush look the landing bar depends on. **Do not
deepen this drop.** The clearance value exists for that and it stays at 0; opening it
reopens the very gap under every tread and landing bar that this constant was raised to
close.

The drop is vertical rather than perpendicular to the rake for a specific reason: a
vertical drop keeps the stringer parallel to the nosing line, so it clears every landing it
touches by the same amount, and both ends of a flight sit the same distance under their own
floor. That is what lets the landing bar between them (see below) run dead level — measured
perpendicular, the two ends would land at different depths and a bar spanning them could not
be horizontal.

**It is a plain closed board — not sawtooth-cut.** Notches would need per-step geometry,
which is a different approach entirely (see "Possible later").

There is **one stringer per flight, on the flight centreline** — not a pair at ±x. No
mirrored variant needed.

**Landing bar — the same beam, turned horizontal.** Every landing gets one or two short
segments of this same `stringer` mesh, laid flat, joining the arriving flight's stringer end
to the departing flight's origin. This needs nothing extra from you: the app loads
`stringer` a second time under a different name and scales the clone like any other segment.

**Action: a mitred end would close what the app's own fix can't.** A stringer's end faces
are cut square. Two problems follow from that, and the app now closes one of them itself:

- Where a raked beam meets a level bar, the undersides don't quite line up — a step of
  `0.08 × (1 − cos θ)`, about 9.0 mm at the default rake and up to 56 mm at the steepest.
  This falls inside the joint and reads as a seam, not a gap. Cosmetic only.
- Where the last bar meets the departing flight's square-cut start face, a triangular wedge
  opens below it. The app extends the bar to close that — fully below a 51.8° rake, capped
  at one section (0.08 m) of protrusion above it. Past 51.8° a real sliver stays open: up to
  172 mm at the schema's steepest 72.6° rake. That is a genuine gap, not a seam.

A mitred end closes both completely, and is now the only way to close the second one above
51.8°. Say so if you want it; the app ships fine without it — steep stairs just keep that
sliver.

---

## Part 2 — Railings (next up; design for these now)

Not built yet, but explicitly planned. If you are modelling a coherent set, these should
share a visual language with Part 1.

**Assumed:** rail height becomes a control, **0.90 → 1.10 m, default 1.00**. Confirm
before modelling — it decides whether `height` shapekeys are needed at all.

### 4. `handrail`

The rail itself. Same treatment as the stringer: prismatic, scaled.

| | |
|---|---|
| Shapekeys | **none** |
| Length | model at **exactly 1.0 m** along local +Z |
| Fixed | cross-section profile (~0.05 × 0.05, or a shaped profile) |
| **Origin** | **start end, centred in the cross-section** |

Used for both the sloped runs (one per flight, following the nosing slope) and the flat
runs across each landing. Centred origin here — unlike the stringer, the rail is a free
bar, not something hanging under a line.

### 5. `newel_post`

The vertical post at each rail transition — flight bottom, both ends of each landing,
flight top. Roughly **2 per flight per side** (2–8 per side).

| | |
|---|---|
| Shapekey `height` | 0.90 → 1.10 |
| Fixed | cross-section (~0.08 × 0.08) |
| **Origin** | **bottom centre** |

### 6. `baluster`

The vertical spindle between tread and rail. **One per step: 6–26 per side.**

| | |
|---|---|
| Shapekey `height` | 0.90 → 1.10 |
| Fixed | cross-section (~0.02 × 0.02) |
| **Origin** | **bottom centre** |

Because the rail runs parallel to the nosing line, every baluster on a flight is the same
length — one piece covers all of them.

---

## Part 3 — Possible later (do not model yet)

Listed so you know the direction; none of it is committed.

- **`riser`** — the vertical board closing the gap between treads. The stairs are
  currently open-riser; this would make them closed. Shapekeys `width` 0.80 → 1.20 and
  `height` **0.14 → 0.32**. Origin: centre of the top edge, extending downward.
  *Note that height range is wider than the step-height slider (0.15–0.30).* The real
  riser height is derived — `totalHeight / round(totalHeight / target)` — and measures
  0.145–0.320 across the full control space, overshooting the slider at both ends.
- **Sawtooth / cut stringer** — *would* need new modelling, and cannot be one stretched
  piece: the notches must match the step count and tread size. Likely a per-step modular
  segment. Flag it early if this is the intended aesthetic, because it changes the
  approach.

## Not needed

- **No floor / ground plane.** There are no lights, so no shadows — a floor would just be
  a grey rectangle.
- **No walls, no environment.** An HDR environment map handles lighting and reflections.
- **No lights, cameras, or animations** in the GLB.
- **No LODs, no DRACO compression.** A handful of boxes; compression buys nothing and the
  decoder would be an external dependency we deliberately removed.

---

## Reference — measured ranges

Every number below is measured across the entire control space, not estimated.

| Quantity | Range |
|---|---|
| Total staircase height | 2.00 – 30.00 m (control) |
| Step height — *target* | 0.15 – 0.30 m (control) |
| Step height — **actual** | **0.145 – 0.320 m** (derived) |
| Step length / tread | 0.24 – 0.48 m (control — tread depth only) |
| Step run / going | 0.10 – 0.48 m (control — **the steepness control**; below the tread depth the treads overlap) |
| Step width | 0.80 – 1.20 m (control) |
| Flights | 1 – 2 (control; the solver still supports up to 4) |
| Riser count | 10 – 200 (derived) |
| Step pieces | 4 – ~200 (derived) |
| Landings | 0 – 1 (derived) |
| Stringers | 1 – 2 (derived, one per flight) |
| Stringer length | 0.45 – 100.6 m (derived — scales with the going and the riser count) |
| Stringer drop below the nosing line | 0.07 m, vertical (fixed: landing slab thickness + clearance, no longer riser-dependent) |
| Landing bars | 0 – 2 (derived, 1 per landing on a straight run, 2 through a turn or reversal) |
| Rake angle | 16.8° – 72.6° (derived from the going) |
| Total pieces in scene | 11 – ~205 |

**Why "actual" step height differs from the target:** the total height is exact and every
riser must be equal, so the app picks the whole number of risers closest to the requested
step height and divides. A 3.00 m staircase with a 0.180 m target gives 17 risers at
0.176 m each.

## Checklist before sending the GLB

- [ ] One file, objects named exactly `step`, `landing`, `stringer` (lowercase)
- [ ] Metres; +Y up; +Z = ascent
- [ ] All transforms applied — including on the object nodes themselves
- [ ] Every base mesh at the **minimum** of its ranges
- [ ] Shapekeys named exactly `width` / `length`; each moves verts along one axis only
- [ ] Shapekey at 1.0 gives exactly the **maximum** dimension
- [ ] `stringer` is exactly 1.0 m long, origin at its start end / top edge, no shapekeys
- [ ] `step` and `landing` origins at the centre of the top face
- [ ] `step`'s bracket keeps its delivered reach — 0.1464 m below the tread's underside —
      unchanged; the beam was raised to meet it, and more reach punches through it
- [ ] No extra shapekeys, no lights, no cameras, no animations

Drop it at `src/model/step.glb`; the app switches to placeholder boxes by flipping
`USE_PLACEHOLDER_PIECES` to `true` in `js/settings.js`.
