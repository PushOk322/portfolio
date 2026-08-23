/**
 * Generates the site's HTML before Vite bundles it.
 *
 * Seven static pages — the index and one per demo — written out ahead of the build
 * rather than routed on the client. Three reasons, in order of how much they matter:
 * each demo page gets its own Open Graph tags so a pasted link previews correctly;
 * the index needs no JavaScript at all, which is most of the Lighthouse score; and a
 * static page cannot break the way a client router can.
 *
 * Content comes from the demo folders themselves — `meta.json` for the card, and
 * `CASE_STUDY.md` rendered to HTML. Nothing is duplicated into the site.
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEMOS = resolve(SITE, '..', 'demos');
const MENTIONS = resolve(SITE, '..', 'mentions', 'mentions.json');

/* The stylesheet is inlined into every page rather than linked.
   It is ~9.4 kB, 2.6 kB once the host gzips, and as a separate file it was the only
   render-blocking request on the site — Lighthouse measured 152 ms of delay for it.
   Seven copies of 2.6 kB costs less than one round trip on the page that matters
   most, and the site then paints from a single request. */
const CSS = await readFile(resolve(SITE, 'src', 'styles.css'), 'utf8');

const PROFILE = {
	name: 'Pavlo Tyshkovets',
	role: 'Frontend developer — real-time 3D configurators',
	email: 'tishkovets.pavlo@gmail.com',
	github: 'https://github.com/PushOk322',
	linkedin: 'https://www.linkedin.com/in/pavlo-tyshkovets-5b5224251/',
	// Set to a real absolute origin before deploying; used for og:url and og:image.
	origin: 'https://example.invalid'
};

/* Measured on a real first load of each built demo, served from a subpath. Kept
   here rather than in meta.json because they describe the deployed artefact, not
   the source — and because a number on a page should have one owner. */
const MEASURED = {
	'joinery-configurator': { payload: '8.08 MB', requests: 67, external: 0, mine: '100 / 100' },
	'stairs-generator': { payload: '3.64 MB', requests: 31, external: 0, mine: '73 / 73' },
	'boat-configurator': { payload: '7.30 MB', requests: 10, external: 0, mine: '271 / 776' },
	'orbital-slice': { payload: '1.62 MB', requests: 8, external: 0, mine: '536 / 895' },
	'canvas-studio': { payload: '0.30 MB', requests: 5, external: 0, mine: '10 / 10' },
	'tv-course-browser': { payload: '1.08 MB', requests: 16, external: 0, mine: '115 / 214' }
};

/* Display order. Deliberate, not alphabetical: the two strongest 3D pieces open,
   the React+TS piece anchors the middle, and the lighter work closes. */
const ORDER = [
	'joinery-configurator',
	'stairs-generator',
	'boat-configurator',
	'orbital-slice',
	'canvas-studio',
	'tv-course-browser'
];

const esc = (s) =>
	String(s)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');

/**
 * Markdown → HTML for the subset the case studies actually use: headings,
 * paragraphs, `---`, **bold**, *italic*, `code`. Hand-rolled rather than pulling in
 * a parser, because the input is six files I wrote and the subset is closed — a
 * general parser would be more code to audit, not less.
 */
function renderMarkdown(md, mark = '') {
	// Normalise line endings first. Splitting on /\n{2,}/ silently fails on CRLF — the
	// blank line between blocks is \r\n\r\n, which contains no two adjacent \n — so a
	// CRLF file collapses into a single block and renders as one unstyled paragraph.
	// Two of the six case studies were CRLF and did exactly that. Fixed here rather
	// than in the files, so the next file to arrive does not have to care.
	const blocks = md.replace(/\r\n?/g, '\n').trim().split(/\n{2,}/);
	const out = [];

	const inline = (text) =>
		esc(text)
			.replace(/`([^`]+)`/g, '<code>$1</code>')
			.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
			.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');

	for (const block of blocks) {
		const text = block.trim();
		if (!text) continue;

		if (text === '---') {
			out.push('<hr />');
			continue;
		}

		const heading = text.match(/^(#{1,3})\s+(.*)$/s);
		if (heading) {
			const level = heading[1].length;
			// The project's own mark separates the sections. A rule would do the same job
			// and say nothing; this one is drawn from the thing the page is about, and it
			// is the only ornament in the article.
			if (level === 2 && mark && out.some((b) => b.startsWith('<h2'))) {
				out.push(`<p class="study__mark" aria-hidden="true">${mark}</p>`);
			}
			out.push(`<h${level}>${inline(heading[2].trim())}</h${level}>`);
			continue;
		}

		// An unanswered question addressed to the author, not to the reader. Styled
		// as a margin note so nobody mistakes it for part of the argument.
		if (text.startsWith('TODO(pasha):')) {
			const body = text.replace(/^TODO\(pasha\):\s*/, '');
			out.push(
				`<p class="todo"><strong>Open question</strong> — ${inline(body.replace(/\n/g, ' '))}</p>`
			);
			continue;
		}

		out.push(`<p>${inline(text.replace(/\n/g, ' '))}</p>`);
	}

	return out.join('\n');
}

function head({ title, description, url, image, extraCss = '', lcpPoster = '' }) {
	return `  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <meta name="author" content="${esc(PROFILE.name)}" />
  <meta name="color-scheme" content="dark" />
  <link rel="canonical" href="${esc(url)}" />

  <meta property="og:type" content="website" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:url" content="${esc(url)}" />
  <meta property="og:image" content="${esc(image)}" />
  <meta name="twitter:card" content="summary_large_image" />

  <link rel="icon" href="/favicon.png" type="image/png" sizes="64x64" />
  <link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32" />

  <link rel="preload" href="/fonts/ibm-plex-mono-latin-500-normal.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="/fonts/ibm-plex-sans-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin />${lcpPoster ? `
  <link rel="preload" href="${lcpPoster}" as="image" type="image/webp" fetchpriority="high"
        imagesrcset="${lcpPoster.replace('.webp', '@800.webp')} 800w, ${lcpPoster} 1600w"
        imagesizes="(max-width: 860px) calc(100vw - 80px), 42vw" />` : ''}
  <style>${CSS}</style>${extraCss}`;
}

function masthead(active = '') {
	const cv = existsSync(join(SITE, 'public', 'cv.pdf'))
		? '<li><a class="masthead__link" href="/cv.pdf">CV</a></li>'
		: `<li><a class="masthead__link" href="#" aria-disabled="true"
            title="Drop cv.pdf into site/public/ and this link turns on">CV</a></li>`;

	return `<header class="masthead">
    <div class="shell masthead__inner">
      <a class="masthead__name" href="/">${esc(PROFILE.name)}</a>
      <nav aria-label="Elsewhere">
        <ul class="masthead__links">
          <li><a class="masthead__link" href="${PROFILE.github}" rel="me noreferrer">GitHub</a></li>
          <li><a class="masthead__link" href="${PROFILE.linkedin}" rel="me noreferrer">LinkedIn</a></li>
          <li><a class="masthead__link" href="mailto:${PROFILE.email}">Email</a></li>
          ${cv}
        </ul>
      </nav>
    </div>
  </header>${active ? '' : ''}`;
}

const colophon = `<footer class="colophon">
    <div class="shell colophon__inner">
      <span>Built by ${esc(PROFILE.name)}. No analytics, no cookies, nothing to consent to.</span>
      <span><a href="mailto:${PROFILE.email}">${esc(PROFILE.email)}</a></span>
    </div>
  </footer>`;

function dim(label) {
	return `<p class="dim"><span class="dim__label">${esc(label)}</span></p>`;
}

function specBlock(slug) {
	const m = MEASURED[slug];
	if (!m) return '';
	return `<dl class="spec">
            <div><dt>Payload</dt><dd>${esc(m.payload)}</dd></div>
            <div><dt>Requests</dt><dd>${m.requests}</dd></div>
            <div><dt>Third-party</dt><dd data-zero="${m.external === 0}">${m.external}</dd></div>
            <div><dt>My commits</dt><dd>${esc(m.mine)}</dd></div>
          </dl>`;
}

function entry(demo, index) {
	const flag = demo.posterIsPlaceholder
		? '<p class="entry__flag">Placeholder image — screenshot pending</p>'
		: '';

	// The first poster is the largest thing above the fold, so it is the LCP element.
	// Lazy-loading it would defer the very image the score is measured against.
	const loadAttrs =
		index === 0 ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"';

	return `<li class="entry">
        <figure class="entry__figure">
          <img class="entry__poster"
               src="/posters/${demo.slug}.webp"
               srcset="/posters/${demo.slug}@800.webp 800w, /posters/${demo.slug}.webp 1600w"
               sizes="(max-width: 860px) calc(100vw - 80px), 42vw"
               width="1600" height="900" ${loadAttrs} alt="" />
          ${flag}
        </figure>
        <div class="entry__body">
          <h3 class="entry__title"><a href="/${demo.slug}.html">${esc(demo.title)}</a></h3>
          <p class="entry__tagline">${esc(demo.tagline)}</p>
          ${specBlock(demo.slug)}
          <ul class="tags">${demo.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
          <a class="launch" href="/${demo.slug}.html">Open ${esc(demo.title)}
            <span class="launch__arrow" aria-hidden="true">→</span></a>
        </div>
      </li>`;
}

/* Work that is real but not demoable — behind a login, on a client's domain, or
   inseparable from a backend. A line each, with the commit share, because an
   unverifiable claim with a number attached is at least a checkable one. */
function mention(m) {
	return `          <li class="also__item">
            <h3 class="also__title">${esc(m.title)}</h3>
            <p class="also__kind">${esc(m.kind)} · ${esc(m.commits)} commits mine</p>
            <p class="also__blurb">${esc(m.blurb)}</p>
            <ul class="tags tags--quiet">${m.tech.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
          </li>`;
}

function indexPage(demos, mentions) {
	const description =
		'Live, interactive demos from a frontend developer specialising in real-time 3D product configurators. Three.js, React and TypeScript.';

	return `<!DOCTYPE html>
<html lang="en">
<head>
${head({
	title: `${PROFILE.name} — real-time 3D on the web`,
	description,
	url: `${PROFILE.origin}/`,
	image: `${PROFILE.origin}/og.png`,
	lcpPoster: demos.length ? `/posters/${demos[0].slug}.webp` : ''
})}
</head>
<body>
  ${masthead()}

  <main>
    <section class="hero">
      <div class="shell">
        <p class="hero__eyebrow">${esc(PROFILE.role)}</p>
        <h1 class="hero__title">I build things you can drag, size and configure in a browser.</h1>
        <p class="hero__lede">
          Six of them are on this page, running live — product configurators in Three.js,
          a Phaser game, 2D canvas work, and an app built for a television remote.
          Every figure below was measured on a real load.
        </p>
        <dl class="hero__stats">
          <div><dt>Demos</dt><dd>6</dd></div>
          <div><dt>Commercial years</dt><dd>3.5</dd></div>
          <div><dt>Third-party requests</dt><dd>0</dd></div>
        </dl>
      </div>
    </section>

    <section class="work" aria-labelledby="work-heading">
      <div class="shell">
        <h2 id="work-heading" class="visually-hidden">Selected work</h2>
        ${dim('Selected work · 6 entries')}
        <ul class="entries">
${demos.map(entry).join('\n')}
        </ul>
      </div>
    </section>

    <section class="also" aria-labelledby="also-heading">
      <div class="shell">
        ${dim(`Also shipped · ${mentions.length} projects`)}
        <h2 id="also-heading" class="visually-hidden">Also shipped</h2>
        <p class="also__intro">
          Not demoable here — most are behind a login, a client's domain, or a backend I
          cannot take with me. Listed because the work is real.
        </p>
        <ul class="also__list">
${mentions.map(mention).join('\n')}
        </ul>
      </div>
    </section>

    <section class="about" aria-labelledby="about-heading">
      <div class="shell">
        ${dim('About')}
        <div class="about__grid">
          <div>
            <h2 id="about-heading" class="about__label">Pavlo Tyshkovets</h2>
            <ul class="marks" aria-hidden="true">
${demos.map((d) => `              <li class="marks__item" title="${esc(d.title)}">${d.mark}</li>`).join('\n')}
            </ul>
          </div>
          <div class="about__body">
            <p>
              I'm a frontend developer with three and a half years of commercial
              experience, and my specialism is <strong>real-time 3D product
              configurators</strong> — the kind where a customer sizes a product, changes
              its finish, and sees the result before they buy. Several are in production.
            </p>
            <p>
              Most of that work is Three.js, React and TypeScript. Around it I've shipped
              a Phaser game inside a Telegram Mini App, an app for Samsung Tizen
              televisions, Next.js storefronts, and 2D canvas work in Fabric.js. I own
              deployments end to end: Linux, nginx, DNS, CDN, rsync.
            </p>
            <p>
              The demos here are modified builds. Client branding and proprietary data
              are gone and backends are replaced with local fixtures — each one says so
              in the corner and explains exactly what changed. The engineering is
              untouched.
            </p>
          </div>
        </div>
      </div>
    </section>
  </main>

  ${colophon}
</body>
</html>
`;
}

function demoPage(demo, studyHtml, mark) {
	const m = MEASURED[demo.slug];

	return `<!DOCTYPE html>
<html lang="en">
<head>
${head({
	title: `${demo.title} — ${PROFILE.name}`,
	description: demo.tagline,
	url: `${PROFILE.origin}/${demo.slug}.html`,
	image: `${PROFILE.origin}/posters/${demo.slug}.webp`
})}
</head>
<body>
  ${masthead(demo.slug)}

  <main>
    <div class="shell">
      <a class="back" href="/"><span aria-hidden="true">←</span> All work</a>

      <header class="demo-head">
        <p class="demo-head__mark" aria-hidden="true">${mark}</p>
        <h1 class="demo-head__title">${esc(demo.title)}</h1>
        <p class="demo-head__tagline">${esc(demo.tagline)}</p>
      </header>

      <div class="stage">
        <iframe class="stage__frame" src="/demos/${demo.slug}/index.html"
                title="${esc(demo.title)} — live demo" loading="lazy"
                allow="xr-spatial-tracking; fullscreen"></iframe>
      </div>

      <p class="stage__note">
        <span>Live build${m ? ` · ${esc(m.payload)} · ${m.external} third-party requests` : ''}</span>
        <a href="/demos/${demo.slug}/index.html" target="_blank" rel="noopener">Open full screen ↗</a>
      </p>
    </div>

    <article class="study shell">
${studyHtml}
    </article>
  </main>

  ${colophon}
</body>
</html>
`;
}

/* --- Run ------------------------------------------------------------------ */

const folders = (await readdir(DEMOS, { withFileTypes: true }))
	.filter((d) => d.isDirectory() && d.name !== '_shared')
	.map((d) => d.name);

const demos = [];
for (const slug of ORDER) {
	if (!folders.includes(slug)) {
		console.warn(`  ! ${slug} listed in ORDER but not present in demos/ — skipped`);
		continue;
	}
	const meta = JSON.parse(await readFile(join(DEMOS, slug, 'meta.json'), 'utf8'));
	// The project's geometry mark, inlined rather than linked so it inherits colour
	// from whatever it sits in.
	meta.mark = await readFile(join(DEMOS, slug, 'icon.svg'), 'utf8');
	demos.push(meta);
}

const missing = folders.filter((f) => !ORDER.includes(f));
if (missing.length) console.warn(`  ! not in ORDER, so not on the site: ${missing.join(', ')}`);

// Optional: a missing or empty mentions file simply means the section is not rendered.
let mentions = [];
try {
	mentions = JSON.parse(await readFile(MENTIONS, 'utf8'));
} catch {
	console.warn('  ! mentions/mentions.json missing or unreadable — section skipped');
}

await writeFile(join(SITE, 'index.html'), indexPage(demos, mentions), 'utf8');
console.log('  index.html');

for (const demo of demos) {
	const md = await readFile(join(DEMOS, demo.slug, 'CASE_STUDY.md'), 'utf8');
	await writeFile(
		join(SITE, `${demo.slug}.html`),
		demoPage(demo, renderMarkdown(md, demo.mark), demo.mark),
		'utf8'
	);
	console.log(`  ${demo.slug}.html`);
}
