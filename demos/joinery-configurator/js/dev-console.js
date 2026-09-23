'use strict';

/**
 * Devtools handle for the demo page.
 *
 * index.html drives the model through the UI panel, which has no control for
 * every state field — designs, per-section openings and locale among them.
 * This exposes the state-manager calls directly so a deployed demo build can be
 * driven from the console as well as by clicking.
 *
 * Demo page only. The shipped bundle exposes the integration API instead, and
 * scripts/build.mjs never sees this file.
 */

import {
  INITIAL_STATE,
  OPENING_TYPES,
  SECTION_LAYOUT_PRESETS,
  getCurrentState,
  updateSectionOpeningType,
  updateState,
  updateStateMultiple,
} from './state-manager.js';
import { DOOR_DESIGNS, DOOR_DESIGN_IDS } from './door-designs.js';
import { BACK_DOOR_DESIGNS, BACK_DOOR_DESIGN_IDS } from './back-door-designs.js';

window.joinery = {
  // Getter, not a snapshot — `joinery.state` in the console always reads live.
  get state() { return getCurrentState(); },

  set: updateState,
  setMany: updateStateMultiple,
  setOpening: updateSectionOpeningType,

  designs: DOOR_DESIGNS,
  designIds: DOOR_DESIGN_IDS,
  backDoorDesigns: BACK_DOOR_DESIGNS,
  backDoorDesignIds: BACK_DOOR_DESIGN_IDS,
  layouts: Object.keys(SECTION_LAYOUT_PRESETS),
  openings: OPENING_TYPES,
  keys: Object.keys(INITIAL_STATE),
};
