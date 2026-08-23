# Poster capture — needs you

Every demo has a `poster.webp` at 1600×900, and **all six are placeholders**. They are
typographic cards, not screenshots, and each carries a "PLACEHOLDER — REPLACE WITH
SCREENSHOT" chip so one can never ship by accident.

## Why I couldn't capture them

The browser pane available to me does not composite — measured at 0 `requestAnimationFrame`
callbacks per second with `document.hidden === true`. Every one of these demos draws
through rAF (WebGL, Phaser, canvas 2D), so there is no frame to capture. Layout,
network and DOM state I can read; pixels I cannot.

## How to capture

Serve the built demos and grab a frame at exactly 1600×900:

```bash
npx --yes http-server E:/Work/Personal/PORTFOLIO/demos -p 8123 -c-1
```

In Chrome: DevTools → ⋮ → **More tools → Rendering**, then Ctrl+Shift+M (device
toolbar), set a custom size of **1600 × 900**, and use the DevTools command menu
(Ctrl+Shift+P) → **Capture screenshot**. That gives you an exact-size PNG with no
browser chrome.

Then convert and drop it in place:

```bash
npx --yes sharp-cli -i shot.png -o E:/Work/Personal/PORTFOLIO/demos/<slug>/poster.webp resize 1600 900 --fit cover
```

Finally set `"posterIsPlaceholder": false` in that demo's `meta.json` — the index site
reads that flag, so leaving it true is a visible reminder rather than a silent lie.

## The frame to capture, per demo

| Demo | What to put on screen |
|---|---|
| **joinery-configurator** | A front door, three-quarter view, dark profile against the light backdrop, control panel visible on the right. The panel is what says "configurator" rather than "3D viewer" — don't crop it out. |
| **stairs-generator** | Two flights with a quarter-turn landing — set flight count to 2 and pick a direction change. A straight single flight looks like a stock model; the switchback is the thing that proves it's solved rather than authored. |
| **boat-configurator** | Hull at three-quarter, a large outboard fitted, an interior colour that isn't the default graphite. Use "Full view" so the whole boat is in frame. |
| **orbital-slice** | Mid-run, mid-swipe: the blade trail visible across two or three planets with a slice in progress. Not the menu, not game-over. This is the hardest one to time — take a burst and pick. |
| **canvas-studio** | The t-shirt designer with the sample artwork placed and a shape or two added, selection handles showing. The handles are the visual cue that it's interactive. |
| **tv-course-browser** | The home screen with the hero carousel and a course row, **with a card focused** so the focus ring is visible. The focus ring is the entire story of this demo. |

## Also needed: the Open Graph share image

Phase 5 wants one, 1200×630, for the index page. It should be the portfolio as a whole,
not one demo — your name, the one-line description, and probably a strip of two or three
demo posters. I'll generate a placeholder for it with the site build; same rule applies.
