/**
 * Whole-portfolio build.
 *
 *   node build.mjs   →   dist/
 *
 * Builds every demo, builds the index site, and assembles them into one deployable
 * folder with the site at the root and each demo mounted at /demos/<slug>/. That
 * layout is what the demo pages' iframes and the badges' "All demos" links assume,
 * so it is produced here rather than left to a hosting config.
 *
 * Demos are built in series, not in parallel. Four of the six run webpack or Vite
 * with an image pipeline, and running them together on a laptop mostly produces
 * memory pressure and interleaved output you cannot read when something fails.
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

const args = new Set(process.argv.slice(2));
const skipInstall = args.has('--no-install');

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

const slugs = (await readdir(DEMOS, { withFileTypes: true }))
	.filter((d) => d.isDirectory() && d.name !== '_shared')
	.map((d) => d.name)
	.sort();

console.log(`Building ${slugs.length} demos + site\n`);

await rm(DIST, { recursive: true, force: true });
await mkdir(join(DIST, 'demos'), { recursive: true });

for (const slug of slugs) {
	const cwd = join(DEMOS, slug);

	// stairs-generator has no dependencies to install and no bundler; its build is a
	// file copy. Checking for node_modules rather than special-casing the slug keeps
	// this honest if that ever changes.
	if (!skipInstall && !existsSync(join(cwd, 'node_modules'))) {
		run('npm install --no-audit --no-fund', cwd, `${slug}: install`);
	}

	run('npm run build', cwd, `${slug}: build`);
	await cp(join(cwd, 'dist'), join(DIST, 'demos', slug), { recursive: true });
}

if (!skipInstall && !existsSync(join(SITE, 'node_modules'))) {
	run('npm install --no-audit --no-fund', SITE, 'site: install');
}
run('npm run build', SITE, 'site: build');
await cp(join(SITE, 'dist'), DIST, { recursive: true });

const { bytes, files } = await dirSize(DIST);
console.log(`\ndist/ — ${(bytes / 1048576).toFixed(1)} MB across ${files} files`);
console.log('Serve dist/ at the domain root. Demos live at /demos/<slug>/.');
