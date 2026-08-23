# CHANGES.md — orbital-slice

Everything that differs from `MY_DEMOS/react_elon_mars`. The original is untouched.

Slug: `orbital-slice` · Deploy path: `/demos/orbital-slice/` · Source: Avada Media
536 of 895 commits yours

---

## This is an extraction, not a sanitised copy

The audit estimated 6–10 h on the basis that the Phaser game reached outside
`src/game/` in only five places. That was true of the **game code** and missed the
shell: the game's UI classes (`UI`, `GameUI`, `GameOver`, `AboutGameUI`,
`LeaderboardPreGameUI`) query the DOM by selector in their constructors, and that DOM
came from `Game.tsx` — 837 lines of JSX that went with the React shell.

So the demo needed a static HTML shell reproducing **32 selectors** before the game
would boot at all. That's the bulk of the work here, and it's the one place where this
demo contains markup I wrote rather than yours. It is structure only — class names and
hierarchy copied from the original JSX, i18n lookups replaced with plain English,
`<Icon>` components replaced with `<img>`. No game logic.

## Removed with the shell

| Removed | Why |
|---|---|
| `src/components`, `src/store`, `src/hooks`, `src/constants`, `src/dictionaries`, `src/utils`, `src/routes` | The Mini App: boosters, referrals, invites, wallet, top-ups, routing |
| `.env` (~25 endpoints) | No backend |
| `public/tonconnect-manifest.json` | TON wallet manifest, pointed at `dev-webview3469456.elonmars.app` |
| `localhost.pem`, `localhost-key.pem` | Dev TLS keypair — a private key, however low-value |
| `src/services/{api.config,axios.config,getData,postData}.ts` | Dead once the API was mocked. `api.config.ts` also read `window.Telegram.WebApp` at module scope, which threw before Phaser ever booted |
| 17 dependencies | See below |

### Dependency prune

Dropped: `react`, `react-dom`, `react-router-dom`, `react-toastify`, `react-tooltip`,
`react-loader-spinner`, `react-range`, `@tanstack/react-query(+devtools)`, `zustand`,
`axios`, `@vitejs/plugin-react(-swc)`, `@types/react(-dom)`, `eslint-plugin-react*`,
`@emotion/react`, `@emotion/styled`, `@ton/core`, `@ton/crypto`, `@ton/ton`,
`@tonconnect/ui-react`, `@types/telegram-web-app`, `copy-to-clipboard`, `jose`, `immer`.

**`npm install` failed before this prune** — `@ton/ton@15.4.0` wants
`@ton/core >=0.62.0` and the lockfile pinned `0.60.1`, so a fresh clone of the original
does not install without `--legacy-peer-deps`. Worth knowing about the original repo.

Also worth flagging: **`add`, `i`, `npm` and `yarn` were real entries in
`dependencies`** — the residue of a mistyped `npm i add i npm yarn`. Removed here;
they are still in the original.

## Mocked backend

`src/services/api/game.api.ts` keeps the exact production shape (still returns
`{ data }` like the axios client did, so no call site changed) and resolves from
`src/services/api/fixtures.json`:

| call | fixture |
|---|---|
| `getCombo()` | five bonus planet ids + a 25,000 bonus |
| `getPlanets()` | 7 planets, 50–320 points |
| `getUserStats()` | best score from `localStorage`; `last_combo_at: null` |
| `getUserLeaderboard()` | 15 invented players, paginated by the real `offset`/`limit` |
| `getUserTopLeaderboard()` | top 10 + a current-user row |
| `claimReward()`, `sendStart()` | no-ops that resolve |

Two deliberate choices:

- `last_combo_at` is `null`, not a fresh timestamp. A timestamp from today puts the
  game straight into "bonus already claimed" and hides the combo mechanic on a first
  visit — the exact thing a visitor should see.
- **Best score persists in `localStorage`.** `getUserStats` read it but nothing wrote
  it, so "Best" would have read 0 forever. `recordBestScore()` is now called from
  `GameOver.setScore()`.

`src/types/services.types.ts` was trimmed from the whole Mini App API surface to the
ten interfaces the game uses — the rest named products this build doesn't contain.

## Telegram decoupling

| | |
|---|---|
| `showBackButton.ts` | Now a no-op. It drove Telegram's native back button; outside Telegram `window.Telegram` is undefined and it threw. |
| `src/game/utils/constants.ts` | Read `window.Telegram.WebApp.contentSafeAreaInset.top` **at module scope** — the error that took the whole bundle down. Replaced with `contentSafeAreaTop()` in a new `src/game/utils/safe-area.ts`, which optional-chains and returns 0. Kept dynamic, so it still works if re-embedded in a Mini App. |
| `src/game/styles/index.scss` | Telegram sets `--tg-content-safe-area-inset-top`. Nothing else does, and `calc(var(--undefined) + 40px)` makes the whole declaration invalid — so the HUD padding silently vanished outside Telegram. Defaulted to `0px` on `:root`. |

## External requests — all removed

| was | now |
|---|---|
| `telegram.org/js/telegram-web-app.js` | gone with the shell |
| `@import` of Google Fonts (Caveat) in `index.scss` — a runtime request | added to the existing `vite-plugin-webfont-dl` list, which downloads and self-hosts at build time |
| Roboto Slab via `webfontDownload` | already self-hosted; unchanged |

Measured on a real load: **8 requests, 1.62 MB, zero external, zero failed.**

## Build

`vite.config.js`: dropped `react()`, dropped the `https` block reading the deleted
`.pem` files, added Caveat to the self-hosted font list. `base: './'` was already set,
so the build works at a subpath unchanged.

`npm run build` → `dist/` (**17.69 MB**, 266 files). Most of that is sprite sheets and
audio that Phaser streams on demand — the initial page load is 1.62 MB.

**Not compressed further.** The two largest assets are `black-hole.png` (917 kB) and
`black-hole-red.png` (686 kB), and the existing imagemin pass only got 1% off them —
they are already near-optimal PNGs. Converting the sprite atlases to WebP would need
re-generating the accompanying JSON frame data, which is a bigger job than it's worth
for a demo that already opens in under two seconds.

## Portfolio scaffolding

`DEMO_NOTICE.md`, HTML comment notice, `portfolio/badge.{css,js}` anchored to `.wrapper`,
`.nvmrc` → `24`, package renamed `orbital-slice` with description and author.

Badge text here **is** "Portfolio build — mock data", unlike the other demos — this one
genuinely does run on fixtures.

## Naming

"Elon Mars" / "Marser" (the client's product, and a real person's name) → **Orbital
Slice**. The internal game title was "Galactic Slice"; I moved off that too since it
was the client's, not a generic label.

## Verification run

| Check | Result |
|---|---|
| `npm run build` | clean, `tsc` passes |
| Loads at `/demos/orbital-slice/` | Phaser boots, 3 scenes registered (`PreloadScene`, `MenuScene`, `SpaceScene`), canvas created |
| All 32 DOM selectors the UI classes require | **present** |
| Runtime errors on a fresh load | **none** (`error` + `unhandledrejection` listeners, 3 s window) |
| External requests | **0** |
| Failed requests | **0** |
| Initial transfer | 1.62 MB / 8 requests |
| Secrets, `.env`, `.pem`, Telegram/TON references | none |
| Mobile 380 px | no overflow, no sideways scroll |

### Not verified

**Whether the game actually plays.** Phaser drives everything from
`requestAnimationFrame`, which does not fire in the harness's non-compositing tab, so
the preloader sits at 0% and no scene becomes active. Everything above is structural.

This is the demo that most needs a real play-through before it ships. Specifically:
the preload progress bar, the Play button, slicing input, the bonus combo, game-over,
and whether the best score persists across a reload.
