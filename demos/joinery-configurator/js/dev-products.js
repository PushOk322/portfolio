'use strict';

/**
 * Registers every product, so the dev GUI keeps its category switcher.
 *
 * Imported only by 3d-viewer.js — a shipped bundle registers one product in its
 * entry file, and importing this instead would defeat the split.
 */

import { registerProduct } from './model-manager.js';
import { initWindowController, detachWindowController } from './window-controller.js';
import { initDoorController, detachDoorController } from './door-controller.js';
import { initBackDoorController, detachBackDoorController } from './back-door-controller.js';

registerProduct('windows', {
  init: initWindowController,
  detach: detachWindowController,
  modelPath: './src/models/window_demo.glb',
});

registerProduct('doors', {
  init: initDoorController,
  detach: detachDoorController,
  modelPath: './src/models/door_demo.glb',
});

registerProduct('backDoors', {
  init: initBackDoorController,
  detach: detachBackDoorController,
  modelPath: './src/models/door_demo_back.glb',
});
