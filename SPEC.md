# SPEC.md — build and deployment

Everything an operator needs to build this portfolio and put it on the internet.
Things only you can do — buying a domain, creating accounts, entering passwords —
are in `ACTIONS_FOR_PASHA.md`, not here.

---

## 1. Repo layout

```
PORTFOLIO/
  build.mjs              whole-portfolio build → dist/
  package.json           npm run build
  .nvmrc                 24
  .gitattributes         line-ending and binary rules (see §2)
  .gitignore             node_modules, build output, generated pages, secrets
  .github/workflows/     deploy.yml — build and deploy on push to main
  SPEC.md                this file
  ACTIONS_FOR_PASHA.md   the numbered list of things only you can do
  POSTERS.md             how to replace the six placeholder screenshots

  site/                  the index site (Vite, no runtime JS)
    scripts/build-pages.mjs    generates the 7 HTML pages from demos/*/meta.json + CASE_STUDY.md
    src/styles.css             the whole design system, inlined at build time
    public/                    fonts, posters, og.png, favicons, (your cv.pdf)

  demos/
    _shared/portfolio/   master copy of the "Portfolio build" badge
    <slug>/              one folder per demo — a self-contained project
      CASE_STUDY.md      rendered into the demo's page on the site
      CHANGES.md         exactly what differs from the original
      DEMO_NOTICE.md     the modified-build notice
      meta.json          title, tagline, tags, poster
      poster.webp        1600×900 card image
      package.json       npm run build → dist/
```

Each demo is independent: its own `package.json`, its own dependencies, its own
`npm run build` that produces a `dist/` deployable at a subpath. Nothing in a demo
imports anything from the site, and the site reads from the demos rather than
duplicating their content.

## 2. Version control — one repo, no inherited history

This folder is a **single git repository**, already initialised and committed
locally. The six demos are ordinary directories inside it, not submodules and not
subtrees.

```
commit 6b45bef  main   923 files   .git = 51 MB
remote origin   github-personal:PushOk322/portfolio.git   (never pushed)
```

### Nothing from the originals came with them

Every demo was copied with `tar --exclude=.git`, so **no demo carries a `.git`
directory, a remote, a branch or a single commit from its source project.** A
full-depth scan confirms it. That matters for three reasons:

- Nothing here can accidentally push to a client's Bitbucket or GitHub.
- No client's commit history, author list or internal branch names travel into a
  public repository.
- The two originals that have a `.env` committed to their remote
  (`react_alba`, `Quity-Strapi`) cannot leak through this repo, because none of
  their history exists here.

The originals in `MY_DEMOS` are untouched — same HEADs, no commits, no staged
changes, nothing deleted.

### Why one repo rather than six

To keep the versions of six related projects in one history, and to make a commit
able to move a demo and the site that embeds it at the same time. Six repositories
would let the site describe a version of a demo that no longer exists.

**One repo does not mean one pipeline.** The two are independent decisions, and the
CI here builds each demo in its own job — see §5. Anything you could do with six
repositories' worth of pipelines, you can do with six jobs in one.

The cost of a monorepo is a larger clone, which matters only to CI, and CI caches it.

Submodules were the obvious alternative and are the wrong tool here: they would keep
each demo pinned to a *separate* repository, which is exactly the connection to
commercial remotes this is meant to sever.

### Identity

The commit is authored as `tishkovets.pavlo@gmail.com`, set **locally in this repo**.
Your global git identity is `pt@marevo.vision`, and without the override every commit
in your personal portfolio would carry your employer's domain — and would not match
your personal GitHub account, so the contributions would not show on your profile.

```bash
git config user.email        # tishkovets.pavlo@gmail.com — repo-local
git config --global user.email   # pt@marevo.vision — unchanged
```

### Binary assets are in git, deliberately

79 MB of working tree, of which most is geometry, audio and textures. The largest
single file is `door_demo.glb` at 14.3 MB — comfortably under GitHub's 100 MB
per-file hard limit, and the repo is far under the 1 GB soft limit.

**Git LFS was considered and rejected.** LFS on the free tier caps at 1 GB of storage
*and* 1 GB of bandwidth per month, and CI clones this repo on every deploy — so LFS
would introduce a quota that plain git does not have. Binaries in git are only
expensive when they change often, and these models change roughly never.

**The tripwire:** if you start iterating on the 3D models and the repo passes ~500 MB,
revisit. At that point the answer is probably to host models on the CDN and fetch them
by URL, not to add LFS.

### `.gitattributes`

`* text=auto eol=lf` normalises line endings on commit. This is not tidiness: during
development a CRLF markdown file silently broke the case-study renderer, because
splitting on `/\n{2,}/` never matches `\r\n\r\n`. Two case studies rendered as one
unstyled paragraph and nothing errored. One rule prevents the whole class of it.

Binary extensions are marked `binary` so git never tries to diff or merge them.
`demos/*/js/libs/**` is marked `linguist-vendored` so GitHub's language bar reports
what you wrote rather than what three.js ships.

### `.gitignore`

Excludes `node_modules/`, all build output (`dist/`, `dist-embed/`), the site's seven
generated HTML pages, and — belt and braces — `.env`, `*.pem`, `*.key`. No demo has a
secret to protect; the rule is there so that if one ever appears it does not get
committed by reflex.

### First push

The remote is set. The repository does not exist on GitHub yet — creating it needs
your account, so it is item 3 in `ACTIONS_FOR_PASHA.md`. Once it exists:

```bash
cd E:/Work/Personal/PORTFOLIO
git push -u origin main
```

`github-personal` resolves through your `~/.ssh/config` to `github.com` using
`id_ed25519`, which keeps this off the `github-work` key entirely.

### Day-to-day

```bash
git add -A && git commit -m "..."     # then push; CI builds and deploys on main
npm run build:fast                    # rebuild locally without reinstalling
```

Branch if you want, but `main` is what deploys — the workflow triggers on push to
`main` only.

---
## 3. Build

```bash
cd E:/Work/Personal/PORTFOLIO
npm run build
```

That runs `build.mjs`, which:

1. installs dependencies for any demo missing `node_modules` (skip with `npm run build:fast`),
2. runs `npm run build` in each of the six demos, in series,
3. builds the site,
4. assembles `dist/` — site at the root, each demo at `dist/demos/<slug>/`.

Output: **≈72 MB across ≈577 files.** Serve `dist/` at the domain root.

```bash
npm run preview     # http://127.0.0.1:8080
```

### `build.mjs` is a coordinator, not a monolith

It does not know how any demo builds. It runs `npm run build` in the folder and
copies whatever `dist/` comes out — which is why one demo can be webpack, one
esbuild, one a plain file copy, and adding a seventh needs no change to it.

That also means the pieces can be driven independently, which is exactly what CI does:

| Command | Does |
|---|---|
| `node build.mjs` | everything, in series — the local default |
| `node build.mjs --only=<slug>` | one demo, into `demos/<slug>/dist` |
| `node build.mjs --site-only` | site + assemble, expecting the demos already built |
| `node build.mjs --list` | the demo slugs, one per line |
| `--no-install` | skip `npm install` when dependencies are already present |

CI calls `--only=<slug>` once per demo in parallel, then `--site-only` to assemble.
Locally, no arguments does the same work in series. **Same entry point either way**,
so a green CI run and a green local build mean the same thing.

`--site-only` fails loudly if any demo's `dist/` is missing rather than assembling a
site with a hole in it:

```
✖ no dist/ for: canvas-studio
  Build them first, or drop --site-only.
```

**Node 24.** Pinned in `.nvmrc` at the root and in every demo. No demo needs a
different version.

### Per-demo build notes

| Demo | Builder | Note |
|---|---|---|
| joinery-configurator | esbuild (custom script) | `npm run build` makes the site; `npm run build:embed` makes the three single-product client bundles into `dist-embed/` and is not part of the deploy |
| stairs-generator | none — file copy | Zero dependencies. Its "build" copies the deployable surface. |
| boat-configurator | Vite | |
| orbital-slice | Vite | Slowest build (~35 s) — image pipeline |
| canvas-studio | Vite | 9 HTML entry points |
| tv-course-browser | webpack 5 | ~25 s, emits 40 pre-existing SCSS deprecation warnings |

Two demos deliberately do not use Vite (`joinery-configurator`, `stairs-generator`).
Both resolve `three` through a native importmap with no bundling, and both make a
point of having no CDN dependency. Reasoning is in each demo's `CHANGES.md`.

## 4. Hosting — Cloudflare Pages (recommended)

Sizes to check against the limits:

| | This site | Cloudflare Pages | GitHub Pages |
|---|---|---|---|
| Total | 72 MB | 25 GB | 1 GB soft |
| Files | 576 | 20,000 | — |
| Largest file | 14.3 MB (`door_demo.glb`) | 25 MB | **100 MB hard** |
| Bandwidth | — | unlimited | 100 GB/month soft |

Comfortable on both. Cloudflare wins on bandwidth, which is the one that matters
when every visitor pulls several megabytes of geometry.

### Project settings

| Setting | Value |
|---|---|
| Framework preset | **None** |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | *(leave empty)* |
| Node version | set env var `NODE_VERSION` = `24` |

Cloudflare Pages gzips and Brotli-compresses text responses automatically, which
closes the one Lighthouse item that fails locally (`uses-text-compression`).

### Headers

Add `site/public/_headers` — Cloudflare copies it into the output:

```
/fonts/*
  Cache-Control: public, max-age=31536000, immutable

/posters/*
  Cache-Control: public, max-age=604800

/demos/*/src/models/*
  Cache-Control: public, max-age=2592000

/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
```

Do **not** add a restrictive `Content-Security-Policy` without testing: three demos
create blob URLs for AR export and texture decoding, and a `default-src 'self'`
policy without `blob:` breaks them silently.

## 5. GitHub Actions — six pipelines and a coordinator

`.github/workflows/deploy.yml`. Requires two repository secrets (see
`ACTIONS_FOR_PASHA.md` items 4–5).

**The repo is shared; the pipelines are not.** Each demo builds in its own job, with
its own dependency cache, its own log, and its own pass/fail. A broken webpack config
in the TV app does not stop the other five from building, and it shows up as one red
leg rather than a stack trace buried in a combined log.

```
discover ──┬─► demo (joinery-configurator) ──┐
           ├─► demo (stairs-generator)     ──┤
           ├─► demo (boat-configurator)    ──┤
           ├─► demo (orbital-slice)        ──┼─► assemble ─► verify ─► deploy
           ├─► demo (canvas-studio)        ──┤
           └─► demo (tv-course-browser)    ──┘
```

### `discover`

Runs `node build.mjs --list` and feeds the result into the matrix. **The demo list
lives in `demos/`, not in the workflow** — adding a seventh demo needs no CI edit.

### `demo` — one job per demo, in parallel

- **`fail-fast: false`.** If two demos are broken, one run should tell you about both
  rather than making you fix and re-push to discover the second.
- **Dependency cache keyed per demo.** A dependency change in the boat configurator
  must not invalidate the game's cache.
- **Build cache keyed on that demo's own files** — `hashFiles('demos/<slug>/**')`. If
  nothing in the folder changed, the job restores the previous `dist/` and skips the
  build entirely. Most pushes touch one demo, so the other five finish in seconds.
- Each job asserts its own `dist/index.html` exists before uploading, so a demo that
  builds "successfully" into nothing fails at its own leg rather than at the deploy.

Every leg runs `node build.mjs --only=<slug>` — the same entry point you use locally.

### `assemble` — the coordinator

Downloads the six artefacts, puts each back at `demos/<slug>/dist` (exactly where a
local build leaves it), builds the site around them, and assembles `dist/`.

Then it verifies before deploying:

```bash
test -f dist/index.html
for slug in $(node build.mjs --list); do
  test -f "dist/demos/$slug/index.html" || exit 1
done
```

That is not ceremony. A demo build can succeed and still emit an empty `dist/` if a
path assumption breaks, and **a green deploy of an empty site is worse than a red
build** — you find out from a recruiter rather than from CI.

### Pull requests build but never publish

The workflow runs on `pull_request` too, so a branch gets the full six-way build and
the verification, with the deploy step gated on
`github.event_name == 'push' && github.ref == 'refs/heads/main'`.

### Adding a seventh demo

1. Drop the folder in `demos/<slug>/` with a `package.json` whose `build` script
   produces `dist/`, plus `meta.json`, `CASE_STUDY.md` and `poster.webp`.
2. Add the slug to `ORDER` in `site/scripts/build-pages.mjs` to place it on the page.

No workflow change, no `build.mjs` change. The build warns about any demo on disk
that is not in `ORDER`, and skips it — which is also the one-line way to pull a demo
off the site without deleting it.

## 6. DNS

Assuming `pavlotyshkovets.dev` and Cloudflare as both registrar and DNS host, adding
the custom domain in the Pages project creates these automatically. Verify they exist:

| Type | Name | Value | Proxy |
|---|---|---|---|
| CNAME | `@` | `portfolio.pages.dev` | Proxied (orange) |
| CNAME | `www` | `portfolio.pages.dev` | Proxied (orange) |

`portfolio` is the Pages project name — change both values if you name it differently.
Cloudflare flattens the CNAME at the apex, so no ALIAS record is needed.

**If the domain is registered elsewhere** (Namecheap, GoDaddy), point its nameservers
at the two Cloudflare gives you — they look like `xxx.ns.cloudflare.com` — and manage
records in Cloudflare from then on. Propagation is usually under an hour.

**Email:** none of this touches MX records. If you later add email on the domain, add
MX and SPF records; nothing here conflicts.

**Before the first deploy**, set the real origin in
`site/scripts/build-pages.mjs`:

```js
origin: 'https://pavlotyshkovets.dev'   // currently 'https://example.invalid'
```

That value fills `og:url`, `og:image` and `<link rel="canonical">`. Left as-is, link
previews on LinkedIn and Slack will not resolve an image.

## 7. Rollback

**Fastest — Cloudflare dashboard.** Workers & Pages → your project → Deployments →
find the last good one → **Rollback to this deployment**. It is instant, because
Pages keeps every deployment permanently and rollback just re-points the alias.
Nothing is rebuilt, so a rollback cannot fail the way a rebuild can.

**From the command line:**

```bash
npx wrangler pages deployment list --project-name=portfolio
npx wrangler pages deployment tail --project-name=portfolio   # if you need logs
```

**From git,** when the bad state is in the source and not just the deploy:

```bash
git revert <sha>     # not reset — main is deployed from, so keep history forward-only
git push
```

**If a single demo is broken** and you want the rest live now: remove its slug from
the `ORDER` array in `site/scripts/build-pages.mjs` and push. The build warns about
demos on disk that are not in `ORDER`, and skips them. The demo folder stays in the
repo; it just does not appear on the site.

## 8. Alternative: GitHub Pages

Workable — 72 MB against a 1 GB soft limit, largest file 14.3 MB against a 100 MB
hard limit. Two real differences: bandwidth is a 100 GB/month soft limit rather than
unlimited, and there is no instant rollback, so recovering means pushing a revert and
waiting for a rebuild.

Only the `assemble` job changes — the six `demo` jobs are untouched, because they
produce artefacts rather than deploying anything. Replace its Cloudflare step with:

```yaml
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - uses: actions/deploy-pages@v4
```

and add `pages: write` and `id-token: write` to that job's `permissions`. DNS becomes
four A records at the apex (`185.199.108`, `.109`, `.110`, `.111` — all `.153`) plus a
`www` CNAME to `<username>.github.io`.

That the hosting swap touches one job and nothing else is the point of separating the
builds from the deploy.

## 9. Alternative: your own DigitalOcean droplet

You already run nginx and rsync, so this is the least new machinery — at the cost of
being the person who gets paged.

```bash
# from CI or your machine, after npm run build
rsync -az --delete dist/ deploy@your-droplet:/var/www/portfolio/
```

`--delete` is what makes a deploy a replacement rather than an accumulation; without
it, removed files stay served forever.

```nginx
server {
    listen 443 ssl http2;
    server_name pavlotyshkovets.dev www.pavlotyshkovets.dev;

    root /var/www/portfolio;
    index index.html;

    ssl_certificate     /etc/letsencrypt/live/pavlotyshkovets.dev/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pavlotyshkovets.dev/privkey.pem;

    # .glb and .hdr are not in nginx's default mime.types, and a wrong Content-Type
    # makes GLTFLoader fail in a way that looks like a corrupt model.
    types {
        model/gltf-binary  glb;
        image/vnd.radiance hdr;
        font/woff2         woff2;
        image/webp         webp;
    }

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml model/gltf-binary;
    gzip_min_length 1024;
    # Geometry and textures are already compressed; re-compressing them burns CPU for
    # nothing. Brotli static is better here if you have the module.
    gzip_proxied any;

    location /fonts/ { add_header Cache-Control "public, max-age=31536000, immutable"; }
    location ~* \.(glb|hdr|webp|woff2)$ { add_header Cache-Control "public, max-age=2592000"; }

    location / {
        try_files $uri $uri/ =404;
    }

    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy strict-origin-when-cross-origin;
}

server {
    listen 80;
    server_name pavlotyshkovets.dev www.pavlotyshkovets.dev;
    return 301 https://$host$request_uri;
}
```

Rollback here is keeping the previous `dist/` beside the live one and swapping a
symlink — deploy to `/var/www/portfolio-<timestamp>/`, then
`ln -sfn` the `current` symlink and reload nginx.

## 10. Measured state at handover

| | |
|---|---|
| Lighthouse (index, headless Chrome, desktop) | **Performance 98 · Accessibility 100 · Best Practices 100 · SEO 100** |
| Core Web Vitals | FCP 1.2 s · LCP 1.7 s · TBT 0 ms · CLS 0.075 |
| Index page JavaScript | **none** |
| Index page requests | 5 |
| Live WebGL contexts on the index | **0** — posters only |
| Third-party requests, anywhere on the site or in any demo | **0** |
| Broken links or assets across all 7 pages | 0 |

Remaining Lighthouse items are `uses-text-compression` (the local test server does
not gzip; Cloudflare does), a font-preload dependency chain, and `bf-cache` — none
apply to the deployed site or are worth chasing.
