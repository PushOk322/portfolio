import autoprefixer from 'autoprefixer'
import { defineConfig } from 'vite'
import path from 'path'
import postcssPresetEnv from 'postcss-preset-env'
import svgr from 'vite-plugin-svgr'
import tsconfigPaths from 'vite-tsconfig-paths'
import webfontDownload from 'vite-plugin-webfont-dl'
import viteImagemin from 'vite-plugin-imagemin'
import imageminMozjpeg from 'imagemin-mozjpeg'
import imageminOptipng from 'imagemin-optipng'
import imageminSvgo from 'imagemin-svgo'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  publicDir: path.resolve(__dirname, 'public'),
  preview: {
    port: 8000,
    strictPort: true,
  },
  // Plain http: the local dev certificates were removed with the rest of the
  // Telegram-specific setup (Mini Apps require https; a portfolio page does not).
  server: {
    port: 8000,
    strictPort: true,
    host: true,
  },
  plugins: [
    // No react() — the React shell is gone; this build is the Phaser game only.
    tsconfigPaths(),
    svgr(),
    // Downloads and self-hosts both faces at build time, so the running page makes no
    // request to Google. Caveat used to come in via an @import at the top of
    // src/game/styles/index.scss, which was a runtime request; it is listed here now.
    webfontDownload([
      'https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@100..900&display=swap',
      'https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap',
    ], {
      async: true,
      cache: true,
    }),
    viteImagemin({
      exclude: [/favicons\/.*\.png$/],
      skipIfLarger: true,
      clearCache: true,
      plugins: {
        jpg: imageminMozjpeg({
          arithmetic: true,
        }),
        png: imageminOptipng({
          optimizationLevel: 5,
        }),
        svg: imageminSvgo({
          plugins: [
            { name: 'removeViewBox', active: false },
            { name: 'removeMetadata', active: true },
            { name: 'removeComments', active: true },
            { name: 'removeTitle', active: true },
            { name: 'removeDoctype', active: true },
            { name: 'removeXMLProcInst', active: true },
            { name: 'removeUnusedNS', active: true },
            { name: 'removeEditorsNSData', active: true },
            { name: 'removeEmptyAttrs', active: true },
            { name: 'removeEmptyText', active: true },
            { name: 'removeEmptyContainers', active: true },
            { name: 'convertColors', params: { shorthex: true } },
            { name: 'convertStyleToAttrs', active: true },
            { name: 'convertPathData', active: true },
            { name: 'convertTransform', active: true },
            { name: 'removeUnknownsAndDefaults', active: true },
            { name: 'removeNonInheritableGroupAttrs', active: true },
            { name: 'collapseGroups', active: true },
            { name: 'mergePaths', active: true },
            { name: 'removeDesc', params: { removeAny: false } },
            { name: 'removeDimensions', active: true },
          ],
        }),
      },
    }),
  ],
  css: {
    postcss: {
      plugins: [autoprefixer(), postcssPresetEnv()],
    },
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },

  resolve: {
    alias: {
      '@mixin': path.resolve(__dirname, './src/styles/mixins/mixin.scss'),
      '@': path.resolve(__dirname, './src')
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
    terserOptions: {
      compress: {
        drop_console: true,
        dead_code: true,
        unused: true,
        join_vars: true,
      },
      format: {
        comments: false,
      },
      safari10: true,
    },
  },
})
