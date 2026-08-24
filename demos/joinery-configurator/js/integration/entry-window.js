'use strict';

/**
 * The window build's entry point.
 *
 * Registering exactly one product here is the whole mechanism of the split: a
 * `define`d constant does not reliably tree-shake, a static import does. See §5
 * of docs/superpowers/specs/2026-08-20-per-product-scripts-design.md.
 */

import { registerProduct } from '../model-manager.js';
import { initWindowController, detachWindowController } from '../window-controller.js';

registerProduct('windows', {
  init: initWindowController,
  detach: detachWindowController,
  modelPath: './src/models/window_demo.glb',
});

// The Joinery surface. applyConfigurationFor is deliberately absent.
export {
  mount, applyConfiguration, getConfiguration, whenSettled, isMounted, destroy,
  PRODUCT_TYPE, SCHEMA_VERSION, sizeLimits, minWidthMmForColumns,
  ERROR_CODES, WARNING_CODES,
} from './configurator-api.js';
