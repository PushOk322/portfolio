import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { readdirSync } from 'node:fs';

/* Nine HTML entry points. Vite only builds index.html unless every page is named in
 * rollupOptions.input, so the original had no config at all and `vite build` silently
 * shipped one of nine pages. Reading the directory keeps that from drifting again. */
const pages = Object.fromEntries(
  readdirSync(__dirname)
    .filter((f) => f.endsWith('.html'))
    .map((f) => [f.replace(/\.html$/, ''), resolve(__dirname, f)])
);

export default defineConfig({
  // './' rather than '/demos/canvas-studio/': relative asset URLs make the build
  // work at any subpath, so the deploy path can move without a rebuild.
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: { input: pages },
  },
});
