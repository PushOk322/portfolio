# ACTIONS_FOR_PASHA.md

Only the things I cannot do for you. Everything here needs your password, your card,
your memory, or your judgement.

Items 1–8 are the deploy, in order. Items 9–13 make the portfolio honest before
anyone reads it.

**Done:** the repo is live at `github-personal:PushOk322/portfolio.git` and `main` is
pushed. Item 3 below is struck through; the rest still stand.

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

### 3. ~~CREATE THE GITHUB REPO AND PUSH~~ — done

Live and tracking `origin/main`. From here it is the ordinary loop:

```bash
git add -A && git commit -m "..." && git push
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

### 9. ~~CAPTURE THE SIX POSTER SCREENSHOTS~~ — done

All six are real screenshots now, captured at 1600x900 from the built demos and
written to `demos/<slug>/poster.webp` plus the two `site/public/posters/` variants.
`posterIsPlaceholder` is `false` everywhere, so the amber banners are gone.

What changed since this was written: the compositing problem was specific to the
browser pane I had then. Driving the installed Chrome over the DevTools protocol
renders and captures normally, WebGL included. `POSTERS.md` has the harness and the
per-demo recipe if any of these ever needs reshooting.

Each frame follows the brief in `POSTERS.md` — including the stairs switchback with
the quarter-turn landing, and the focus ring on a card in the TV browser.

### 10. ~~PLAY-TEST ALL SIX DEMOS~~ — done

**All six are now play-tested** in real Chrome, driven over the DevTools protocol at
1600x900. Four of the six had real bugs; all are fixed and re-verified. Kept below with
what was actually found, in the original order of risk.

| Demo | What to check |
|---|---|
| ~~**boat-configurator**~~ | **Done — clean.** Engines attach at `engine-point`, swap and remove correctly; upholstery retextures `inner-carpet`; interior and hull colour both apply; both GSAP camera tweens and Reset run. No console errors. One UX wrinkle, not a bug: `inner-carpet` is the cockpit floor, so from the opening exterior camera Interior colour and Upholstery look like they do nothing. Only visible from Console view. |
| ~~**orbital-slice**~~ | **Done.** It did not play — two real bugs, both fixed and verified end to end: the stylesheet holding the reset and every CSS token was imported by nothing, and the Play button was nested inside a transformed ancestor so it landed mid-screen instead of at the bottom. Preload, Play, slicing, scoring and best-score persistence all confirmed. |
| ~~**tv-course-browser**~~ | **Done — three real bugs, all fixed.** (1) Cold-loading any course route white-screened: `course.videos` read while `data` was still `null`. In-app navigation never hit it; a refresh or a shared link always did. (2) The video route was declared as bare `video` while `CoursePreview` links to `/video/:course_id/:video_id`, so React Router matched nothing and rendered a blank page with no error — that is what looked like a missing poster fallback. (3) `VideoPage` resolved the course from a store only `VideoCard` populates, so "Watch intro" reached a player with `url={undefined}`. It now falls back to the route params it already read. The player works: real video, title, transport controls, progress. |
| ~~**joinery-configurator**~~ | **Done — clean.** Colour selection works in both modes (Aluminium inside/outside, and the single PVC colour set), so the by-name material resolution survived. Product types, profile material and model, all design types, and the frame sliders all drive the model. Zero console errors. |
| ~~**stairs-generator**~~ | **Done — clean.** All five sliders driven to both extremes; the geometry rebuilds every time and stays coherent at the limits (6 m rise, 0.3 m steps, 0.1 m run → 72°, landing intact). Flight count, all four directions, and Reset work. Keyboard focus ring is visible on the sliders. |
| ~~**canvas-studio**~~ | **Done.** The t-shirt designer was unstyled (its stylesheet was an empty file); it has a proper UI now. Checked at 375 px: no sideways scroll, `fit.js` scales it 0.56, and Fabric's pointer mapping through the transform still lands. The other eight pages in that demo are untouched and still plain. |

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

### 12. ~~ADD YOUR CV~~ — done

`Tyshkovets_Pavlo_Frontend_3D_Web_Developer.pdf` is in `site/public/cv.pdf`, and the
masthead link has turned itself on.

**One thing to decide before you deploy:** the CV carries your phone number, and
`/cv.pdf` will be public and crawlable. If you would rather not have a mobile number
indexed, swap in a version that leaves it out — email and LinkedIn are already on the
page anyway.

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
