/**
 * Portfolio build — a coordinator over six independent demo builds.
 *
 *   node build.mjs                     everything: six demos, then the site
 *   node build.mjs --only=<slug>       one demo, into demos/<slug>/dist
 *   node build.mjs --site-only         the site + assemble, demos built elsewhere
 *   node build.mjs --no-install        skip npm install (deps already present)
 *   node build.mjs --list              print the demo slugs, one per line
 *
 * Each demo owns its own build. This script does not know how any of them work — it
 * runs `npm run build` in the folder and copies whatever `dist/` comes out. That is
 * why one demo can be webpack, one esbuild, one a plain file copy, and adding a
 * seventh needs no change here.
 *
 * CI calls it one demo at a time, in parallel, then once more with --site-only to
 * assemble. Locally, no arguments does the lot in series. Same entry point either
 * way, so a green CI run and a green local build mean the same thing.
 */
import { spawnSync } from 'node:child_process';
import { cp, mkdir, rm, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DEMOS = join(ROOT, 'demos');
const SITE = join(ROOT, 'site');
const DIST = join(ROOT, 'dist');

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const value = (name) => argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];

const skipInstall = flag('no-install');
const only = value('only');
const siteOnly = flag('site-only');

const allSlugs = (await readdir(DEMOS, { withFileTypes: true }))
	.filter((d) => d.isDirectory() && d.name !== '_shared')
	.map((d) => d.name)
	.sort();

if (flag('list')) {
	console.log(allSlugs.join('\n'));
	process.exit(0);
}

if (only && !allSlugs.includes(only)) {
	console.error(`Unknown demo "${only}". Known: ${allSlugs.join(', ')}`);
	process.exit(1);
}

function run(cmd, cwd, label) {
	const started = Date.now();
	const result = spawnSync(cmd, { cwd, shell: true, stdio: 'pipe', encoding: 'utf8' });

	if (result.status !== 0) {
		console.error(`\n✖ ${label} failed (${cmd})\n`);
		console.error(result.stdout?.slice(-4000) ?? '');
		console.error(result.stderr?.slice(-4000) ?? '');
		process.exit(1);
	}

	console.log(`  ${label} — ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

async function dirSize(dir) {
	let bytes = 0;
	let files = 0;
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			const inner = await dirSize(full);
			bytes += inner.bytes;
			files += inner.files;
		} else {
			bytes += (await stat(full)).size;
			files += 1;
		}
	}
	return { bytes, files };
}

function buildDemo(slug) {
	const cwd = join(DEMOS, slug);

	// Checking for node_modules rather than special-casing slugs: stairs-generator has
	// no dependencies and no bundler, and that should stay a property of the folder
	// rather than a branch in here.
	if (!skipInstall && !existsSync(join(cwd, 'node_modules'))) {
		run('npm install --no-audit --no-fund', cwd, `${slug}: install`);
	}

	run('npm run build', cwd, `${slug}: build`);
}

/* --- One demo, nothing else. This is what each CI job calls. ---------------- */

if (only) {
	console.log(`Building ${only}\n`);
	buildDemo(only);

	const { bytes, files } = await dirSize(join(DEMOS, only, 'dist'));
	console.log(`\ndemos/${only}/dist — ${(bytes / 1048576).toFixed(1)} MB across ${files} files`);
	process.exit(0);
}

/* --- Coordinate: build what is needed, then assemble dist/ ------------------ */

const buildTargets = siteOnly ? [] : allSlugs;

console.log(
	siteOnly
		? 'Assembling site (demos expected to be built already)\n'
		: `Building ${allSlugs.length} demos + site\n`
);

for (const slug of buildTargets) buildDemo(slug);

if (!skipInstall && !existsSync(join(SITE, 'node_modules'))) {
	run('npm install --no-audit --no-fund', SITE, 'site: install');
}
run('npm run build', SITE, 'site: build');

// Assemble last so a failure above never leaves a half-written dist/ that looks
// deployable.
await rm(DIST, { recursive: true, force: true });
await mkdir(join(DIST, 'demos'), { recursive: true });

const missing = [];
for (const slug of allSlugs) {
	const built = join(DEMOS, slug, 'dist');
	if (!existsSync(built)) {
		missing.push(slug);
		continue;
	}
	await cp(built, join(DIST, 'demos', slug), { recursive: true });
}

if (missing.length) {
	console.error(`\n✖ no dist/ for: ${missing.join(', ')}`);
	console.error('  Build them first, or drop --site-only.');
	process.exit(1);
}

await cp(join(SITE, 'dist'), DIST, { recursive: true });

const { bytes, files } = await dirSize(DIST);
console.log(`\ndist/ — ${(bytes / 1048576).toFixed(1)} MB across ${files} files`);
console.log('Serve dist/ at the domain root. Demos live at /demos/<slug>/.');
