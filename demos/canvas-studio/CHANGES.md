# CHANGES.md — canvas-studio

Everything that differs from `MY_DEMOS/avada-graphic`. The original is untouched.

Slug: `canvas-studio` · Deploy path: `/demos/canvas-studio/` · Source: Avada Media

---

## Sanitisation

| Item | Action |
|---|---|
| `public/starbucks.png` (491 KB) | **Removed.** A registered trademark used as sample artwork. Replaced by `public/artwork.png`, generated at the same 406×581 so the hover-card CSS geometry is unchanged. |
| Chart.js from `cdn.jsdelivr.net` on `vertical-diagram.html` | **Removed.** It was already an npm dependency and the page's own JS already did `import Chart from 'chart.js/auto'` — the CDN tag was dead weight *and* an external request. |
| `<title>Vite App</title>` on all nine pages | Replaced with real per-page titles. |

Verified rather than assumed:

| Check | Result |
|---|---|
| Grep for `api_key`, `secret`, `password`, `access_token`, `bearer`, `private key` | **0 matches** |
| `.env` / `*.pem` / `*.key` | none |
| External hosts in HTML/JS/CSS | **none — zero outbound requests** |
| Remaining `starbucks` references | **0** |

Nothing else needed sanitising: no client name, no backend, no credentials.

## Attribution

`DEMO_NOTICE.md`, the HTML comment on every page, and `package.json` all credit
**Avada Media**. `<meta name="author">` is not set here (the pages had no head
metadata to extend without rewriting all nine); the attribution lives in the notice.

## Structural changes

**The best thing in the demo was unreachable.** `index.html` was the GSAP hover card,
and the Fabric.js t-shirt designer sat on `t-shirt-fabric.html` with no link to it
from anywhere. A recruiter landing on this demo would never have found it.

- `t-shirt-fabric.html` → **`index.html`** (now the landing page)
- old `index.html` → **`hover-card.html`**
- Added `src/nav.js` + `src/nav.css`: one shared nav strip injected on all nine pages,
  ordered so the two interactive builders come before the charts.
- Added an **"Add sample artwork"** button to the designer. Uploading required the
  visitor to have an image to hand; this drops a generated mark on the shirt in one
  click, so the image compositing is visible immediately.

## Path fixes — the demo could not have worked at a subpath

Every asset reference was absolute, so all nine pages would have 404'd under
`/demos/canvas-studio/`:

- `href="/src/…"` and `src="/src/…"` → `./src/…` (all nine pages)
- `src="/public/x.png"` → `./x.png` — **also wrong in dev**: Vite serves `public/`
  at the root, so `/public/…` never resolved.
- `t-shirt-fabric.js`: `fabric.Image.fromURL('/t-shirt.jpg')` → `'./t-shirt.jpg'`
- `canvas.js`: `starImg.src = "/public/star.png"` → `"./star.png"`

## Build — it was shipping one page of nine

There was **no `vite.config.js` at all**. Vite builds only `index.html` unless every
entry is named in `rollupOptions.input`, so `npm run build` silently produced a
one-page site. Added `vite.config.js` which reads the directory for `*.html` so the
list can't drift again, plus `base: './'` for subpath-independent assets.

One further build bug found by checking every emitted reference: `hover-card.html`
loaded `particles.js` with a **classic** `<script>` tag. Vite only rewrites
`type="module"` scripts, so the built page pointed at a source path that doesn't
exist in `dist/` — a 404. Added `type="module"`.

`npm run build` → `dist/` (**1.06 MB**, 36 files, 9 HTML entries).

## Mobile — this was the real work

The audit called this demo STANDALONE and cheap. The mobile requirement is where the
cost actually was: **every experiment is a fixed-size desktop canvas with hardcoded
coordinates**, and there was not a single media query in the project.

| Page | Natural width |
|---|---|
| starfield (`canvas`) | 1200 px |
| creature, pie, radar, bar, scroll | 1000 px |
| t-shirt designer | 600 px |
| hover card | 500 px |

Rewriting eight independent coordinate systems (`{ x: 700, y: 300, width: 450 }` and
similar throughout) was not worth it. Instead `src/fit.js` wraps the page content and
CSS-scales it to fit. Pointer input still lands correctly because Fabric.js and Konva
both map pointers through `getBoundingClientRect()`, which reports post-transform
geometry — that is the reason this is a transform and not a canvas resize.

Result at 380 px: no horizontal scroll on any page, everything still interactive.

| Page | Scale at 380 px |
|---|---|
| particles | 1.0 (already sizes to the window) |
| hover card | 0.74 |
| t-shirt designer | 0.62 |
| creature, pie, radar, bar, scroll | 0.37 |
| starfield | 0.31 |

**Honest limitation:** at 0.31–0.37 the charts are legible but small, and the labels
drawn inside the canvas are near the limit. It is usable rather than good. The
alternative — a "best on desktop" card — would have hidden six of the nine pages, so
I went with usable. Say the word if you'd rather show the card for the chart pages.

### Three layout bugs found while doing it

1. **Scale never applied.** The first version measured available width from the
   wrapper's parent — but the parent had already been stretched by the very overflow
   being corrected, so the ratio was always ≥ 1. Fixed by measuring against
   `document.documentElement.clientWidth`, the one width that doesn't move with content.

2. **191 px of overflow on every page, from the nav.** Several pages set
   `display: flex` on `<body>` for their own centring, which made the sticky nav a
   flex item: it sized to max-content (745 px) and refused to shrink, because flex
   items default to `min-width: auto`. Fixed by making the nav `position: fixed`
   (out of flow entirely, so no page's body layout can reach it) with
   `body { padding-top: 44px }` to reserve the space.

3. **202 px of sideways scroll on `hover-card`, desktop only.** `.floating` is
   absolutely positioned with no `left`, so it fell at its static position inside a
   flex row — about 1421 px in. With no positioned ancestor its containing block was
   the *initial containing block*, which escapes `overflow-x: hidden` on both `html`
   and `body`; that's why the obvious fix didn't work. It didn't reproduce on mobile
   because the scale transform happens to establish a containing block. Fixed twice
   over: `.fit-page` is now `position: relative` so the two viewports behave alike,
   and `.floating` got an explicit `left: 60px` so the decorative image sits on-screen
   where it was presumably meant to.

Also added `html, body { overflow-x: hidden }` — a body-only rule still scrolled
(measured `scrollX: 202`), because with `html` left `visible` the viewport takes its
overflow from `html`.

## Portfolio scaffolding added

- `DEMO_NOTICE.md`, HTML comment notice on all nine pages.
- `portfolio/badge.css` + `portfolio/badge.js`, copied from `demos/_shared/portfolio/`.
- `.nvmrc` → `24`.
- `package.json`: name `canvas-studio`, description and author added.

### One shared-badge fix this demo forced

The badge read its config from `data-*` on its own `<script>` tag. That works
unbundled, but `document.currentScript` is **always null in a module**, and the
`script[src$="badge.js"]` fallback breaks the moment Vite emits the file as
`assets/badge-<hash>.js` — so the back-link silently vanished from the built page.
Config moved to `<body data-pf-badge-text data-pf-badge-back>`, which survives
bundling. **`stairs-generator` was updated to match and re-verified** (130 tests pass,
eslint clean, badge renders with its back-link).

## Verification run

| Check | Result |
|---|---|
| `npm run build` | 9 HTML entries, dist 1.06 MB |
| All 9 pages served at `/demos/canvas-studio/` | 200 |
| Every `src`/`href` on every page | **0 broken** (this is how the `particles.js` 404 was caught) |
| Console errors | none |
| Secret/trademark grep | clean |
| External network requests | none |
| Desktop 1440 px | no page scaled, no sideways scroll |
| Mobile 380 px | no sideways scroll on any of the 9 pages |
| Fabric canvas + sample artwork | `t-shirt.jpg` 612×320 and `sample-print.png` 300×300 both load; shapes and sample insert work |
| Badge back-link | resolves to the site root |

### Not verified

Visual quality of the rendered canvases and the animation behaviour — the Browser
pane doesn't composite for me, so everything above is structural and network-level.
The scale factors are measured, but whether 0.31 *looks* acceptable on a real phone
is a judgement call you should make.
