# Stairs Generator

*Procedural staircase configurator — five sliders solve the geometry, no pre-authored variants.*

**Tech:** Three.js · vanilla ES modules · zero runtime dependencies · morph targets · WebXR · node:test

---

## What it is

A browser configurator for staircases. Five sliders — total height, target step height,
tread length, stair width, flight count — and the staircase is assembled at runtime from
a small library of pieces: treads, stringers, landings, brackets, joining bars. Change
the height and it re-solves. It does not swap between prepared models, because there is
no finite set of models to swap between.

Internal R&D at Marevo Vision. All 73 commits are mine.

## The hard part

A staircase is a constraint problem pretending to be a shape. You are given a floor
height and a *target* step height, and the real step height falls out of it: round to a
whole number of risers, then redistribute. The flights have to divide those risers
between them, each needs at least two to be walkable, and a quarter-turn landing has to
be deep enough to hold the bars joining its two stringers — which depends on the
horizontal advance per step, a different number from tread depth once treads overlap.

Get any of that wrong and nothing throws. You get a landing leg of negative length, or a
flight of one step, and it looks *almost* right.

Testing it was the second problem. Geometry code grows tendrils into THREE and the DOM
until the only way to check it is to look at it.

## How I solved it

`solveStairs()` is a pure function: state in, a placement list out. It never touches
THREE — it emits positions, yaw values and morph amounts, and a separate scene layer
turns those into objects. The separation is enforced by eslint rather than discipline:
`js/core/**` has `no-restricted-imports` on `three`, with `document` and `window`
switched off, so breaking the layering breaks the build instead of eroding quietly.

That is what makes seven test files possible under `node --test` with no browser and no
mocking — riser distribution, landing depth and stringer slope are asserted directly.

Where geometry has to bend rather than repeat, it is morph targets on the piece library,
so one mesh covers a continuous range. Nothing is fetched from anywhere: the previous
version pulled `lil-gui` from jsdelivr and a Draco decoder from gstatic, and both are
gone. The QR generator for the AR hand-off is a from-scratch same-origin module.

## What I'd do differently

`solveStairs()` returns one flat placement list and callers filter it by piece type. Fine
at four piece types, smelling at seven — it should return a structured result per flight.

I would also make constraint failures explicit. `assertFlightsAreWalkable()` throws,
which is right for a bug and wrong for a user who has just dragged flight count past what
the height allows. That should clamp and explain, not raise.

This was built with AI assistance, and the rules in `CLAUDE.md` — metres everywhere, no
CDN, pure core — are the ones I chose and enforced. I would rather say that than have it
come up later.
