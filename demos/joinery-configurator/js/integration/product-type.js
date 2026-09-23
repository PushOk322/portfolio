'use strict';

/**
 * Which product this build renders. Replaced at build time by
 * scripts/build.mjs, the same way asset-paths.js takes its base path.
 *
 * Unbundled the identifier does not exist, and typeof on an undeclared name is
 * safe. The fallback keeps `npm run dev` and the contract tests running.
 */
export const PRODUCT_TYPE =
  typeof __JOINERY_PRODUCT_TYPE__ === 'string' ? __JOINERY_PRODUCT_TYPE__ : 'window';
