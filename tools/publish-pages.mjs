/* Publish the built site to the gh-pages branch.
 *
 *   node tools/publish-pages.mjs            # site only, demos must be built already
 *   node tools/publish-pages.mjs --full     # build every demo first (slow)
 *
 * GitHub Pages serves a project site from /<repo>/, not the domain root, so the site
 * is built with SITE_BASE set to match. Everything internal is written relative to it.
 *
 * gh-pages holds build output and nothing else, so it is published as a single fresh
 * commit from a scratch clone rather than merged. Force-pushing it is expected — there
 * is no history there worth keeping, and it avoids carrying 75 MB of superseded assets
 * forward on every deploy.
 */

import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');

const REPO_NAME = 'portfolio';
const BASE = `/${REPO_NAME}/`;
const ORIGIN = 'https://pushok322.github.io';
const BRANCH = 'gh-pages';

const run = (cmd, args, cwd, env) =>
	execFileSync(cmd, args, { cwd, stdio: 'inherit', env: { ...process.env, ...env } });

const capture = (cmd, args, cwd) =>
	execFileSync(cmd, args, { cwd, encoding: 'utf8' }).trim();

const full = process.argv.includes('--full');

console.log(`Building for ${ORIGIN}${BASE}\n`);
run('node', ['build.mjs', ...(full ? [] : ['--site-only'])], REPO, {
	SITE_BASE: BASE,
	SITE_ORIGIN: ORIGIN
});

const dist = join(REPO, 'dist');
if (!existsSync(join(dist, 'index.html'))) {
	console.error('\ndist/index.html is missing — build the demos first, or pass --full.');
	process.exit(1);
}

const sha = capture('git', ['rev-parse', '--short', 'HEAD'], REPO);
const stage = mkdtempSync(join(tmpdir(), 'gh-pages-'));

try {
	cpSync(dist, stage, { recursive: true });
	// Pages runs Jekyll unless told not to, which silently drops _headers and any other
	// underscore-prefixed path. The site build emits this too; belt and braces.
	writeFileSync(join(stage, '.nojekyll'), '');

	run('git', ['init', '-q', '-b', BRANCH], stage);
	run('git', ['config', 'user.name', capture('git', ['config', 'user.name'], REPO)], stage);
	run('git', ['config', 'user.email', capture('git', ['config', 'user.email'], REPO)], stage);
	run('git', ['remote', 'add', 'origin', capture('git', ['config', 'remote.origin.url'], REPO)], stage);
	run('git', ['add', '-A'], stage);
	run('git', ['commit', '-q', '-m', `Deploy portfolio to GitHub Pages (main @ ${sha})`], stage);
	run('git', ['push', '-f', 'origin', BRANCH], stage);

	console.log(`\nPublished main @ ${sha} to ${BRANCH}.`);
	console.log(`Live at ${ORIGIN}${BASE} once Pages is pointed at the branch.`);
} finally {
	rmSync(stage, { recursive: true, force: true });
}
