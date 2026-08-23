# CHANGES.md — stairs-generator

Everything that differs from `MY_DEMOS/stairs-generator`. The original is untouched.

Slug: `stairs-generator` · Deploy path: `/demos/stairs-generator/`

---

## Sanitisation

**Nothing had to be sanitised.** This is the one demo in the set with no client, no
brand, no backend and no credentials — it was internal R&D at Marevo Vision.

Verified rather than assumed:

| Check | Result |
|---|---|
| `.env` / `*.pem` / `*.key` files | none |
| Grep for `api_key`, `secret`, `password`, `access_token`, `bearer`, `private key` (excluding `js/libs/`) | **0 matches** |
| Token-shaped strings ≥32 chars | 4 hits, all long identifiers (`CONFIGURATION_COMPRESSION_FORMAT`, `EquirectangularReflectionMapping`) |
| Outbound hosts in own code | none — zero `fetch` calls in the whole project |
| Client names / third-party trademarks | none |

One correction to the audit: I flagged `my-cnd-server.com` as a placeholder host to
replace. It is a **comment inside three.js's own `GLTFLoader.js`** illustrating the
`resourcePath` option — not a dependency, and not ours to edit. No change made.

## Attribution (per your Gate 2 answer)

- `DEMO_NOTICE.md` states the work was built at **Marevo Vision** and that this is a
  showcase build.
- `index.html` carries an HTML comment with the standard notice plus the studio credit.
- `<meta name="author" content="Pavlo Tyshkovets">` added.
- `package.json` gained `author` and a `description` naming Marevo Vision.

Nothing was renamed: "Stairs Generator" was never a client-facing brand.

## Assets

**`src/model/step.glb`: 7.13 MB → 1.26 MB (5.6× smaller).**

The interesting part is *why* — Draco would have been useless here:

| | before | after |
|---|---|---|
| geometry (accessors) | **0.01 MB** | unchanged |
| textures (4 images) | **7.11 MB** | 1.25 MB |

99.8% of the file was texture data, and two of the four were 2048² **PNG** roughness
maps costing 3.10 MB and 2.57 MB. Re-encoding all four to WebP (`EXT_texture_webp`,
quality 90, **resolution unchanged at 2048²**) does the whole job.

Verified no visual or structural regression by loading the original and the compressed
file side by side in three.js and diffing the parsed result:

```
identical: true
Cube001 :: wood_planar :: 24 verts :: 36 indices :: morphs width|length :: normal,position,uv
Cube001_1 :: metal     :: 48 verts :: 72 indices :: morphs width|length :: normal,position,uv
```

Mesh names, material names, vertex/index counts, morph-target dictionaries
(`width`, `length`, `length_fastening`) and vertex attributes all match exactly.
That matters because `piece-library.js` and `morph-system.js` address meshes and
morphs by name.

Both loaders in the project support the extension: `GLTFLoader.js` and the vendored
`model-viewer.min.js` each handle `EXT_texture_webp`.

**A further 10× is available** — dropping to 1024² gives 0.13 MB (53.9× total). Not
taken: it halves texture resolution for a saving that no longer matters once the demo
is already 3.6 MB. Say the word if you want the smaller number to cite.

`src/environment/unfinished_office_500.hdr` (361 KB) left as is.

## Portfolio scaffolding added

- `DEMO_NOTICE.md` — the standard notice plus what's specific here.
- `portfolio/badge.css` + `portfolio/badge.js` — dismissible corner badge, copied
  from `demos/_shared/portfolio/` (master copy lives there; each demo keeps its own
  copy so it stays independently deployable).
- `build.mjs` + `npm run build` → `dist/`.
- `.nvmrc` → `24`.
- HTML comment notice at the top of `index.html`.
- `data-pf-badge-anchor` on `.viewport` in `index.html`.

**The badge says "Portfolio build", not "Portfolio build — mock data".** There is no
mock data in this demo and never was; claiming otherwise is a small lie a reviewer
could check in thirty seconds. `badge.js` takes the text from `data-text`, so demos
that *do* carry fixtures will say so.

## Build

`npm run build` → `dist/` (**3.64 MB**). No bundler.

**Deviation from the brief, flagged deliberately:** the brief says migrate every demo
to Vite unless there's a strong reason not to. There is one here. The app resolves
`three` through a native `importmap`, has zero runtime dependencies, and its stated
architectural constraint is that every request is same-origin with no CDN. Adding a
bundler to the one project whose point is not having one would delete the thing worth
showing. `build.mjs` still gives the uniform contract — one command, a `dist/` that
drops in at a subpath — in 30 lines and no dependencies. Overrule me and I'll migrate it.

Every path in `index.html` was already relative (`./css/…`, `./js/…`), so **no base-path
rewrite was needed** — `dist/` works at any subpath as-is.

## Config changes

- `package.json` — added `build`; `serve` now serves `dist/`, with `serve:src` kept
  for the un-built tree.
- `eslint.config.js` — added `dist/**` to ignores (build output was being linted, which
  is where 940 of 953 errors came from, all inside re-copied vendored bundles), plus
  config blocks giving `portfolio/**` browser globals and `build.mjs` Node globals.
  The author's `js/core` purity rules are untouched.
- `.gitignore` — added `dist/`.

## Left out of the copy

Excluded as internal workflow, not project code:

- `.superpowers/` — task briefs, progress reports and review diffs from the build process
- `.claude/` — agent config and `launch.json`
- `docs/superpowers/specs/` — 8 internal design specs
- `package-lock.json` — regenerated on install

**`CLAUDE.md` was kept**, and that's a decision you should confirm. It's the clearest
architecture document in the project — the layering rules, the metres-not-millimetres
invariant, the no-CDN constraint — but it is addressed to an AI agent and makes the
AI-assisted development explicit to anyone browsing the repo. Three options: keep it
as is, rename its content into `docs/architecture.md`, or drop it. My recommendation
is **keep it** — the content is good and the honesty costs less than the discovery would.

## Verification run

| Check | Result |
|---|---|
| `node --test` | **130 pass, 0 fail** |
| `npx eslint .` | **clean, exit 0** |
| `npm run build` | dist/ 3.64 MB |
| Subpath deploy at `/demos/stairs-generator/` | all 36 module + asset requests 200 |
| Console errors | none (one pre-existing warning: model-viewer bundles its own three) |
| Compressed GLB loads in three.js | 5 meshes, morph dictionaries intact |
| GLB structural diff vs original | identical |
| Layout at 380 × 760 | no horizontal overflow; canvas 380×707; sidebar collapses to a 53 px bar with a Controls toggle; action buttons 44 px tall |
| Layout at 1440 × 900 | canvas 1100 px, sidebar 340 px, drawer toggle correctly hidden |
| Badge overlap (mobile) | **found and fixed** — see below |
| Badge blocks interaction | no; wrapper `pointer-events: none`, only the × and link are `auto` |
| Back-link `../../` resolves | to the site root |

### The one bug found and fixed

At 380 px the badge was fixed to the window's bottom-left and landed **on top of the
"Stairs Generator" title** in the collapsed bottom sidebar (badge y 712–748, title y
724–745), with its `pointer-events: auto` link directly over the heading. The Controls
toggle stayed clickable, so it was cosmetic rather than blocking — but it looked broken.

Fixed generically rather than with a magic offset: `badge.js` now mounts into
`[data-pf-badge-anchor]` when the page declares one and switches to `position: absolute`.
Anchored to `.viewport`, the badge now sits at y 659–695 — inside the canvas area, clear
of all app chrome at both 380 px and 1440 px. Every later demo gets the same behaviour
by adding one attribute.

### Not verified

**The rendered image.** The in-app Browser pane is not displayed, so the page never
composites and `requestAnimationFrame` never fires (measured: 0 frames in 1 s,
`document.hidden === true`). `waitForInitialSceneFrame()` therefore never resolves and
the loader stays up — an artefact of the harness, not of the demo.

Still open, and needing the pane visible: the actual 3D render, slider-driven geometry
updates, and the 1600×900 poster capture for Phase 4.
