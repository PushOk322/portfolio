# Poster capture

Every demo has a `poster.webp` at 1600x900. **All six are real screenshots**, captured
from the built demos and reproducible with the two scripts in `tools/`.

Set `"posterIsPlaceholder": false` in a demo's `meta.json` when its poster is real —
that flag drives the amber banner on the index card. All six are `false` today.

## Reshooting

Serve the built site, then run the capture and the conversion:

```bash
npx --yes http-server dist -p 4173 -c-1
```

```bash
node tools/capture-posters.mjs orbital-slice canvas-studio
```

```bash
node tools/posterize.mjs
```

`capture-posters.mjs` launches the installed Chrome with a throwaway profile and drives
it over the DevTools protocol using Node's built-in `WebSocket` — no puppeteer, no
downloaded browser. It is headful on purpose: the three 3D demos want the real GPU, and
`Emulation.setDeviceMetricsOverride` pins the capture to exactly 1600x900 regardless of
the window on screen. PNGs land in `tools/shots/`.

`posterize.mjs` picks the chosen frame per demo (see `PICKS` at the top of the file),
and writes all three files each demo needs: `demos/<slug>/poster.webp`,
`site/public/posters/<slug>.webp`, and the 800px `@800.webp` for the srcset.

An earlier note here said the frames had to be captured by hand because the browser
could not composite. That was true of one particular browser pane; CDP against real
Chrome renders and screenshots normally, WebGL included.

## The frame each demo is set up to capture

| Demo | What the recipe puts on screen |
|---|---|
| **joinery-configurator** | A front door, three-quarter view, dark profile against the light backdrop, control panel visible on the right. The panel is what says "configurator" rather than "3D viewer" — don't crop it out. |
| **stairs-generator** | Two flights with a quarter-turn landing. The camera orbits four steps round on purpose: looking along the L flattens it into a straight run, and the turn is what proves the geometry is solved rather than authored. |
| **boat-configurator** | Hull at three-quarter with the 250–300 hp V8 fitted, interior off the default graphite, "Full view" so the whole boat is in frame. |
| **orbital-slice** | Mid-run, mid-swipe. The laser trail has a 150 ms particle lifespan, so a one-shot swipe is gone before the capture completes — the recipe leaves a rAF loop running that chases whatever planet is on screen, and takes a burst of six. Frame 4 is the one in use. |
| **canvas-studio** | The t-shirt designer with sample artwork placed and a circle added, left selected. The selection handles are the cue that it is a live canvas. |
| **tv-course-browser** | The home screen, arrowed down into a course row so a card carries the focus ring, then nudged back up so the hero carousel dots stay in frame. The focus ring is the entire story of this demo. |

## Still a placeholder: nothing

`site/public/og.png` (1200x630, the link-preview card) is a typographic card rather than
a screenshot, but that is a design choice, not an unfinished one — it represents the
portfolio as a whole. Worth revisiting only if you want a strip of demo posters on it.
