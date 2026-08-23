import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    // Vendored libraries — three, gsap, jquery, dat-gui, model-viewer.
    ignores: ['js/libs/**', 'dist/**'],
  },
  js.configs.recommended,
  {
    // Browser runtime: the engine, controllers and demo harness.
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      // $, jQuery, gsap and THREE are declared per-file via /* global */
      // comments in the files that use them — redeclaring here trips
      // no-redeclare, so the only global added is the build-time one.
      globals: {
        ...globals.browser,
        // Injected by esbuild at build time; guarded with typeof when unbundled.
        __JOINERY_ASSET_BASE__: 'readonly',
        __JOINERY_PRODUCT_TYPE__: 'readonly',
      },
    },
    rules: {
      // No varsIgnorePattern: here `_foo` means module-private, not unused, so
      // ignoring that prefix would hide genuinely dead declarations.
      'no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
    },
  },
  {
    // Build scripts and the pure-module test suite run under node.
    files: ['scripts/**/*.mjs', 'tests/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
  },
];
