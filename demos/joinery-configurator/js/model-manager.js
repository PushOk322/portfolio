'use strict';

/**
 * model-manager.js
 * Owns the lifecycle of the product GLB: which one is in the scene, when it is
 * fetched, and which controller is bound to it.
 *
 * Products register themselves rather than being listed here. A shipped bundle
 * registers exactly one, which is what keeps the other products' controllers
 * and GLBs out of it; the dev GUI registers all three and keeps its switcher.
 */

import { loadModel, scene, requestRender } from './3d-scene.js';
import { subscribe, getCurrentState } from './state-manager.js';
import { initMorphModel } from './system/morphSystem.js';

const PRODUCTS = {};

/**
 * @param {string} category  engine category — 'windows' | 'doors' | 'backDoors'
 * @param {{init: Function, detach: Function, modelPath: string}} product
 */
export function registerProduct(category, { init, detach, modelPath }) {
  PRODUCTS[category] = { init, detach, modelPath, model: null };
}

let _activeCategory = null;
let _activeModel = null;

// The activation currently in flight. A category change downloads a GLB, so
// "state updated" and "model on screen" are different moments and callers that
// need the second one have to be able to wait for it.
let _pending = Promise.resolve();

// Bumped on every swap so a slow GLB that resolves after the user switched
// again is discarded instead of overwriting the newer model.
let _swapToken = 0;

/**
 * Loads the model for the current category and binds its controller.
 * Resolves with the loaded model, or null if it failed to load.
 */
export async function initModelManager() {
  const model = await _activate(getCurrentState().productCategory, false);

  // Subscribed last, after the controllers registered by _activate, so that a
  // category change reaches the outgoing controller (which tears down against
  // the model it still owns) before we pull that model out of the scene.
  subscribe((newState, oldState) => {
    if (oldState && newState.productCategory === oldState.productCategory) return;

    // Deferred one turn so the remaining subscribers see consistent state and
    // the incoming controller doesn't build twice.
    _pending = new Promise(resolve => {
      queueMicrotask(() => _activate(newState.productCategory).then(resolve, resolve));
    });
  });

  return model;
}

/** Resolves when any in-flight model swap has finished. */
export function whenModelSettled() {
  return _pending;
}

export function getActiveModel() {
  return _activeModel;
}

export function getActiveCategory() {
  return _activeCategory;
}

async function _activate(category, manageLoader = true) {
  const entry = PRODUCTS[category];
  if (!entry) {
    console.error(`[ModelManager] No product registered for category "${category}"`);
    return null;
  }

  if (_activeCategory === category && _activeModel) return _activeModel;

  const token = ++_swapToken;

  _deactivateCurrent();

  const showLoader = manageLoader && !entry.model;
  if (showLoader) _toggleLoader(true);

  const model = entry.model ?? await loadModel(entry.modelPath, false);

  // A newer swap started while this GLB was downloading — drop this result.
  if (token !== _swapToken) return null;

  if (showLoader) _toggleLoader(false);

  if (!model) {
    console.error(`[ModelManager] Failed to load "${entry.modelPath}" for category "${category}"`);
    return null;
  }

  entry.model = model;
  scene.add(model);

  _activeCategory = category;
  _activeModel = model;

  // morphSystem keeps a single flat list of morph targets for the active model,
  // so it has to be re-parsed before the controller sizes the product through
  // changeGlobalMorph().
  initMorphModel(model);

  entry.init(model);

  requestRender();
  return model;
}

function _deactivateCurrent() {
  if (!_activeCategory) return;

  PRODUCTS[_activeCategory].detach();

  // Only removed from the scene — the model stays on the registry entry so
  // switching back is instant.
  if (_activeModel) scene.remove(_activeModel);

  _activeCategory = null;
  _activeModel = null;
  requestRender();
}

function _toggleLoader(show) {
  document.getElementById('js-loader')?.classList.toggle('invisible', !show);
}
