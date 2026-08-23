# ACTIONS_FOR_PASHA.md

Only the things I cannot do for you. Everything here needs your password, your card,
your memory, or your judgement.

Items 1–2 are independent of the portfolio and more urgent than it.
Items 3–10 are the deploy, in order.
Items 11–15 make the portfolio honest before anyone reads it.

---

## Urgent, and unrelated to shipping

### 1. ROTATE THE LEAKED CREDENTIALS — free · 45–60 min

The audit found live secrets sitting unencrypted in `MY_DEMOS`. None are in the
portfolio build — I removed every one — but they are still in the original folders,
and rotating them is not something I can do for you.

In descending order of how much a leak would cost you:

| Secret | Where | Action |
|---|---|---|
| **Cloudinary API key + secret** ×3 | `daly_backend/.env`, `branch-backup/.env`, `Quity-Strapi/.env` (+ its Copy), `sporthub-strapi/.env` | Roll the API secret in each Cloudinary console. A leaked pair lets anyone upload to, and delete from, the client's media library. |
| **Telegram bot token** | `python_wagtailenergy/.env` | `/revoke` then `/token` with @BotFather. A token is full control of the bot. |
| **Production Postgres passwords** ×4 | `daly_backend`, `Quity-Strapi`, `sporthub-strapi`, `python_*` | Change the password on each database user. |
| **Strapi `APP_KEYS` / `ADMIN_JWT_SECRET` / `JWT_SECRET`** ×4 | the four Strapi `.env` files | Regenerate. Anyone with these can forge an admin session. |
| Joomla DB + SMTP password + site secret | `mirrors/configuration.php` | Rotate if that site is still live. |
| reCAPTCHA private key, Google Translate API key | `python_wagtailenergy/.env` | Regenerate in Google Cloud console. |
| `react_alba` API key + domain ID | `react_alba/.env`, and a stray copy in `TEST/react_fitness_app/.env` | Ask AvadaMedia to rotate. |

**Then tell whoever owns each project** — several of these are client
infrastructure, not yours, and they need to know regardless of what you do.

### 2. DELETE THE STRAY CREDENTIAL COPIES — free · 10 min

Separate from rotating: the same secrets exist in more than one place, so rotating
once does not clean up. `branch-backup/` is a duplicate of `daly_backend` including
its `.env`; `Quity-Strapi - Copy/` duplicates `Quity-Strapi`;
`TEST/react_fitness_app/.env` holds a copy of the `react_alba` API key. I have not
deleted anything in `MY_DEMOS` — that was your rule and I kept it.

Also worth doing while you are in there: `tizen_samsung_tvapp/src/store/useUserStore.js`
has a hardcoded base64 Basic-auth credential. It decodes to Apigee's documentation
example rather than a live secret, so it is not urgent — but it should not be in
shipped source.

---

## Getting it online

### 3. BUY THE DOMAIN — ~$12–15/year · 10 min

`pavlotyshkovets.dev` if it is free. `.dev` is on the HSTS preload list, so it is
HTTPS-only by default — which suits a site that already makes zero third-party
requests.

Buy it at **Cloudflare Registrar** (at-cost, no markup, no upsells, and it puts the
domain in the same account as the hosting). Namecheap is the fallback if Cloudflare
does not sell the TLD.

### 4. CREATE A CLOUDFLARE ACCOUNT — free · 5 min

The free plan covers everything here: unlimited bandwidth, 500 builds a month,
instant rollback. Turn on 2FA while you are in there.

### 5. CREATE THE GITHUB REPO — free · 5 min

Public, named `portfolio`. Then, locally:

```bash
cd E:/Work/Personal/PORTFOLIO
git init -b main
git add .
git commit -m "Portfolio: six demos, index site, deploy spec"
git remote add origin git@github.com:PushOk322/portfolio.git
git push -u origin main
```

`.gitignore` already excludes `node_modules`, `dist`, and the generated HTML pages.
**Check `git status` before the first commit** and confirm no `.env` file appears —
none should, but it costs five seconds.

### 6. CREATE A CLOUDFLARE API TOKEN — free · 5 min

Cloudflare dashboard → My Profile → API Tokens → **Create Token** → *Custom token*:

- Permissions: **Account → Cloudflare Pages → Edit**
- Account Resources: **Include → your account**

Copy the token once — it is not shown again. While you are there, copy your
**Account ID** from the right-hand sidebar of the dashboard home.

### 7. ADD THE TWO REPOSITORY SECRETS — free · 3 min

GitHub repo → Settings → Secrets and variables → Actions → New repository secret:

| Name | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | the token from item 6 |
| `CLOUDFLARE_ACCOUNT_ID` | the account ID from item 6 |

Names must match exactly — `.github/workflows/deploy.yml` reads them by name.

### 8. CREATE THE PAGES PROJECT — free · 5 min

Cloudflare dashboard → Workers & Pages → Create → Pages → **Connect to Git** → pick
the repo. Name it **`portfolio`** (the workflow passes `--project-name=portfolio`;
change both if you name it differently).

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Environment variable | `NODE_VERSION` = `24` |

### 9. SET THE REAL DOMAIN IN THE BUILD — free · 2 min

Open `site/scripts/build-pages.mjs` and change one line:

```js
origin: 'https://example.invalid'   →   origin: 'https://pavlotyshkovets.dev'
```

That value fills `og:url`, `og:image` and `<link rel="canonical">` on all seven
pages. Left as it is, a link pasted into LinkedIn or Slack shows no preview image.

### 10. ADD THE CUSTOM DOMAIN — free · 10 min + propagation

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

### 11. CAPTURE THE SIX POSTER SCREENSHOTS — free · 30 min

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

### 12. PLAY-TEST ALL SIX DEMOS — free · 45 min

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

### 13. ANSWER THE FOUR OPEN QUESTIONS — free · 20 min

Four case studies carry an "Open question" note where I would have had to invent
something. They render on the site as visible margin notes, so they need answering or
deleting before you share the link.

| Demo | Question |
|---|---|
| joinery-configurator | Was the seven-family scope planned, or did it grow? "The config object was a response to the third family arriving late" is a better story than "I designed it that way". |
| boat-configurator | Is `AnnotationMaker` — 3D points projected to DOM overlays — yours? If so it deserves a paragraph; screen-space projection with occlusion is genuinely tricky. |
| orbital-slice | Is the black hole's `attractionForce` a real per-frame pull, or a scripted tween? It is the most distinctive mechanic and I could not tell from `rip.ts`. |
| tv-course-browser | Was the LG webOS build the same codebase? The repo has `useWebOsHistory` and `useTizenHistory` side by side — if it is one app targeting two platforms, that is a stronger claim than "a Tizen app". |

### 14. ADD YOUR CV — free · 5 min

Drop `cv.pdf` into `site/public/`. The masthead link detects it and turns itself on;
until then it renders struck through and disabled rather than 404ing.

### 15. DECIDE TWO THINGS I LEFT ALONE — free · 10 min

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
