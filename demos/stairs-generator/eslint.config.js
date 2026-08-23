import js from '@eslint/js';
import globals from 'globals';

export default [
  // Vendored Three.js: not ours, and the minified builds would drown the report.
  // dist/ is build output — a copy of everything here, so linting it doubles every
  // report and drags the vendored bundles back in through the copy.
  { ignores: ['js/libs/**', 'dist/**'] },

  js.configs.recommended,

  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
    },
  },

  // js/core is the pure layer: Node imports it directly, so a stray `three` import
  // or DOM touch breaks the whole test suite at import time. Enforced here rather
  // than trusted to prose. `globalThis.window` still passes, and must — url-adapter
  // uses it as an injectable default, not as a DOM dependency.
  {
    files: ['js/core/**/*.js'],
    languageOptions: {
      globals: { ...globals.browser, document: 'off', window: 'off' },
    },
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{ name: 'three', message: 'js/core must stay THREE-free — Node cannot resolve it.' }],
        patterns: [{
          group: ['three/*', '../view/*', '../scene/*'],
          message: 'js/core may not depend on the view or scene layers, nor on THREE.',
        }],
      }],
    },
  },

  {
    files: ['tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
  },

  // Portfolio scaffolding — browser code, but outside js/ so it needs its own block.
  {
    files: ['portfolio/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
    },
  },

  // The static build script runs in Node.
  {
    files: ['build.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
  },
];
