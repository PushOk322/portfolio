# ACTIONS_FOR_PASHA.md

Only the things I cannot do for you. Everything here needs your password, your card,
your memory, or your judgement.

Items 1–8 are the deploy, in order. Items 9–13 make the portfolio honest before
anyone reads it.

The git repo is already created and committed locally — `main`, one commit, remote
set to `github-personal:PushOk322/portfolio.git`. **Nothing has been pushed**, because
the repository does not exist on GitHub yet and creating it needs your account.

---

## Getting it online

### 1. BUY THE DOMAIN — ~$12–15/year · 10 min

`pavlotyshkovets.dev` if it is free. `.dev` is on the HSTS preload list, so it is
HTTPS-only by default — which suits a site that already makes zero third-party
requests.

Buy it at **Cloudflare Registrar** (at-cost, no markup, no upsells, and it puts the
domain in the same account as the hosting). Namecheap is the fallback if Cloudflare
does not sell the TLD.

### 2. CREATE A CLOUDFLARE ACCOUNT — free · 5 min

The free plan covers everything here: unlimited bandwidth, 500 builds a month,
instant rollback. Turn on 2FA while you are in there.

### 3. CREATE THE GITHUB REPO AND PUSH — free · 5 min

On GitHub, create an **empty** repository named `portfolio` under your personal
account — no README, no `.gitignore`, no licence, or the first push will conflict.

Everything local is already done. One command:

```bash
cd E:/Work/Personal/PORTFOLIO
git push -u origin main
```

The remote is `github-personal:PushOk322/portfolio.git`, which resolves through your
`~/.ssh/config` to `github.com` on `id_ed25519` — deliberately not the `github-work`
key. Change the remote if you want a different name:

```bash
git remote set-url origin github-personal:PushOk322/<name>.git
```

Worth knowing before you push: the commit is authored as
`tishkovets.pavlo@gmail.com`, set repo-locally. Your global identity is
`pt@marevo.vision`, which would have put your employer's domain on every commit in
your personal portfolio and kept the contributions off your GitHub profile.

The push is ~51 MB, so give it a minute. See `SPEC.md` §2 for why the 3D assets are
in git rather than LFS.

### 4. CREATE A CLOUDFLARE API TOKEN — free · 5 min

Cloudflare dashboard → My Profile → API Tokens → **Create Token** → *Custom token*:

- Permissions: **Account → Cloudflare Pages → Edit**
- Account Resources: **Include → your account**

Copy the token once — it is not shown again. While you are there, copy your
**Account ID** from the right-hand sidebar of the dashboard home.

### 5. ADD THE TWO REPOSITORY SECRETS — free · 3 min

GitHub repo → Settings → Secrets and variables → Actions → New repository secret:

| Name | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | the token from item 4 |
| `CLOUDFLARE_ACCOUNT_ID` | the account ID from item 4 |

Names must match exactly — `.github/workflows/deploy.yml` reads them by name.

Only the `assemble` job uses them. The six demo build jobs need no secrets, so a
pull request from a fork still builds and verifies without any access to yours.

### 6. CREATE THE PAGES PROJECT — free · 5 min

Cloudflare dashboard → Workers & Pages → Create → Pages → **Connect to Git** → pick
the repo. Name it **`portfolio`** (the workflow passes `--project-name=portfolio`;
change both if you name it differently).

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Environment variable | `NODE_VERSION` = `24` |

### 7. SET THE REAL DOMAIN IN THE BUILD — free · 2 min

Open `site/scripts/build-pages.mjs` and change one line:

```js
origin: 'https://example.invalid'   →   origin: 'https://pavlotyshkovets.dev'
```

That value fills `og:url`, `og:image` and `<link rel="canonical">` on all seven
pages. Left as it is, a link pasted into LinkedIn or Slack shows no preview image.

### 8. ADD THE CUSTOM DOMAIN — free · 10 min + propagation

Pages project → Custom domains → Set up a custom domain → enter the apex and `www`.
Cloudflare creates the DNS records itself. Confirm they exist:

| Type | Name | Value | Proxy |
|---|---|---|---|
| CNAME | `@` | `portfolio.pages.dev` | Proxied |
| CNAME | `www` | `portfolio.pages.dev` | Proxied |

If you bought the domain elsewhere, first point its nameservers at the two Cloudflare
gives you (`xxx.ns.cloudflare.com`). Usually live inside an hour.

---

## Before anyone reads it

### 9. CAPTURE THE SIX POSTER SCREENSHOTS — free · 30 min

**All six poster images are placeholders.** They are typographic cards carrying a
visible "PLACEHOLDER — REPLACE WITH SCREENSHOT" chip, because the browser I had could
not composite a frame — every demo draws through `requestAnimationFrame` and there
was nothing to capture.

`POSTERS.md` has the exact steps and, for each demo, the specific frame worth
shooting. The stairs one matters most: capture a **switchback with a quarter-turn
landing**, not a straight flight — the turn is what proves the geometry is solved
rather than modelled.

Set `"posterIsPlaceholder": false` in each demo's `meta.json` as you replace them.
That flag drives the amber banner on the card, so it turns itself off.

### 10. PLAY-TEST ALL SIX DEMOS — free · 45 min

I verified structure, network and tests. **I could not verify a single rendered
pixel** — no compositing, so no render loop and no screenshots. Everything visual is
unconfirmed.

In rough order of risk:

| Demo | What to check |
|---|---|
| **boat-configurator** | Highest risk — the control panel is new code I wrote against a scene API I did not. Swap engines (does it attach at `engine-point`?), change upholstery (does `inner-carpet` retexture?), and press Console view / Full view (do the GSAP camera tweens run?). |
| **orbital-slice** | Does it actually play? Preload progress, Play button, slicing, the bonus combo, game over, and whether your best score survives a reload. |
| **tv-course-browser** | Arrow through the hero into the course rows, press Enter on a course. Then open a session and see what the video page does with a fixture that has no playable file — that may need a poster fallback. |
| **joinery-configurator** | Colour selection specifically. It resolves materials by name, and it is the thing the failed compression attempt would have broken. |
| **stairs-generator** | Drag every slider to both ends, including flight count. |
| **canvas-studio** | The t-shirt designer on a phone — everything is CSS-scaled to fit there, and Fabric's pointer mapping through a transform is worth eyeballing. |

### 11. ANSWER THE FOUR OPEN QUESTIONS — free · 20 min

Four case studies carry an "Open question" note where I would have had to invent
something. They render on the site as visible margin notes, so they need answering or
deleting before you share the link.

| Demo | Question |
|---|---|
| joinery-configurator | Was the seven-family scope planned, or did it grow? "The config object was a response to the third family arriving late" is a better story than "I designed it that way". |
| boat-configurator | Is `AnnotationMaker` — 3D points projected to DOM overlays — yours? If so it deserves a paragraph; screen-space projection with occlusion is genuinely tricky. |
| orbital-slice | Is the black hole's `attractionForce` a real per-frame pull, or a scripted tween? It is the most distinctive mechanic and I could not tell from `rip.ts`. |
| tv-course-browser | Was the LG webOS build the same codebase? The repo has `useWebOsHistory` and `useTizenHistory` side by side — if it is one app targeting two platforms, that is a stronger claim than "a Tizen app". |

### 12. ADD YOUR CV — free · 5 min

Drop `cv.pdf` into `site/public/`. The masthead link detects it and turns itself on;
until then it renders struck through and disabled rather than 404ing.

### 13. DECIDE TWO THINGS I LEFT ALONE — free · 10 min

- **`stairs-generator/CLAUDE.md`** — kept. It is the clearest architecture document
  in that project, and it also makes the AI-assisted development visible to anyone
  browsing the repo. The case study says so plainly, which I think is the right call.
  Keep it, fold it into `docs/architecture.md`, or delete it.
- **Four pre-existing lint errors** — two in `joinery-configurator`
  (`js/system/morphSystem.js`, unused reference implementations) and two in
  `boat-configurator` (`@ts-nocheck` in `EventEmitter.ts`). They fail in the originals
  too; I did not delete your code. But a recruiter who runs `npm run lint` sees red.
  Delete them or add an `eslint-disable` with a one-line reason.

---

## What none of this costs

The whole deploy is **free** except the domain (~$12–15/year). No paid tier, no
analytics subscription, no CDN bill. The site has no cookies, no trackers, and makes
zero third-party requests, so there is nothing to consent to and no banner to build.

---

## One note, not a task

The original projects in `MY_DEMOS` still contain the `.env` files and API keys the
audit found. Nothing from them reached this portfolio — no secrets, no git history,
no remotes — and I have not modified or deleted anything in that folder.

The only thing to keep in mind: **do not publish those folders anywhere.** What you
do about the keys themselves is your call and your clients'.
