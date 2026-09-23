'use strict';
import { requestRender } from './3d-scene.js';
import { interpolateValue, changeGlobalMorph } from './system/morphSystem.js';
import { subscribe, getCurrentState } from './state-manager.js';
import { getConstants } from './product-constants.js';
import {
  designSupportsGlass, designSupportsWindowFrame, DESIGN_NODE_ALIASES,
  DESIGN_MATERIAL_FIXES,
} from './door-designs.js';
import { createDoorLeaf } from './door-leaf.js';

// ─── Constants ────────────────────────────────────────────────────────────────

// ─── Module state ─────────────────────────────────────────────────────────────

let _model = null;

let _config = {};
let C = getConstants('doors', 'pvc', '70');

const _leaf = createDoorLeaf({
  getConfig: () => _config,
  getConstants: () => C,
  keys: () => {
    const { profileMaterial, profileModel, handleOutside, handleInside, hingeType } = _config;
    const prefix = profileMaterial === 'alum' ? 'alum_' : `${profileMaterial}_${profileModel}_`;
    const hingeSlot = profileMaterial === 'pvc' ? '' : `${hingeType}_`;

    return {
      leaf: `${prefix}door`,
      hingeBody: `${prefix}door_hinge_${hingeSlot}frame`,
      hingeMove: `${prefix}door_hinge_${hingeSlot}move`,
      handleOutside: handleOutside === 'none' ? null : `outside_handle_${handleOutside}`,
      handleInside: handleInside === 'none' ? null : `inside_handle_frame_${handleInside}`,
    };
  },
  leafObjects: () =>
    Object.keys(_originals)
      .filter(n => n.includes('_door_design_'))
      .map(n => _originals[n]),
});

const _originals = _leaf.originals;

// ─── Init ─────────────────────────────────────────────────────────────────────

// The door GLB is loaded and unloaded on demand (see model-manager.js), so init
// runs once per model while the state subscription must only ever be added once.
let _subscribed = false;

export function initDoorController(model) {
  _model = model;

  _leaf.attach(model);
  _repairDesignMaterials(model);
  _leaf.hideAll();

  _syncFromState(getCurrentState(), null);

  _leaf.buildHardware();

  if (_subscribed) return;

  subscribe((newState, oldState) => _syncFromState(newState, oldState));
  _subscribed = true;
}

/**
 * Releases the door model. The GLB itself is kept by model-manager.js for reuse
 * — this only drops what was cloned or cached from it. Safe to call twice.
 */
export function detachDoorController() {
  _leaf.detach();
  _model = null;
}

export const placeItems = () => _leaf.placeItems();
export const openDoor = () => _leaf.open();
export const closeDoor = () => _leaf.close();
export const toggleDoor = () => _leaf.toggle();
export const getDoorProgress = () => _leaf.progress();

// ─── Core reactive function ───────────────────────────────────────────────────
function _syncFromState(newState, oldState) {
  if (!_model) return;

  const prev = oldState ?? {};
  _config = newState;
  C = getConstants('doors', _config.profileMaterial, _config.profileModel);

  const categoryChanged = newState.productCategory !== prev.productCategory;

  if (newState.productCategory !== 'doors') {
    if (categoryChanged) _leaf.detach();
    return;
  }

  if (categoryChanged) {
    _leaf.invalidateZCache();
    _applyVisibility();
    _leaf.buildHardware();
    _handleWidth();
    _handleHeight();
    _leaf.placeItems();
    _leaf.applyColors();
    requestRender();
    return;
  }

  const profileChanged =
    !oldState ||
    newState.profileMaterial !== prev.profileMaterial ||
    newState.profileModel !== prev.profileModel;

  const dimensionsChanged =
    !oldState ||
    newState.frameWidth !== prev.frameWidth ||
    newState.frameHeight !== prev.frameHeight;

  if (profileChanged || dimensionsChanged) _leaf.invalidateZCache();

  if (!_leaf.hasPivot()) _leaf.buildHardware();

  _handleWidth();
  _handleHeight();

  // While the leaf is swinging, only the hinge bodies may be repositioned —
  // placeItems would also move the handles, which the pivot group owns.
  _leaf.hasPivot() ? _leaf.placeHinges() : _leaf.placeItems();

  _applyVisibility();

  const colorsChanged =
    !oldState ||
    newState.colorExterior !== prev.colorExterior ||
    newState.colorInterior !== prev.colorInterior ||
    newState.colorPVC !== prev.colorPVC;

  if (colorsChanged) _leaf.applyColors();

  const doorToggled = !oldState || newState.isDoorOpen !== prev.isDoorOpen;
  const leafChanged =
    !oldState ||
    newState.profileMaterial !== prev.profileMaterial ||
    newState.profileModel !== prev.profileModel ||
    newState.designType !== prev.designType ||
    newState.handleOutside !== prev.handleOutside ||
    newState.handleInside !== prev.handleInside ||
    newState.hingeType !== prev.hingeType ||
    newState.openSide !== prev.openSide ||
    newState.view !== prev.view ||
    newState.frameWidth !== prev.frameWidth ||
    newState.frameHeight !== prev.frameHeight ||
    newState.hasPost !== prev.hasPost ||
    newState.hasVent !== prev.hasVent;

  if (leafChanged && _leaf.progress() > 0) _leaf.rebuildPivotAtCurrentAngle();

  if (doorToggled) {
    newState.isDoorOpen ? _leaf.open() : _leaf.close();
  }

  requestRender();
}

// ─── Cache ────────────────────────────────────────────────────────────────────

// Reassigns the materials the GLB got wrong, reusing the instance the rest of
// the model already shares. Runs before anything reads or clones them.
function _repairDesignMaterials(model) {
  const byName = new Map();
  model.traverse(obj => {
    if (!obj.isMesh) return;
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
    materials.forEach(mat => {
      if (mat && !byName.has(mat.name)) byName.set(mat.name, mat);
    });
  });

  Object.entries(DESIGN_MATERIAL_FIXES).forEach(([nodeName, materialName]) => {
    const node = _originals[nodeName];
    const material = byName.get(materialName);

    if (!node || !material) {
      console.warn(`[DoorController] Cannot repair "${nodeName}" → "${materialName}"`);
      return;
    }

    node.traverse(child => {
      if (child.isMesh && !Array.isArray(child.material)) child.material = material;
    });
  });
}

// ─── Dimensions ───────────────────────────────────────────────────────────────

function _handleWidth() {
  const { profileMaterial, profileModel, frameWidthRaw } = _config

  const hasModel = profileMaterial === 'alum' ? '' : `${profileModel}_`
  const doorFrameWidth = interpolateValue(frameWidthRaw, C.frameMinWidth, C.frameMaxWidth);

  changeGlobalMorph('width', doorFrameWidth);
  changeGlobalMorph(`${profileMaterial}_door_width`, doorFrameWidth);
  changeGlobalMorph(`${profileMaterial}_${hasModel}door_width`, doorFrameWidth);
  changeGlobalMorph(`${profileMaterial}_${hasModel}door_frame_width`, doorFrameWidth);
}

function _handleHeight() {
  const { profileMaterial, profileModel, frameHeightRaw } = _config

  const hasModel = profileMaterial === 'alum' ? '' : `${profileModel}_`
  const doorFrameHeight = interpolateValue(frameHeightRaw, C.frameMinHeight, C.frameMaxHeight);

  changeGlobalMorph('height', doorFrameHeight);
  changeGlobalMorph(`${profileMaterial}_door_height`, doorFrameHeight);
  changeGlobalMorph(`${profileMaterial}_${hasModel}door_height`, doorFrameHeight);
  changeGlobalMorph(`${profileMaterial}_${hasModel}door_frame_height`, doorFrameHeight);
}

// ─── Visibility ───────────────────────────────────────────────────────────────

function _applyVisibility() {
  _applyDoor();
  _applyDesign();
  _applyPost();
  _applyVent();
}

function _applyDoor() {
  const { profileMaterial, profileModel, profileOffset } = _config;

  _leaf.hideMatching(n => n.endsWith('_door') || n.includes('_door_frame_'));

  const doorKey = profileMaterial === 'alum'
    ? `alum_door`
    : `${profileMaterial}_${profileModel}_door`;

  const frameKey = profileMaterial === 'alum'
    ? `alum_door_frame_${profileOffset}`
    : `${profileMaterial}_${profileModel}_door_frame_${profileOffset}`;

  _leaf.show(doorKey, true);
  _leaf.show(frameKey, true);
}

function _applyDesign() {
  const { profileMaterial, designType, designGlassType, hasWindowFrame } = _config;

  // Design parts are flat siblings in the GLB, so hiding the whole family once
  // clears the previous design's glass and frame along with its panel.
  _leaf.hideMatching(n => n.includes('_door_design_'));

  _leaf.show(`${profileMaterial}_door_design_${designType}`, true);

  if (designSupportsGlass(designType)) {
    _showAliased(`${profileMaterial}_door_design_${designType}_glass_${designGlassType}`);
  }

  if (hasWindowFrame && designSupportsWindowFrame(designType)) {
    _leaf.show(`${profileMaterial}_door_design_${designType}_wind_frame`, true);
  }
}

// Falls back to a known-misnamed node so a modelling defect degrades to the
// right geometry instead of nothing. See DESIGN_NODE_ALIASES.
function _showAliased(name) {
  const alias = DESIGN_NODE_ALIASES[name];
  _leaf.show(_originals[name] || !alias ? name : alias, true);
}

function _applyPost() {
  _leaf.show('post', false);
  if (!_config.hasPost) return;
  _leaf.show('post', true);
}

function _applyVent() {
  _leaf.show('air_vent', false);
  if (!_config.hasVent) return;
  _leaf.show('air_vent', true);
}
