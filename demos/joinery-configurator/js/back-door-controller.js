'use strict';

import { requestRender } from './3d-scene.js';
import { interpolateValue, changeGlobalMorph } from './system/morphSystem.js';
import { subscribe, getCurrentState } from './state-manager.js';
import { getConstants } from './product-constants.js';
import { createDoorLeaf } from './door-leaf.js';
import {
  leafNode, resolveBackDoorNode, BACK_DOOR_MORPH_SUFFIXES,
} from './back-door-designs.js';

let _model = null;
let _config = {};
let C = getConstants('backDoors', 'pvc', '70');

function _prefix() {
  const { profileMaterial, profileModel } = _config;
  return profileMaterial === 'alum' ? 'alum_' : `${profileMaterial}_${profileModel}_`;
}

const _leaf = createDoorLeaf({
  getConfig: () => _config,
  getConstants: () => C,
  keys: () => {
    const prefix = _prefix();
    const leaf = leafNode(_config.backDoorDesignType, _config.hasTransomLight);
    // This GLB ships one aluminium hinge model, so the slot is always `1_` —
    // not `${hingeType}_` as front doors build it. hingeType 2 has no node
    // here, and BACK_DOOR_HINGE_TYPES is what keeps it from being asked for.
    const hingeSlot = _config.profileMaterial === 'alum' ? '1_' : '';

    return {
      leaf: resolveBackDoorNode(`${prefix}door_${leaf}_back`),
      hingeBody: resolveBackDoorNode(`${prefix}door_back_hinge_${hingeSlot}frame`),
      hingeMove: resolveBackDoorNode(`${prefix}door_back_hinge_${hingeSlot}move`),
      handleOutside: _config.handleOutside === 'none'
        ? null : `outside_handle_${_config.handleOutside}`,
      handleInside: _config.handleInside === 'none'
        ? null : `inside_handle_frame_${_config.handleInside}`,
    };
  },
  // The frame stays put; only the leaf and its hardware swing.
  leafObjects: () => [],
});

// Alum frames ship a `_zonder` suffix and pvc frames ship none. Trying the
// suffixed name first covers both today and absorbs a re-export that adds the
// suffix to pvc, with no per-material branch.
function _frameKey(base) {
  const withOffset = `${base}_${_config.profileOffset}`;
  return _leaf.originals[withOffset] ? withOffset : base;
}

// The GLB is loaded and unloaded on demand (see model-manager.js), so init runs
// once per model while the state subscription must only ever be added once.
let _subscribed = false;

export function initBackDoorController(model) {
  _model = model;

  _leaf.attach(model);
  _leaf.hideAll();

  _syncFromState(getCurrentState(), null);

  _leaf.buildHardware();

  if (_subscribed) return;

  subscribe((newState, oldState) => _syncFromState(newState, oldState));
  _subscribed = true;
}

export function detachBackDoorController() {
  _leaf.detach();
  _model = null;
}

function _syncFromState(newState, oldState) {
  if (!_model) return;

  const prev = oldState ?? {};
  _config = newState;
  C = getConstants('backDoors', _config.profileMaterial, _config.profileModel);

  const categoryChanged = newState.productCategory !== prev.productCategory;

  if (newState.productCategory !== 'backDoors') {
    if (categoryChanged) _leaf.detach();
    return;
  }

  if (categoryChanged) {
    _leaf.invalidateZCache();
    _applyVisibility();
    _leaf.buildHardware();
    _applyWidth();
    _applyHeight();
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

  _applyWidth();
  _applyHeight();

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

  const leafChanged =
    !oldState ||
    profileChanged ||
    dimensionsChanged ||
    newState.backDoorDesignType !== prev.backDoorDesignType ||
    newState.hasTransomLight !== prev.hasTransomLight ||
    newState.handleOutside !== prev.handleOutside ||
    newState.handleInside !== prev.handleInside ||
    newState.hingeType !== prev.hingeType ||
    newState.openSide !== prev.openSide ||
    newState.view !== prev.view;

  if (leafChanged && _leaf.progress() > 0) _leaf.rebuildPivotAtCurrentAngle();

  if (!oldState || newState.isDoorOpen !== prev.isDoorOpen) {
    newState.isDoorOpen ? _leaf.open() : _leaf.close();
  }

  requestRender();
}

// ─── Dimensions ───────────────────────────────────────────────────────────────

// All four names get the same normalised value: leaf and frame deform by the
// same delta over the same interval, and writing every name also covers the
// swapped pvc_120 window pair, whose nodes carry each other's morph names.
function _applyMorph(kind, value) {
  const prefix = _prefix();
  BACK_DOOR_MORPH_SUFFIXES
    .filter(suffix => suffix.endsWith(kind))
    .forEach(suffix => changeGlobalMorph(`${prefix}${suffix}`, value));
}

function _applyWidth() {
  const value = interpolateValue(_config.frameWidthRaw, C.frameMinWidth, C.frameMaxWidth);
  _applyMorph('width', value);
}

function _applyHeight() {
  const value = interpolateValue(_config.frameHeightRaw, C.frameMinHeight, C.frameMaxHeight);
  _applyMorph('height', value);
}

// ─── Visibility ───────────────────────────────────────────────────────────────

// Leaf and frame always come from the same variant. The bovenlicht ships its
// own pair, authored to a different height-morph delta than the design pair, so
// taking the taller frame without its leaf loses the head rebate entirely.
function _applyVisibility() {
  const prefix = _prefix();
  const variant = leafNode(_config.backDoorDesignType, _config.hasTransomLight);

  // The three variants are flat siblings, so clearing the whole family once
  // drops the previous variant's leaf and frame together.
  _leaf.hideMatching(n => n.includes('_back'));

  _leaf.show(resolveBackDoorNode(`${prefix}door_${variant}_back`), true);
  _leaf.show(_frameKey(resolveBackDoorNode(`${prefix}door_${variant}_back_frame`)), true);
}
