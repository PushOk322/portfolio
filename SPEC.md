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

## 2. Build

```bash
cd E:/Work/Personal/PORTFOLIO
npm run build
```

That runs `build.mjs`, which:

1. installs dependencies for any demo missing `node_modules` (skip with `npm run build:fast`),
2. runs `npm run build` in each of the six demos, in series,
3. copies each demo's `dist/` to `dist/demos/<slug>/`,
4. builds the site and copies its `dist/` to the root of `dist/`.

Output: **≈72 MB across ≈576 files.** Serve `dist/` at the domain root.

```bash
npm run preview     # http://127.0.0.1:8080
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

## 3. Hosting — Cloudflare Pages (recommended)

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

## 4. GitHub Actions

`.github/workflows/deploy.yml` — builds on push to `main` and deploys to Cloudflare
Pages. Requires two repository secrets (see `ACTIONS_FOR_PASHA.md` items 6–7).

```yaml
name: Build and deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

# One deploy at a time. Two overlapping runs can publish out of order and leave the
# older build live.
concurrency:
  group: pages-deploy
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc

      # No root lockfile — each demo installs its own. Cache by the hash of every
      # demo lockfile so a change in one demo does not invalidate the rest.
      - uses: actions/cache@v4
        with:
          path: |
            ~/.npm
            demos/*/node_modules
            site/node_modules
          key: deps-${{ runner.os }}-${{ hashFiles('demos/*/package-lock.json', 'site/package-lock.json') }}
          restore-keys: deps-${{ runner.os }}-

      - name: Build everything
        run: npm run build

      - name: Check the build actually produced something
        run: |
          test -f dist/index.html
          for slug in $(ls demos | grep -v _shared); do
            test -f "dist/demos/$slug/index.html" || { echo "missing demo: $slug"; exit 1; }
          done
          echo "dist/ = $(du -sh dist | cut -f1) across $(find dist -type f | wc -l) files"

      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=portfolio --branch=main
```

The verification step is not ceremony. Every demo build can succeed while producing
an empty `dist/` if a path assumption breaks, and a green deploy of an empty site is
worse than a red build.

## 5. DNS

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

## 6. Rollback

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

## 7. Alternative: GitHub Pages

Workable — 72 MB against a 1 GB soft limit, largest file 14.3 MB against a 100 MB
hard limit. Two real differences: bandwidth is a 100 GB/month soft limit rather than
unlimited, and there is no instant rollback, so recovering means pushing a revert and
waiting for a rebuild.

Swap the last step of the workflow:

```yaml
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - uses: actions/deploy-pages@v4
```

and add `pages: write` and `id-token: write` to `permissions`. DNS becomes four A
records at the apex (`185.199.108-111.153`) plus a `www` CNAME to
`<username>.github.io`.

## 8. Alternative: your own DigitalOcean droplet

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

## 9. Measured state at handover

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
