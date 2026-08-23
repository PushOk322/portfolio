# Adding projects

Two ways in, depending on whether a visitor can open the thing.

| | **Demo** | **Mention** |
|---|---|---|
| What it is | A live build they can click | A line of text and a commit share |
| Where | `demos/<slug>/` | one entry in `mentions/mentions.json` |
| Effort | hours | two minutes |
| Use when | it runs standalone, or can be made to | it needs a login, a client's domain, or a backend you cannot take with you |

**When in doubt, add a mention.** A short honest line costs nothing and can be
upgraded later. A half-working demo costs a visitor's trust, and they will not come
back to check whether you fixed it.

---

## Adding a mention — two minutes

Open `mentions/mentions.json` and add an object. Order in the file is order on the
page; strongest first.

```json
{
  "title": "Crypto Exchange Widget",
  "kind": "Commercial · Avada Media",
  "blurb": "Embeddable swap widget with live rate polling and a three-step confirm flow. Handled the whole front end.",
  "tech": ["React", "TypeScript", "WebSocket"],
  "commits": "212 of 240"
}
```

| Field | Notes |
|---|---|
| `title` | Neutral. No client brand unless you have permission — "Crypto Exchange Widget", not the company's product name. |
| `kind` | `Commercial · <studio>`, `Test task`, `Personal`. Says who paid for it. |
| `blurb` | **Two sentences.** What it did, then the part you are proud of. Anything longer stops being scannable and starts competing with the demos. |
| `tech` | 3–5. The ones that matter, not the whole lockfile. |
| `commits` | `"N of M"`. Get it from the repo: `git log --format='%an' \| grep -cxE "Pavlo Tyshkovets\|Paul Tyshkovets"` against `git rev-list --count HEAD`. |

Then `npm run build`. Nothing else — the section renders itself and the count in the
dimension line updates.

### On the commit share

Every mention carries one, including the unflattering ones. That is the point: a claim
you cannot open is worth more when it comes with a number a reader could check if they
had access. "34 of 34" and "44 of 100" both help you. Rounding up does not.

If a project genuinely is not yours in any meaningful share, leave it off. `webgraphics`
is the example — the folder names look like a portfolio and 13 of 924 commits are yours.

---

## Adding a demo

A demo is a self-contained project folder. It needs six things.

### 1. The folder

```
demos/<slug>/
  package.json     with a "build" script that produces dist/
  index.html       the entry point
  meta.json        card copy
  CASE_STUDY.md    the write-up
  poster.webp      1600×900
  icon.svg         the geometry mark
  DEMO_NOTICE.md   what was modified
  CHANGES.md       exactly what differs from the original
  .nvmrc           24
  portfolio/       copied from demos/_shared/portfolio/
```

Slug is lowercase-hyphenated and becomes the URL: `/demos/<slug>/` and `/<slug>.html`.

### 2. Make it standalone

The rules that matter, learned the hard way on the six that are already here:

- **Every asset path relative.** `./models/x.glb`, never `/models/x.glb`. Bundler
  `base` settings do not reach paths built in JavaScript — the boat configurator had
  four that only broke once deployed at a subpath.
- **No third-party requests.** Fonts, decoders and icons get vendored. The Draco
  decoder in particular defaults to a Google CDN, and the models will not render
  without it.
- **Mock at the seam, not the call sites.** Swap the HTTP client's adapter, or replace
  one API module — do not edit thirty components. Keep the production response shape.
- **Disable outbound CTAs, do not delete them.** `data-demo-disabled`,
  `cursor: not-allowed`, and a line saying what it used to do.
- **Check what the old shell did on mount.** Both extracted demos broke here: the game
  needed `startUI()` as well as `startGame()`, and four more calls after that. Read the
  component you are replacing, line by line.

### 3. `meta.json`

```json
{
  "slug": "crypto-swap",
  "title": "Crypto Swap Widget",
  "tagline": "One sentence. What it does, or the hard part — not both.",
  "tags": ["React", "TypeScript", "WebSocket", "Recharts"],
  "accent": "#22b8a6",
  "poster": "poster.webp",
  "posterIsPlaceholder": true
}
```

`posterIsPlaceholder` drives the amber banner on the card. Leave it `true` until you
have a real screenshot — that is what stops a placeholder shipping unnoticed.

### 4. `icon.svg`

A 64-unit square viewBox, `stroke="currentColor"`, `stroke-width="2.5"`, no fill, no
background. It appears beside the demo title, between every section of the case study,
and in the row under the About heading, so it must read at 26px and inherit colour.

Draw the object, not a symbol for the category: a window with a mullion, a switchback
stair, a hull. `demos/*/icon.svg` are the reference; the generator that made them is
disposable, editing the SVG by hand is fine.

### 5. `CASE_STUDY.md`

Four sections, fixed headings, **two to three sentences each**. 200–260 words total.

```markdown
# Title

*Tagline.*

**Tech:** A · B · C

---

## What it is
## The hard part
## How I solved it
## What I'd do differently
```

The last two carry the weight. "The hard part" should name something specific enough
that a reader could disagree with you — a mechanism, a constraint, a number. "What I'd
do differently" should name a real flaw you can point at in the code; a fake-humble
one reads worse than none.

Where you do not know something, write `TODO(pasha): <the question>`. It renders as a
visible margin note rather than silently becoming a claim.

### 6. Wire it up

Add the slug to `ORDER` in `site/scripts/build-pages.mjs`, and its measured figures to
`MEASURED` in the same file — payload, requests, third-party count, commit share. Get
them from a real load with DevTools open, not from an estimate. Then:

```bash
npm run build
npm run preview
```

CI needs no change: the workflow discovers demos from the folder, so the new one gets
its own build job automatically. A demo on disk but missing from `ORDER` is skipped
with a warning — which is also the one-line way to pull a demo off the site without
deleting it.

---

## Promoting a mention to a demo

Copy the original out of `MY_DEMOS` with `tar --exclude=.git`, then work through the
standalone rules above. Delete the mention from `mentions.json` in the same commit, or
the same project appears twice.

Read a couple of the existing `CHANGES.md` files first. They are written as a record of
what was changed and why, and the reasoning transfers — particularly the joinery one,
which documents a compression attempt that the project's own tests rejected.
