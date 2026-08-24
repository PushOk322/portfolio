import { defineConfig } from 'vite'
import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Seven entry points, written by scripts/build-pages.mjs before this config is read.
 * Reading the directory keeps the list from drifting when a demo is added or removed.
 */
const pages = Object.fromEntries(
	readdirSync(__dirname)
		.filter((f) => f.endsWith('.html'))
		.map((f) => [f.replace(/\.html$/, ''), resolve(__dirname, f)])
)

export default defineConfig({
	// Domain root by default, with the demos mounted alongside at /demos/. A GitHub
	// Pages project site lives under /<repo>/ instead, so SITE_BASE overrides it — the
	// same variable scripts/build-pages.mjs reads for the URLs it writes by hand.
	base: (process.env.SITE_BASE || '/').replace(/\/*$/, '/'),
	build: {
		outDir: 'dist',
		rollupOptions: { input: pages },
		// No JS on the index at all, so there is nothing to split. Keeping assets
		// inline-free and predictable makes the deploy step a plain file copy.
		assetsInlineLimit: 0
	}
})
