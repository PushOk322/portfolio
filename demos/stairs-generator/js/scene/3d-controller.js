'use strict';

import * as THREE from 'three';

import { solveStairs } from '../core/stairs-layout.js';
import { PIECE_MORPH_OVERREACH, PIECE_MORPH_RANGES, PIECE_TYPES, loadPieceLibrary } from './piece-library.js';
import { changeObjectMorph, toMorphInfluence } from '../core/morph-system.js';
import { addToScene, fitCameraToObject, requestDelayedRender } from './3d-scene.js';

//#region Module state

let prototypes = null;
let root = null;
let cameraFitted = false;

const pools = {};
const active = {};

//#endregion

//#region Instance pool

// Instances are pooled rather than disposed: geometry and material are shared with the
// prototype, so a clone costs only a transform and its own morphTargetInfluences array.
function initPools() {
  for (const type of PIECE_TYPES) {
    pools[type] = [];
    active[type] = [];
  }
}

// Parenting to `root` (not a `visible` flag) is what marks an instance active.
// Box3.expandByObject ignores `visible`, so a hidden-but-parented instance would
// corrupt the camera fit — see fitCameraToObject's caller in applyState.
function acquire(type) {
  const pooled = pools[type].pop();

  if (pooled) {
    root.add(pooled);
    active[type].push(pooled);
    return pooled;
  }

  const instance = prototypes[type].clone();
  root.add(instance);
  active[type].push(instance);
  return instance;
}

function releaseAll() {
  for (const type of PIECE_TYPES) {
    for (const instance of active[type]) {
      instance.removeFromParent();
      pools[type].push(instance);
    }

    active[type].length = 0;
  }
}

//#endregion

//#region Shapekey application

function applyShapekeys(instance, piece) {
  if (!piece.shapekeys) return;

  const ranges = PIECE_MORPH_RANGES[piece.type];
  const overreach = PIECE_MORPH_OVERREACH[piece.type];

  for (const [key, value] of Object.entries(piece.shapekeys)) {
    const range = ranges[key];
    if (!range) continue;

    // A key listed in PIECE_MORPH_OVERREACH may extrapolate past influence 1; the ceiling
    // is that reach expressed as an influence, so both ends of the mapping stay in metres.
    const limit = overreach?.[key];
    const ceiling = limit === undefined ? 1 : toMorphInfluence(limit, range[0], range[1], Infinity);

    changeObjectMorph(instance, key, toMorphInfluence(value, range[0], range[1], ceiling));
  }
}

//#endregion

//#region Layout application

export function applyState(state) {
  const layout = solveStairs(state);

  releaseAll();

  for (const piece of layout.pieces) {
    const instance = acquire(piece.type);

    instance.position.fromArray(piece.position);
    instance.rotation.fromArray(piece.rotation);
    instance.scale.fromArray(piece.scale ?? [1, 1, 1]);
    applyShapekeys(instance, piece);
  }

  // Once only. Re-fitting on every state change re-framed the view on every slider tick,
  // which hides the thing the slider is doing — the stair has to visibly grow and shrink.
  // The canvas ResizeObserver still refits, against the object latched by this first call.
  if (!cameraFitted) {
    fitCameraToObject(root);
    cameraFitted = true;
  }
  requestDelayedRender();
  return layout;
}

//#endregion

//#region Railing (reserved)

// layout.railingPath is already emitted by the solver; consume it here when railings land.

//#endregion

//#region AR

// The assembled staircase. ar-controller clones and exports this to a GLB for model-viewer;
// a getter rather than a live export keeps the THREE/GLTFExporter dependency out of the
// solver path and lets AR stay lazy-loaded.
export function getStaircaseRoot() {
  return root;
}

//#endregion

//#region Lifecycle

export async function init3DController(stateManager) {
  prototypes = await loadPieceLibrary();
  initPools();

  root = new THREE.Group();
  root.name = 'staircase';
  addToScene(root);

  applyState(stateManager.getAll());
  stateManager.subscribe(applyState);
}

//#endregion
