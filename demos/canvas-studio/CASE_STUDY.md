# Canvas Studio

*A product designer and three hand-drawn charts, straight off the 2D API.*

**Tech:** Fabric.js 6 · Konva · Canvas 2D · GSAP · Vite

---

## What it is

Nine small pieces in one build: a t-shirt designer where you place and transform
artwork, a Konva creature builder, a particle field, a starfield, a scroll sequence, a
hover card, and pie, radar and bar charts drawn directly onto a canvas context.

Training work from my time at Avada Media, not a shipped product — it is here because it
is the clearest evidence of 2D canvas at the API level rather than through a library.

## The hard part

Drawing a radar chart is easy; making it interactive is where the canvas model bites.
A canvas has no DOM, so once the pixels are drawn the shapes are gone — no element under
the cursor, no hover state, nothing to attach a handler to. Every affordance the browser
normally hands you has to be rebuilt from a click coordinate.

## How I solved it

The charts keep their own scene description: an array holding each series with its
value, colour, visibility and an animated height, with drawing as a pure function of
that array. A click resolves a coordinate back to a series, flips `visible`, and the
next frame redraws from scratch. The Fabric.js piece is the deliberate contrast — the
library owns the object model and the work is composing its API.

## What I'd do differently

Each chart re-derives its own polar maths and tick spacing, copied across three files
with small drifts. They also generate random data on load, so the page shows different
numbers on every refresh — fine for an exercise, wrong for a demo. And having done it
once, the next one uses D3 and I spend the time on the data.
