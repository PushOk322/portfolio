'use strict';

/**
 * Resolves the GLB / HDR / texture paths written throughout the project.
 *
 * They are authored page-relative (`./src/models/window_demo.glb`). That works
 * for our own demo page, but once the bundle sits on a client's server those
 * paths resolve against *their* document, not against us, and 404 silently.
 * Everything therefore goes through resolveAsset(), which anchors them to the
 * script instead.
 */

// Replaced at build time by scripts/build.mjs. Unbundled the identifier does
// not exist, and typeof on an undeclared name is safe.
const BUILD_TIME_BASE =
  typeof __JOINERY_ASSET_BASE__ === 'string' ? __JOINERY_ASSET_BASE__ : '../';

let base = new URL(BUILD_TIME_BASE, import.meta.url);

const ABSOLUTE = /^([a-z][a-z0-9+.-]*:|\/\/)/i;

/**
 * Overrides where assets are loaded from. Accepts anything the URL constructor
 * understands; a relative value is resolved against the current document.
 * Call before mounting — assets already in flight keep the previous base.
 */
export function setAssetBasePath(path) {
  if (!path) return;

  const withSlash = String(path).endsWith('/') ? String(path) : `${path}/`;
  base = new URL(withSlash, document.baseURI);
}

export function getAssetBasePath() {
  return base.href;
}

/** Absolute URLs and data/blob URIs pass through untouched. */
export function resolveAsset(path) {
  if (!path || ABSOLUTE.test(path)) return path;

  return new URL(String(path).replace(/^\.\//, ''), base).href;
}
