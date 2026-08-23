'use strict';

/** The door build's entry point. See entry-window.js for why this shape. */

import { registerProduct } from '../model-manager.js';
import { initDoorController, detachDoorController } from '../door-controller.js';

registerProduct('doors', {
  init: initDoorController,
  detach: detachDoorController,
  modelPath: './src/models/door_demo.glb',
});

export {
  mount, applyConfiguration, getConfiguration, whenSettled, isMounted, destroy,
  PRODUCT_TYPE, SCHEMA_VERSION, sizeLimits, minWidthMmForColumns,
  ERROR_CODES, WARNING_CODES,
} from './configurator-api.js';
