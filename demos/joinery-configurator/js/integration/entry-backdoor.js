'use strict';

/** The back-door build's entry point. See entry-window.js for why this shape. */

import { registerProduct } from '../model-manager.js';
import { initBackDoorController, detachBackDoorController } from '../back-door-controller.js';

registerProduct('backDoors', {
  init: initBackDoorController,
  detach: detachBackDoorController,
  modelPath: './src/models/door_demo_back.glb',
});

export {
  mount, applyConfiguration, getConfiguration, whenSettled, isMounted, destroy,
  PRODUCT_TYPE, SCHEMA_VERSION, sizeLimits, minWidthMmForColumns,
  ERROR_CODES, WARNING_CODES,
} from './configurator-api.js';
