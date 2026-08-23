'use strict';

/**
 * The Joinery integration surface. Everything behind these functions — state shape,
 * how payloads are interpreted, how the 3D is assembled — is ours to change.
 *
 * See docs/integration/ for the contract these implement.
 */

import { create3DScene, requestRender } from '../3d-scene.js';
import { initModelManager, whenModelSettled } from '../model-manager.js';
import { getCurrentState, updateStateMultiple } from '../state-manager.js';
import { setAssetBasePath } from '../asset-paths.js';

import { validate } from './validate.js';
import { toState } from './to-state.js';
import { fromState } from './from-state.js';
import { PRODUCT_TYPE } from './product-type.js';
import { toCategory } from './schema.js';
import { showImage, hideImage, isImageShowing } from './image-overlay.js';
import { entry, WARNING_CODES as W } from './codes.js';

export { SCHEMA_VERSION, sizeLimits, minWidthMmForColumns } from './schema.js';
export { ERROR_CODES, WARNING_CODES } from './codes.js';
export { PRODUCT_TYPE } from './product-type.js';

let _mounted = false;
let _mounting = null;
let _onError = null;
let _container = null;
let _imageConfig = null;
let _pendingImage = Promise.resolve();

// Bumped on every entry into or exit from image mode. The async image-load
// failure captures this before the fetch starts and checks it again when the
// promise settles, so a real configuration applied in between (which leaves
// image mode without cancelling the fetch) silences the stale report.
let _imageGeneration = 0;

// applyConfiguration is synchronous by contract, so a GLB load deferred past
// image mode is started without awaiting and picked up by whenSettled().
let _deferredLoad = Promise.resolve();

// getActiveCategory() only turns truthy once the GLB fetch resolves, so it
// cannot gate the "start the load" decision — two synchronous calls would both
// see it falsy and both start initModelManager(). This flag is set before the
// call, not after, so a second synchronous caller can't slip past it.
let _modelManagerStarted = false;

/**
 * Boots the configurator into `container`.
 *
 * @param {HTMLElement|HTMLCanvasElement} container  a canvas, or an element to
 *   create one inside.
 * @param {object} [options]
 * @param {string} [options.assetBasePath]  where GLB/HDR assets live. Defaults
 *   to a path relative to this script, which is right for the shipped bundle.
 * @param {object} [options.configuration]  an initial payload, applied once the
 *   scene is ready.
 * @param {(result: object) => void} [options.onError]  called whenever a
 *   configuration is rejected.
 * @returns {Promise<void>} resolves when the first model is on screen.
 */
export function mount(container, options = {}) {
  if (_mounting) return _mounting;

  _mounting = (async () => {
    if (!container) throw new Error('[Configurator] mount() needs a container element.');

    if (options.assetBasePath) setAssetBasePath(options.assetBasePath);
    _onError = typeof options.onError === 'function' ? options.onError : null;

    _container = container;

    await create3DScene(container);

    // The build decides the product, so the scene starts on it rather than on
    // state-manager's 'windows' default.
    updateStateMultiple({ productCategory: toCategory(PRODUCT_TYPE) });

    _mounted = true;

    // An image-only first configuration must not pull a multi-megabyte GLB
    // that will only ever sit behind a picture. The first real configuration
    // loads it instead.
    const startsAsImage = typeof options.configuration?.imageUrl === 'string';

    if (!startsAsImage) {
      _modelManagerStarted = true;
      await initModelManager();
    }

    if (options.configuration) {
      const result = applyConfiguration(options.configuration);
      if (!result.ok) _onError?.(result);
      await whenSettled();
    }
  })();

  return _mounting;
}

/**
 * Applies a complete configuration snapshot. Not a patch — a field you omit
 * falls back to its documented default, not to the value you sent last time.
 *
 * Validation is all-or-nothing: if anything fails, nothing is applied and the
 * previous render stays on screen.
 *
 * Returns synchronously. `ok: true` means the configuration was accepted and
 * state updated — if it changed the product type, the new model may still be
 * downloading. Await whenSettled() when you need pixels.
 *
 * @returns {{ok: boolean, errors: Array, warnings: Array, applied: object|null}}
 */
export function applyConfiguration(payload) {
  return applyConfigurationFor(PRODUCT_TYPE, payload);
}

/**
 * The unbound form. The dev GUI drives all three product types through this;
 * entry files deliberately do not re-export it.
 */
export function applyConfigurationFor(productType, payload) {
  const { ok, errors, warnings, normalized } = validate(payload, productType);

  if (!ok) {
    const result = { ok: false, errors, warnings, applied: null };
    _onError?.(result);
    return result;
  }

  if (!_mounted) {
    const result = {
      ok: false,
      errors: [{
        code: 'NOT_MOUNTED', field: null, sent: null, applied: null,
        message: 'mount() has not finished — await it before applying a configuration.',
      }],
      warnings,
      applied: null,
    };
    _onError?.(result);
    return result;
  }

  if (normalized.imageUrl) {
    _imageConfig = normalized;
    _imageGeneration++;
    const generation = _imageGeneration;

    // Snapshot rather than reading _onError from the closure: a destroy()
    // between now and the image settling must not report into whatever
    // session remounted afterwards.
    const onError = _onError;
    _pendingImage = showImage(_container, normalized.imageUrl).then(loaded => {
      if (!loaded && generation === _imageGeneration) {
        onError?.({
          ok: true,
          errors: [],
          warnings: [entry(W.IMAGE_LOAD_FAILED, { field: 'imageUrl', sent: normalized.imageUrl })],
          applied: normalized,
        });
      }
    });

    return { ok: true, errors: [], warnings, applied: normalized };
  }

  // Leaving image mode. The GLB may never have been fetched, in which case the
  // model manager has not been initialised either. _imageConfig clears
  // unconditionally: showImage() can return early without ever creating _img
  // (a detached container), leaving isImageShowing() false while a config was
  // still recorded — that config must not outlive this call regardless.
  if (isImageShowing()) hideImage();
  _imageConfig = null;
  _imageGeneration++;

  if (!_modelManagerStarted) {
    _modelManagerStarted = true;
    _deferredLoad = initModelManager();
  }

  // One call, so the whole configuration lands as a single notification and a
  // single rebuild rather than one per field.
  updateStateMultiple(toState(normalized, productType));
  requestRender();

  return { ok: true, errors: [], warnings, applied: normalized };
}

/** The normalised configuration currently on screen. */
export function getConfiguration() {
  if (!_mounted) return null;
  return _imageConfig ?? fromState(getCurrentState());
}

/** Resolves when the scene has caught up with the last applied configuration. */
export function whenSettled() {
  // Resolves with nothing, as before — the three are just what "settled" now covers.
  return Promise.all([_pendingImage, _deferredLoad, whenModelSettled()]).then(() => {});
}

export function isMounted() {
  return _mounted;
}

/**
 * Releases the configurator. The page is left without a rendered scene; call
 * mount() again to rebuild.
 */
export function destroy() {
  hideImage();
  _mounted = false;
  _mounting = null;
  _onError = null;
  _container = null;
  _imageConfig = null;
  _modelManagerStarted = false;
}
