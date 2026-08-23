# Canvas Studio

*2D canvas from the API up — a product designer, and three charts drawn by hand.*

**Tech:** Fabric.js 6 · Konva · Canvas 2D · GSAP · Vite

---

## What it is

Nine small pieces sharing one build: a t-shirt designer where you drop artwork onto a
garment and move, scale and rotate it; a Konva creature builder; a particle field; an
animated starfield; a scroll-driven image sequence; a GSAP hover card; and pie, radar and
bar charts drawn straight onto a canvas context.

Honest framing, because it changes how you read the rest: this is **training work** from
my time at Avada Media, not a shipped product. It is here because it is the clearest
evidence I have of working with 2D canvas at the API level rather than through a library
that hides it.

## The hard part

Drawing a radar chart is straightforward. Making it *interactive* is where the canvas
model bites. A canvas has no DOM, so there is nothing to attach a handler to — once the
pixels are drawn the shapes are gone. No `<path>` to hit-test, no element under the
cursor, no hover state for free. Every affordance the browser normally hands you has to
be rebuilt from a click coordinate and whatever you can reconstruct about what you drew
there.

The t-shirt designer is the same problem from the other end: selection handles, rotation,
scaling, z-order and hit-testing on transformed objects is an enormous amount of work
from scratch — which is exactly why Fabric.js exists.

## How I solved it

The charts keep their own scene description. A `chartData` array holds each series with
its value, colour, visibility and an animated `currentHeight`, and drawing is a pure
function of that array. A click resolves a coordinate back to a series, flips `visible`,
and the next `requestAnimationFrame` redraws from scratch. Animation runs through the
same door: `currentHeight` eases toward its target per frame, rather than any geometry
being tweened.

Polar layout is done directly — each axis at `angle = i * 2π / n`, points at
`centerX + radius * cos(angle)`, labels pushed 20 px past the outer ring.

The Fabric.js piece is the deliberate contrast: the library owns the object model, and
the work is composing its API — the garment loaded as a non-selectable base layer,
shapes and uploads added as transformable objects above it, the composite exported
through `canvas.toBlob()`.

## What I'd do differently

Each chart re-derives its own helpers — the random generator, the polar conversion, the
tick spacing — copied across three files with small drifts. That should be one module.

The charts also generate random data on load. Fine as an exercise, wrong for a demo: the
page shows different numbers on every refresh, so nothing about it is comparable or
memorable.

And I would not hand-draw charts again for production. Having done it once, I know what a
charting library is doing for me and where it will fight me — which is the actual value of
this piece. The next one uses D3 and I spend the time on the data.
