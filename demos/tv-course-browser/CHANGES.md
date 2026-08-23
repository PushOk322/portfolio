# CHANGES.md — tv-course-browser

Everything that differs from `MY_DEMOS/tizen_samsung_tvapp`. The original is untouched.

Slug: `tv-course-browser` · Deploy path: `/demos/tv-course-browser/`
Source: Avada Media · 115 of 214 commits yours

---

## Sanitisation

| Item | Action |
|---|---|
| `.env` | **Deleted.** Held the production base URL and six endpoint paths. |
| `kivi-swagger_20240329 (2).yaml` | **Deleted.** An internal API specification sitting in the repo root — the client's interface document, not a code sample. |
| `example_sport.json` (142 KB) | **Deleted.** An unexplained saved API payload; not referenced by any code and not mine to publish. |
| Hardcoded credential in `useUserStore.js` | **Replaced.** The source shipped `const password = 'YWhhbWlsdG9uQGFwaWdlZS5jb206bXlwYXNzdzByZAo'` — base64 for `ahamilton@apigee.com:mypassw0rd`. That is Apigee's *documentation example*, not a live secret, but a Basic-auth credential literal has no business in shipped source. **Worth fixing in the original too.** |
| `id='kivi-header'` | → `id='tv-header'` |
| `<title>Kiwi</title>` | → `TV Course Browser` |
| `src/assets/video.mp4` (69 MB) | **Not copied.** Grepped first: referenced nowhere in the source. It was 97% of the project's weight. |

Verified: grep for `api_key|secret|password|access_token|bearer` → only the two legitimate
`Bearer ${token}` header constructions remain. No `.env`, no keys. Grep for `kiwi|kivi` → 0.

## Mocked backend — one seam, seven stores untouched

Rather than editing seven Zustand stores, `src/services/mock-api.js` swaps **axios's
adapter**. Every request the app makes is matched on URL and answered from a fixture:

| endpoint pattern | fixture |
|---|---|
| `courses` / `schema` | 8 courses, 77 sessions |
| `banners` | 4 hero slides |
| `offert` | placeholder terms text |
| `auth` / `login` | a demo user |
| `logout` | `{ success: true }` |
| anything else | `{ data: [] }` |

The fallback resolves rather than rejects on purpose: a store that throws leaves a
spinner up forever, which reads as a broken demo rather than an empty one. Responses
are delayed 120 ms so loading states are visible instead of skipped.

`axios.create` is patched as well as `axios.defaults`, since `axios.config.js` builds
its own instance.

Fixture shapes were derived from what the components actually read — `course.videos`,
`course.preview_fullscreen`, `video.is_paid`, `banners.episodes_count` — not guessed.

## Auth bypass

`useUserStore` now seeds an authenticated session instead of the empty initial state.
Production opened on a code-entry screen where you paired the TV with an account on
your phone; with no account system that wall can never be satisfied. The auth screens
are still built and still routable — the visitor just doesn't start behind them.

## The bug that made the whole thing look empty

First build rendered the header and nothing else. Console:

```
ReferenceError: process is not defined   (in fetchData)
```

`webpack.DefinePlugin` only substitutes the keys it is handed, and those came from
`.env` — which I had just deleted. So every `process.env.WEBPACK_*` in the stores
survived into the bundle as a literal `process` reference and threw the moment a store
built a URL. The page looked *almost* fine, which is what made it worth chasing:
layout and navigation rendered, only the data was missing.

Fixed by declaring the endpoint names in `webpack.config.js` with placeholder values —
the mock adapter intercepts before the URL matters, but the substitution has to happen.

`dotenv.config().parsed` also returns `undefined` with no `.env`, and the next line
assigned to it — so the build itself threw before webpack started. Now `?? {}`.

## Two smaller fixture bugs, both caught by reading the rendered text

- **Durations printed as `1500`.** `VideoCard` renders `{video.duration}` raw, so the
  production API must have returned preformatted strings. Fixtures now emit `"25:00"`.
- **Hero read "lessons pass to lessons"** with no number. `HeroSlide` reads
  `banners.episodes_count` and `banners.title`; my banner fixtures had `name` and no
  count. Both added.

## External requests — all removed

Four Google Fonts stylesheets in `index.html` (Oswald, Montserrat, Roboto, IBM Plex
Sans) → self-hosted Oswald + Montserrat, latin, 400/600. **Roboto and IBM Plex Sans
were linked and never referenced** — four blocking stylesheets on a TV's connection
for two fonts.

Service worker registration removed. It exists for the packaged TV app's offline
start-up; served from a web subpath it just fails to register and logs an error on
every load, and there is nothing here worth caching.

Measured: **0 external requests, 0 failed, 1.08 MB.**

## Added: the remote-control hint

`src/components/widgets/layout/RemoteHint/` — a corner card, mounted in `Layout`.

On a TV nobody needs telling; the remote is in their hand. In a browser tab the app
looks unresponsive to a mouse, because focus moves on arrow keys and there is nothing
to click. Without this, a visitor clicks twice, concludes it's broken and leaves.

It dismisses itself on the first arrow-key press — the moment it has done its job.

**On touch devices it says something different**: "Best viewed on a desktop", because
a phone has no arrow keys and the desktop wording would be useless. That is this
demo's answer to the brief's mobile requirement — it renders correctly at 380 px with
no overflow, but it cannot be *driven* without a keyboard, and saying so is better
than letting someone prod at it.

## Build

`npm run build` (webpack 5) → `dist/` — **1.27 MB, 63 files.** Down from 70 MB, almost
all of it the unused video.

Left on webpack rather than migrated to Vite: the config carries TV-specific asset
pipelines (separate `outputPath` for video, img and audio) and a Tizen packaging step,
and porting that to prove a point about build tooling would risk the thing that makes
this demo interesting.

40 build warnings, all pre-existing: SCSS `@import` deprecation and a bundle-size hint.

## Portfolio scaffolding

`DEMO_NOTICE.md`, HTML comment notice, `portfolio/badge.{css,js}` (badge text is
"Portfolio build — mock data" — this one does run on fixtures), `.nvmrc` → `24`,
package renamed with description and author crediting Avada Media.

## Verification run

| Check | Result |
|---|---|
| `npm run build` | compiles, 40 pre-existing warnings |
| Renders at `/demos/tv-course-browser/` | header nav, hero slider, course rows |
| Fixture data reaching the UI | 8 courses with titles, 77 sessions with formatted durations, 36 placeholder images |
| Runtime errors | **none** (`error` + `unhandledrejection`, 5 s window) |
| External requests | **0** |
| Failed requests | **0** |
| Transfer | 1.08 MB |
| Secrets / credentials / client name | clean |
| Desktop 1280 px | no overflow, no sideways scroll |
| Mobile 380 px | no overflow, no sideways scroll; shows the "best viewed on a desktop" card |

### Not verified

**Arrow-key navigation itself** — whether focus actually moves between cards, whether
Enter opens a course, and whether the video page behaves with no real video source.
Spatial navigation depends on measured element coordinates, and the harness's browser
pane doesn't composite, so layout measurement is unreliable there.

Worth checking by hand: arrow through the hero slider into the course rows, press
Enter on a course, and see what the video page does with a fixture that has no
playable file. That last one may need a poster-image fallback.
