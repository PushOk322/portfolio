# Stairs Generator

*Five sliders solve the geometry — the staircase is assembled at runtime.*

**Tech:** Three.js · vanilla ES modules · zero dependencies · morph targets · WebXR · node:test

---

## What it is

A staircase configurator with five sliders: total height, step height, tread length,
width, flight count. It does not pick from prepared models — it solves the geometry and
assembles the stair from a piece library every time you move a slider.

Internal R&D. All 73 commits are mine.

## The hard part

A staircase is a constraint problem wearing the costume of a shape. Round the riser
count, redistribute across flights, keep every flight walkable, and make a quarter-turn
landing deep enough for the bars joining its stringers. Get any of it wrong and nothing
throws — you just get a landing leg of negative length that looks *almost* right.

## How I solved it

`solveStairs()` is a pure function: state in, placements out, no THREE and no DOM. The
separation is enforced by eslint rather than discipline, so breaking it breaks the build.
That is what makes seven test files possible with no browser and no mocking — riser
distribution and stringer slope are asserted directly.

## What I'd do differently

The solver returns one flat list that callers filter by piece type; at seven piece types
that should be structured per flight. And `assertFlightsAreWalkable()` throws, which is
right for a bug and wrong for a user who dragged a slider too far — it should clamp and
explain.

Built with AI assistance. The rules in `CLAUDE.md` — metres everywhere, no CDN, pure
core — are the ones I chose and enforced, and I would rather say so than have it come up
later.
