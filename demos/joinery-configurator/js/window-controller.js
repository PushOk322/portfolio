'use strict';
import * as THREE from 'three';
import { requestRender, camera, controls } from './3d-scene.js';
import { changeObjectMorph, interpolateValue } from './system/morphSystem.js';
import { subscribe, getCurrentState } from './state-manager.js';
import { getConstants } from './product-constants.js';

// ─── Constants ────────────────────────────────────────────────────────────────

// ─── Module state ─────────────────────────────────────────────────────────────

let _model = null;
let _config = {};

// Original template objects — never made visible, cloned from only.
const _originals = {};

// Single frame clone for the whole window (one regardless of section count).
let _frame = null;

// Shared divider clones — mullions (vertical) and transoms (horizontal).
// Built from layout, not owned by any section.
// [ { type: 'mullion'|'transom', clone: THREE.Object3D }, ... ]
let _dividers = [];

// Per-section data, keyed by section index.
// {
//   def:    sectionDef from state,
//   panel:  THREE.Object3D | null,  — sash (openable) or fixed panel clone
//   hinges: [ { frame, move, tag }, ... ],
//   handle: THREE.Object3D | null,
//   pivot:  THREE.Group    | null,
//   anim:   { progress, target, startProgress, startTime, rafId, mode },
// }
const _sections = {};

// ─── Excluded names ───────────────────────────────────────────────────────────

const EXCLUDED_NAMES = [
  /^Cube(_?\d+)?$/,
  /^Plane(_?\d+)?$/,
  /^Cylinder(_?\d+)?$/,
  /^BezierCurve(_?\d+)?$/,
  'Scene_Root',
  'Default_Light',
];

// ─── Init ─────────────────────────────────────────────────────────────────────

// The window GLB is loaded and unloaded on demand (see model-manager.js), so
// init runs once per model while the subscription must only ever be added once.
let _subscribed = false;

export function initWindowController(model) {
  _model = model;

  _resetCaches();
  _cacheOriginals(model);

  // All originals stay hidden — windows always render via clones.
  Object.values(_originals).forEach(obj => {
    if (obj.name === 'Scene') return;
    obj.visible = false;
  });

  _syncFromState(getCurrentState(), null);

  if (_subscribed) return;

  subscribe((newState, oldState) => {
    _syncFromState(newState, oldState);
  });
  _subscribed = true;
}

/**
 * Releases the window model. The GLB itself is kept by model-manager.js for
 * reuse — this only drops what was cloned from it. Safe to call twice.
 */
export function detachWindowController() {
  _tearDownAll();
  _model = null;
}

function _resetCaches() {
  Object.keys(_originals).forEach(k => delete _originals[k]);
  Object.keys(_sections).forEach(k => delete _sections[k]);
  _frame = null;
  _dividers = [];
}

// ─── Reactive core ────────────────────────────────────────────────────────────

function _syncFromState(newState, oldState) {
  if (!_model) return;


  const prev = oldState ?? {};
  _config = newState;
  C = getConstants('windows', _config.profileMaterial, _config.profileModel);

  const categoryChanged = newState.productCategory !== prev.productCategory;

  if (newState.productCategory !== 'windows') {
    if (categoryChanged) { _tearDownAll(); _updateCameraTarget(); }
    return;
  }

  if (categoryChanged) {
    _rebuildAll();
    _updateCameraTarget();
    requestRender();
    return;
  }

  const profileChanged =
    newState.profileMaterial !== prev.profileMaterial ||
    newState.profileModel !== prev.profileModel;

  const layoutChanged = !_sameLayout(newState.layout, prev.layout);

  const dimensionsChanged =
    newState.frameWidth !== prev.frameWidth ||
    newState.frameHeight !== prev.frameHeight;

  const colorsChanged =
    newState.colorExterior !== prev.colorExterior ||
    newState.colorInterior !== prev.colorInterior ||
    newState.colorPVC !== prev.colorPVC;

  // Compared by value, not reference: the integration layer builds a fresh
  // sections array on every applyConfiguration(), and a reference check would
  // force a full rebuild on every frame of a slider drag.
  const openingTypesChanged = !_sameSections(newState.sections, prev.sections);

  if (profileChanged || layoutChanged) {
    _rebuildAll();
    requestRender();
    return;
  }

  if (dimensionsChanged) {
    // Snap all open sections closed before repositioning.
    Object.values(_sections).forEach(sec => {
      _cancelAnim(sec.anim);
      _dissolvePivot(sec);
      sec.anim.progress = 0;
      sec.anim.target = 0;
      sec.anim.mode = null;
    });
    _handleWidth();
    _handleHeight();
    _placeSections();

    _updateCameraTarget();
  }

  if (colorsChanged) {
    _applyColors();
  }

  if (openingTypesChanged) {
    // Full rebuild because clones differ per openingType (sash vs fixed panel,
    // hinges present or absent). Incremental handling can be added later if needed.
    _rebuildAll();
  }

  requestRender();
}

// ─── Tear down ────────────────────────────────────────────────────────────────

function _tearDownAll() {

  // Sections first — they may own pivots with attached children.
  Object.keys(_sections).forEach(_tearDownSection);

  // Frame
  _frame?.parent?.remove(_frame);
  _frame = null;

  // Dividers
  _dividers.forEach(d => d.clone?.parent?.remove(d.clone));
  _dividers = [];
}

function _tearDownSection(idx) {
  const sec = _sections[idx];
  if (!sec) return;

  _cancelAnim(sec.anim);
  _dissolvePivot(sec);

  sec.panel?.parent?.remove(sec.panel);
  sec.handle?.parent?.remove(sec.handle);
  sec.hinges.forEach(h => {
    h.frame?.parent?.remove(h.frame);
    h.move?.parent?.remove(h.move);
  });

  delete _sections[idx];
}

// ─── Full rebuild ─────────────────────────────────────────────────────────────

function _rebuildAll() {
  _tearDownAll();
  if (_config.productCategory !== 'windows') return;

  _buildFrame();
  _buildDividers();
  _config.sections.forEach(_buildSection);

  _handleWidth();
  _handleHeight();

  _placeSections();
  _applyColors();
}

// ─── Frame ────────────────────────────────────────────────────────────────────
// One frame spans the entire window regardless of section count.

function _buildFrame() {
  _frame = _cloneTemplate(_frameKey());
  if (!_frame) return;
  _frame.name = '__win_frame';

  // Apply current dimensions immediately on the fresh clone
  const p = _shapekeyPrefix();
  changeObjectMorph(_frame, `${p}window_frame_width`, _config.frameWidth);
  changeObjectMorph(_frame, `${p}window_frame_height`, _config.frameHeight);
}

// ─── Dividers ─────────────────────────────────────────────────────────────────
// Mullions = vertical dividers (separate left/right sections).
// Transoms = horizontal dividers (separate top/bottom sections).
// Count is derived purely from the layout preset.

function _buildDividers() {
  const { mullions, transoms } = _dividerCounts(_config.layout);

  for (let i = 0; i < mullions; i++) {
    const clone = _cloneTemplate(_mullionKey());
    if (clone) clone.name = `__win_mullion_${i}`;
    _dividers.push({ type: 'mullion', clone });
  }

  for (let i = 0; i < transoms; i++) {
    const clone = _cloneTemplate(_transomKey());
    if (clone) clone.name = `__win_transom_${i}`;
    _dividers.push({ type: 'transom', clone });
  }
}

// Mullions are the vertical gaps between columns, transoms the horizontal gaps
// between rows. A mullionless layout (French rebate) has the sashes meet
// directly, so it needs no vertical divider at all.
function _dividerCounts({ columns = 1, rows = 1, mullionless = false } = {}) {
  return {
    mullions: mullionless ? 0 : Math.max(0, columns - 1),
    transoms: Math.max(0, rows - 1),
  };
}

function _sameLayout(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.columns === b.columns && a.rows === b.rows &&
    a.transom === b.transom && a.mullionless === b.mullionless &&
    a.shape === b.shape;
}

function _sameSections(a, b) {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;

  return a.every((s, i) => {
    const o = b[i];
    return s.index === o.index && s.row === o.row && s.col === o.col &&
      (s.colSpan ?? 1) === (o.colSpan ?? 1) && s.openingType === o.openingType;
  });
}

// ─── Section builder ──────────────────────────────────────────────────────────
// Each section gets one panel clone (sash or fixed panel).
// Openable sections also get hinges and a handle.
// Fixed sections get neither.

function _buildSection(sectionDef) {
  const idx = sectionDef.index;
  const isFixed = sectionDef.openingType === 'fixed';

  const sec = {
    def: sectionDef,
    panel: null,
    hinges: [],
    handle: null,
    pivot: null,
    anim: _makeAnimState(),
  };

  _sections[idx] = sec;

  if (isFixed) {
    sec.panel = _cloneTemplate(_fixedPanelKey());
    if (sec.panel) sec.panel.name = `__win_fixed_${idx}`;
    // No hinges, no handle for fixed sections.
    return;
  }

  // Openable section.
  sec.panel = _cloneTemplate(_sashKey());
  if (sec.panel) sec.panel.name = `__win_sash_${idx}`;

  sec.handle = _cloneTemplate(_handleKey());
  if (sec.handle) sec.handle.name = `__win_handle_${idx}`;

  _createHingesForSection(sec);
}

// ─── Hinges ───────────────────────────────────────────────────────────────────
// All openable types use the same hinge pair templates, but tilt-only sections
// place that pair across the bottom edge instead of on one vertical side.

function _createHingesForSection(sec) {
  sec.hinges = [];

  const { profileMaterial } = _config;
  const prefix = `${profileMaterial}_`

  // 'dowm' typo is intentional — matches the model object name.
  const tpls = {
    frameDown: _originals[`${prefix}window_hinge_frame_down`]
      ?? _originals[`${prefix}window_hinge_frame_dowm`],
    moveDown: _originals[`${prefix}window_hinge_move_down`],
    frameUp: _originals[`${prefix}window_hinge_frame_up`],
    moveUp: _originals[`${prefix}window_hinge_move_up`],
  };

  [
    { frameTpl: tpls.frameDown, moveTpl: tpls.moveDown, tag: 'down' },
    { frameTpl: tpls.frameUp, moveTpl: tpls.moveUp, tag: 'up' },
  ].forEach(({ frameTpl, moveTpl, tag }) => {
    if (!frameTpl) {
      console.warn(`[WindowController] Hinge frame not found for prefix "${prefix}" tag "${tag}"`);
    }

    const frameClone = frameTpl ? _cloneOf(frameTpl) : null;
    const moveClone = moveTpl ? _cloneOf(moveTpl) : null;

    if (frameClone) frameClone.name = `__win_hinge_frame_${sec.def.index}_${tag}`;
    if (moveClone) moveClone.name = `__win_hinge_move_${sec.def.index}_${tag}`;

    sec.hinges.push({ frame: frameClone, move: moveClone, tag });
  });
}

// ─── Key resolvers ────────────────────────────────────────────────────────────

function _prefix() {
  const { profileMaterial, profileModel } = _config;
  // Alum currently only has the 70 series for windows.
  return profileMaterial === 'pvc'
    ? `${profileMaterial}_${profileModel}_`
    : `${profileMaterial}_70_`;
}

function _shapekeyPrefix() {
  const { profileMaterial, profileModel } = _config;
  // Alum currently only has the 70 series for windows.
  return profileMaterial === 'pvc'
    ? `${profileMaterial}_${profileModel}_`
    : `${profileMaterial}_`;
}

// One frame for the whole window.
function _frameKey() {
  return `${_prefix()}window_frame_${_config.profileOffset}`;
}

// Openable sash.
function _sashKey() {
  return `${_prefix()}window`;
}

// Fixed panel.
function _fixedPanelKey() {
  return `${_prefix()}window_fix`;
}

// Vertical divider.
function _mullionKey() {
  return `${_prefix()}window_mullion`;
}

// Horizontal divider.
function _transomKey() {
  return `${_prefix()}window_transom`;
}

function _dividerMorphKey(dividerType, dimension) {
  return `${_prefix()}window_${dividerType}_${dimension}`;
}

// Handle (alum_cover_plate contains the handle as a child object).
function _handleKey() {
  return `${_config.profileMaterial}_window_cover_plate`;
}

// ─── Placement (stub) ─────────────────────────────────────────────────────────
// TODO: implement per-role offset + per-section morph values.

function _placeSections() {
  const layout = _computeLayout();
  const sections = _config.sections;



  // ── Frame ────────────────────────────────────────────────────────────────
  // Frame origin is scene 0,0,0 — no positioning needed.

  // ── Dividers ─────────────────────────────────────────────────────────────
  const mullions = _dividers.filter(d => d.type === 'mullion');
  const transoms = _dividers.filter(d => d.type === 'transom');

  mullions.forEach((d, i) => {
    if (!d.clone) return;
    d.clone.position.x = layout.mullionX[i];
    d.clone.scale.x = 1.02;
    // d.clone.position.z = -0.1;
    d.clone.position.y = layout.mullionY[0];
  });

  transoms.forEach((d, i) => {
    if (!d.clone) return;
    d.clone.position.x = 0;
    // d.clone.position.z = -0.1;
    d.clone.position.y = layout.transomY[i];
  });

  // ── Sections ─────────────────────────────────────────────────────────────
  sections.forEach(sectionDef => {
    const sec = _sections[sectionDef.index];
    const slot = layout.slots[sectionDef.index];
    if (!sec || !slot) return;

    // Cache slot on section so animation pivot builder can use it without
    // recomputing the full layout.
    sec.slot = slot;

    // Panel (sash or fixed)
    if (sec.panel) {
      sec.panel.position.x = slot.cx;
      sec.panel.position.y = slot.cy;
      // sec.panel.position.z = 0.1;

    }

    // Handle
    if (sec.handle) {
      const ot = sectionDef.openingType;
      // sec.handle.position.z = 0.3;

      const bbox = new THREE.Box3().setFromObject(sec.handle);
      const handleHeight = bbox.max.y - bbox.min.y;

      if (sec.panel) {
        const panelBbox = new THREE.Box3().setFromObject(sec.panel);
        sec.handle.position.z = panelBbox.max.z;   // front face of the panel
      } else {
        sec.handle.position.z = 0.12; // fallback
      }

      if (ot === 'tilt') {
        sec.handle.position.x = slot.cx;
        sec.handle.position.y = slot.cy + slot.h - C.handleInset * 1.5 + (C.tiltOnlyHandleYOffset ?? 0);
        sec.handle.rotation.z = Math.PI / 2;
      } else if (ot === 'turn_left' || ot === 'tilt_turn_left') {
        sec.handle.position.x = slot.cx + slot.w / 2 - C.handleInset;
        sec.handle.position.y = slot.cy + slot.h / 2 + handleHeight / 2;
      } else if (ot === 'turn_right' || ot === 'tilt_turn_right') {
        sec.handle.position.x = slot.cx - slot.w / 2 + C.handleInset;
        sec.handle.position.y = slot.cy + slot.h / 2 + handleHeight / 2;
      }
    }

    // Hinges
    sec.hinges.forEach(({ frame, move, tag }) => {
      if (!frame || !move) return;

      const bbox = new THREE.Box3().setFromObject(frame);

      if (bbox.isEmpty()) {
        console.warn("Hinge frame has no geometry yet.");
      }

      const hingeHeight = bbox.max.y - bbox.min.y;

      const placement = _getHingePlacement(sectionDef, slot, tag, hingeHeight);
      _placeHingePair(frame, move, placement);
    });
  });
}

// ─── Dimensions ───────────────────────────────────────────────────────────────
// Frame uses the global morph (0-1 mapped from raw meters).
// Per-section panels and dividers use changeObjectMorph with computed values
// derived from how much of the inner opening each slot occupies.

function _handleWidth() {
  // Recomputed from raw metres rather than read from _config.frameWidth: both
  // are the same normalisation, and doing it here keeps the frame morph tied to
  // the same C ranges as the panel morphs below.
  const { frameWidthRaw } = _config;
  const p = _prefix();

  if (_frame) {
    changeObjectMorph(_frame, `${p}window_frame_width`, interpolateValue(frameWidthRaw, C.frameMinWidth, C.frameMaxWidth));
  }

  // Per-section panel morphs
  const layout = _computeLayout();
  _config.sections.forEach(sectionDef => {
    const sec = _sections[sectionDef.index];
    const slot = layout.slots[sectionDef.index];
    if (!sec?.panel || !slot) return;
    const morphW = interpolateValue(slot.w + C.windowSlotExpand, C.windowMinWidth, C.windowMaxWidth);
    const morphWFix = interpolateValue(
      slot.w + C.windowFixMixSlotExpand,
      C.fixMixWindowMinWidth,
      C.fixMixWindowMaxWidth
    );

    if (sectionDef.openingType === 'fixed') {
      changeObjectMorph(sec.panel, `${p}window_fix_width`, morphWFix);
    } else {
      changeObjectMorph(sec.panel, `${p}window_width`, morphW);
    }
  });

  // Mullion height morph — mullions span the full inner height, no width morph needed
  // Transom width morph — transoms span the full inner width
  const innerW = frameWidthRaw - C.frameEdgeWidth * 2;
  const transomMorphW = _toMorphW(innerW);
  _dividers.filter(d => d.type === 'transom').forEach(d => {
    if (!d.clone) return;
    changeObjectMorph(d.clone, _dividerMorphKey('transom', 'width'), transomMorphW);
  });
}

function _handleHeight() {
  const { frameHeightRaw } = _config;
  const p = _prefix();

  if (_frame) {
    changeObjectMorph(_frame, `${p}window_frame_height`, interpolateValue(frameHeightRaw, C.frameMinHeight, C.frameMaxHeight));
  }


  // Per-section panel morphs
  const layout = _computeLayout();
  _config.sections.forEach(sectionDef => {
    const sec = _sections[sectionDef.index];
    const slot = layout.slots[sectionDef.index];
    if (!sec?.panel || !slot) return;

    const morphH = interpolateValue(slot.h + C.windowOffsetH, C.windowMinHeight, C.windowMaxHeight);
    const morphHFix = interpolateValue(
      slot.h + C.windowFixMixSlotExpandY,
      C.fixMixWindowMinHeight,
      C.fixMixWindowMaxHeight
    );

    if (sectionDef.openingType === 'fixed') {
      changeObjectMorph(sec.panel, `${p}window_fix_height`, morphHFix);
    } else {
      changeObjectMorph(sec.panel, `${p}window_height`, morphH);
    }
  });

  // Mullion height morph — mullions span the full inner height
  const mullionMorphH = interpolateValue(layout.rowH + C.mullionOffsetH, C.mullionMinHeight, C.mullionMaxHeight);
  // const mullionMorphH = 1;
  _dividers.filter(d => d.type === 'mullion').forEach(d => {
    if (!d.clone) return;
    changeObjectMorph(d.clone, _dividerMorphKey('mullion', 'height'), mullionMorphH);
  });
}

// ─── Colors ───────────────────────────────────────────────────────────────────
// Walks frame, dividers, and all section clones.
// Originals are never touched here.

function _applyColors() {
  if (!_model) return;
  const { colorExterior, colorInterior, colorPVC } = _config;

  const allObjects = [
    _frame,
    ..._dividers.map(d => d.clone),
    ...Object.values(_sections).flatMap(sec => [
      sec.panel,
      sec.handle,
      ...sec.hinges.flatMap(h => [h.frame, h.move]),
    ]),
  ].filter(Boolean);

  allObjects.forEach(obj => {
    obj.traverse(node => {
      if (!node.isMesh) return;
      const mats = Array.isArray(node.material) ? node.material : [node.material];
      mats.forEach((mat, i) => {
        if (!mat) return;
        const target =
          mat.name === 'color_outside' ? colorExterior :
            mat.name === 'color_inside' ? colorInterior :
              mat.name === 'uPVC' ? colorPVC : null;
        if (!target) return;
        if (!mat.userData.materialCloned) {
          const c = mat.clone();
          c.userData.materialCloned = true;
          c.color.set(target);
          if (Array.isArray(node.material)) node.material[i] = c;
          else node.material = c;
        } else {
          const live = Array.isArray(node.material) ? node.material[i] : node.material;
          live.color.set(target);
        }
      });
    });
  });
}

// ─── Animation ────────────────────────────────────────────────────────────────
// tiltSection / turnSection are the public API, called by ui-controller.
// Fixed sections are silently ignored.
// The two modes (tilt / turn) are independent instruments —
// mode management (e.g. "close tilt before turning") lives in ui-controller.

function _makeAnimState() {
  return { progress: 0, target: 0, startProgress: 0, startTime: 0, rafId: null, mode: null };
}

function _cancelAnim(anim) {
  if (anim?.rafId) cancelAnimationFrame(anim.rafId);
}

export function tiltSection(sectionIndex) {
  const sec = _sections[sectionIndex];
  if (!sec || !_canTilt(sec.def.openingType)) return;
  const target = sec.anim.mode === 'tilt' && sec.anim.target === 1 ? 0 : 1;
  _triggerAnim(sec, 'tilt', target);
}

export function turnSection(sectionIndex) {
  const sec = _sections[sectionIndex];
  if (!sec || sec.def.openingType === 'fixed') return;
  const canTurn = ['turn_left', 'turn_right', 'tilt_turn_left', 'tilt_turn_right']
    .includes(sec.def.openingType);
  if (!canTurn) return;
  const target = sec.anim.mode === 'turn' && sec.anim.target === 1 ? 0 : 1;
  _triggerAnim(sec, 'turn', target);
}

function _triggerAnim(sec, mode, target) {
  const anim = sec.anim;

  // Switching mode snaps the section closed before starting the new motion.
  if (anim.mode !== mode && anim.progress > 0) {
    _cancelAnim(anim);
    _dissolvePivot(sec);
    anim.progress = 0;
  }

  anim.mode = mode;

  // Build (or rebuild) the pivot whenever we start opening.
  // Also rebuild if mode just changed, since pivot position differs per mode.
  if (target === 1) _buildPivot(sec, mode);

  _startAnim(sec, target);
}

function _startAnim(sec, target) {
  const anim = sec.anim;
  if (anim.target === target) return;
  _cancelAnim(anim);
  anim.startTime = performance.now();
  anim.startProgress = anim.progress;
  anim.target = target;
  anim.rafId = requestAnimationFrame(now => _animTick(sec, now));
}

function _animTick(sec, now) {
  const anim = sec.anim;
  const raw = Math.min((now - anim.startTime) / C.animDuration, 1);
  anim.progress = anim.startProgress + (anim.target - anim.startProgress) * _easeInOut(raw);

  _applyAngle(sec);
  requestRender();

  if (raw < 1) {
    anim.rafId = requestAnimationFrame(n => _animTick(sec, n));
  } else {
    anim.rafId = null;
    if (anim.target === 0) _dissolvePivot(sec);
  }
}

function _applyAngle(sec) {
  if (!sec.pivot) return;
  const { mode, progress } = sec.anim;
  const ot = sec.def.openingType;

  if (mode === 'tilt') {
    const sashAngle = sec.effectiveTiltAngle ?? C.tiltAngle;
    sec.pivot.rotation.x = sashAngle * progress;

    // ── Hinge arm correction (Y rotation) ─────────────────────────────────
    if (sec.hingePivots?.length) {
      const tiltRad = sashAngle * progress;

      sec.hingePivots.forEach(hp => {
        if (!hp) return;

        hp.rotation.set(0, 0, 0);

        if (_isTiltOnly(ot)) {
          hp.rotation.x = tiltRad;
        } else {
          const hingeLength = hp.userData.hingeLength || (sec.slot?.h * 0.3);
          const sashHeight = sec.slot?.h || 1;
          const multiplier = Math.max(C.tiltTurnHingeAngleMultiplier ?? 1, sashHeight / (hingeLength * 2));

          const direction = hp.userData.hingeTag === 'up' ? 1 : -1;
          hp.rotation.y = direction * tiltRad * multiplier;
        }
      });
    }
  } else if (mode === 'turn') {
    sec.pivot.rotation.x = 0;
    const sign = (ot === 'turn_right' || ot === 'tilt_turn_right') ? 1 : -1;
    sec.pivot.rotation.y = sign * C.turnAngle * progress;
  }
}

// ─── Pivot ────────────────────────────────────────────────────────────────────

function _buildPivot(sec, mode) {
  _dissolvePivot(sec);

  const pivot = new THREE.Group();
  pivot.name = `__win_pivot_${sec.def.index}`;
  _model.updateWorldMatrix(true, true);
  pivot.position.copy(_getSashPivotPoint(sec, mode));
  _model.add(pivot);

  const attachToSash = mode === 'tilt'
    ? [sec.panel, sec.handle].filter(Boolean)
    : [sec.panel, sec.handle, ...sec.hinges.map(h => h.move)].filter(Boolean);

  attachToSash.forEach(obj => {
    obj.updateWorldMatrix(true, false);
    pivot.attach(obj);
  });

  sec.pivot = pivot;

  if (mode === 'tilt') {
    sec.effectiveTiltAngle = _getSectionTiltAngle(sec.def.openingType);

    sec.hingePivots = sec.hinges.map(({ move, tag }) => {
      if (!move) return null;

      const hp = new THREE.Group();
      hp.name = `__win_hinge_pivot_${sec.def.index}`;

      move.updateWorldMatrix(true, false);
      const wp = new THREE.Vector3();
      move.getWorldPosition(wp);
      hp.position.copy(wp);

      _model.add(hp);
      hp.attach(move);

      const bb = new THREE.Box3().setFromObject(move);
      hp.userData.hingeLength = _getLongestBoxSide(bb);
      hp.userData.hingeTag = tag;

      return hp;
    }).filter(Boolean);
  }
}

function _dissolvePivot(sec) {
  // Dissolve hinge sub-pivots first
  if (sec.hingePivots?.length) {
    sec.hingePivots.forEach(hp => {
      hp.rotation.set(0, 0, 0);
      hp.updateWorldMatrix(true, true);
      while (hp.children.length) {
        const child = hp.children[0];
        child.updateWorldMatrix(true, false);
        _model.attach(child);
      }
      hp.parent?.remove(hp);
    });
    sec.hingePivots = [];
  }

  if (!sec?.pivot) return;
  sec.pivot.rotation.set(0, 0, 0);
  sec.pivot.updateWorldMatrix(true, true);
  while (sec.pivot.children.length) {
    const child = sec.pivot.children[0];
    child.updateWorldMatrix(true, false);
    _model.attach(child);
  }
  sec.pivot.parent?.remove(sec.pivot);
  sec.pivot = null;
}

// ── Pivot offset constants ─────────────────────────────────────────────────
// Values are read from C (product-constants) so each material/model can be
// tuned independently. See product-constants.js → pivotZOffset etc.

function _getSashPivotPoint(sec, mode) {
  const slot = sec.slot;

  // Fallback: no slot cached yet (should not happen after _placeSections)
  if (!slot) {
    console.warn('[WindowController] _getSashPivotPoint called before slot was cached');
    return new THREE.Vector3(0, 0, 0);
  }

  // Z: front face of the sash panel
  let pivotZ = 0;
  const hingeMove = sec.hinges[0]?.move;
  if (hingeMove) {
    const wp = new THREE.Vector3();
    hingeMove.getWorldPosition(wp);
    pivotZ = wp.z;
  }
  pivotZ += C.pivotZOffset ?? 0;

  if (mode === 'tilt') {
    const x = slot.cx + (C.pivotXTilt ?? 0);
    const y = _isTiltOnly(sec.def.openingType)
      ? _getTiltOnlyHingeBaselineY(slot) + (C.pivotYTilt ?? 0)
      : slot.cy + (C.pivotYTilt ?? 0);
    return new THREE.Vector3(x, y, pivotZ);
  }

  // turn — axis runs vertically along the hinge-side edge.
  const ot = sec.def.openingType;
  const isRight = ot === 'turn_right' || ot === 'tilt_turn_right';

  const x = isRight
    ? slot.cx + slot.w / 2 + C.hingeEdgeOffset + (C.pivotXTurn ?? 0)
    : slot.cx - slot.w / 2 - C.hingeEdgeOffset - (C.pivotXTurn ?? 0);

  const y = slot.cy + (C.pivotYTurn ?? 0);
  return new THREE.Vector3(x, y, pivotZ);
}


export function toggleAllSections() {
  // If any openable section is open or animating toward open → close all.
  // Otherwise → open all.
  const openable = Object.values(_sections).filter(
    sec => sec.def.openingType !== 'fixed'
  );

  const anyOpen = openable.some(
    sec => sec.anim.target === 1
  );

  openable.forEach(sec => {
    const ot = sec.def.openingType;
    const mode = (ot === 'tilt') ? 'tilt' : 'turn';
    const target = anyOpen ? 0 : 1;
    _triggerAnim(sec, mode, target);
  });
}

export function toggleAllTiltSections() {
  const tiltable = Object.values(_sections).filter(
    sec => _canTilt(sec.def.openingType)
  );

  const anyOpen = tiltable.some(
    sec => sec.anim.mode === 'tilt' && sec.anim.target === 1
  );

  tiltable.forEach(sec => {
    const target = anyOpen ? 0 : 1;
    _triggerAnim(sec, 'tilt', target);
  });
}

// ─── Layout math ─────────────────────────────────────────────────────────────
// C is a shorthand alias for WINDOW_CONSTANTS to keep formulas readable.
let C = getConstants('windows', 'pvc', '70'); // will be overwritten on first sync

function _computeLayout() {
  const { frameWidthRaw, frameHeightRaw } = _config;
  const { columns: cols, rows } = _config.layout;

  const mullionXArr = [];

  function calcUniversalData(usesFixedPanelOffset) {
    const innerW = frameWidthRaw - C.frameEdgeWidth * 2;
    const innerH = frameHeightRaw - C.frameEdgeHeight * 2;
    // Left edge and bottom edge of the inner opening in scene coordinates.
    const innerLeft = -frameWidthRaw / 2 + C.frameEdgeWidth;
    const innerBottom = C.frameEdgeHeight;

    // ── Determine column and row counts from layout ───────────────────────────


    const innerHeight = frameHeightRaw - C.frameEdgeHeight * 2;

    // A mullionless pair (French rebate) has no divider between the sashes,
    // so there is no width to set aside for one — otherwise the columns are
    // sized around a mullion that never gets drawn and leave a gap.
    const mullionGap = _config.layout?.mullionless ? 0 : C.mullionWidth;
    const colW = (innerW - mullionGap * (cols - 1)) / cols;

    // Height available to the rows once the divider bars are taken out.
    const glazedHeight = innerHeight - C.transomHeight * (rows - 1);

    let rowH, topRowH;
    if (rows > 1 && _config.layout.transom) {
      // A bovenlicht is a fixed-height light, not a share of the window: it
      // stays the same depth whether it sits over one sash or four. Clamped so
      // a short frame cannot leave the rows below it with nothing.
      topRowH = Math.min(C.transomLightHeight, glazedHeight / rows);
      rowH = (glazedHeight - topRowH) / (rows - 1);
    } else {
      rowH = glazedHeight / rows;
      topRowH = rowH;
    }

    for (let i = 0; i < cols - 1; i++) {
      mullionXArr.push(innerLeft + colW * (i + 1) + mullionGap * i + mullionGap / 2);
    }

    // One bar per row boundary. Every row below the top has height rowH, so the
    // i-th boundary sits above i+1 of them plus the bars already passed.
    const transomYArr = [];
    for (let i = 0; i < rows - 1; i++) {
      transomYArr.push(innerBottom + rowH * (i + 1) + C.transomHeight * i + C.transomHeight / 2);
    }

    const mullionYArray = [innerBottom + (rowH / 2) + C.mullionOffsetBottomY];
    const offsetY = usesFixedPanelOffset ? C.fixedPanelBottomOffset : C.windowOffsetBottomY
    const windowYArray = [innerBottom + offsetY];
    if (rows > 1) {

      for (let i = 1; i < rows; i++) {

        const yMullion = mullionYArray[i - 1] + rowH / 2 + C.transomHeight;
        mullionYArray.push(yMullion);

        const y = windowYArray[i - 1] + rowH + C.transomHeight;
        windowYArray.push(y);
      }
    }

    return { innerW, innerH, innerLeft, innerBottom, innerHeight, colW, rowH, topRowH, mullionGap, mullionXArr, transomYArr, mullionYArray, windowYArray }
  }


  // ── Section slots ─────────────────────────────────────────────────────────
  // cy = Y of the slot's bottom edge (panel pivot is now at bottom-left per model fix).
  const slots = {};
  let uniData;
  _config.sections.forEach(sectionDef => {
    const { index, row, col, colSpan = 1, openingType } = sectionDef;

    uniData = calcUniversalData(openingType === 'fixed')

    const slotW = uniData.colW * colSpan + uniData.mullionGap * (colSpan - 1);

    const slotLeft = uniData.innerLeft + col * (uniData.colW + uniData.mullionGap);
    const cx = slotLeft + slotW / 2;

    const windowY = uniData.windowYArray[row];

    // Row indices run bottom-up, so the last one is the top of the window.
    const isTopRow = row === rows - 1;
    slots[index] = { cx, cy: windowY, w: slotW, h: isTopRow ? uniData.topRowH : uniData.rowH };
  });



  return {
    innerW: uniData.innerW, innerH: uniData.innerH, mullionX: uniData.mullionXArr, mullionY: uniData.mullionYArray, transomY: uniData.transomYArr, slots, rowH: uniData.rowH, topRowH: uniData.topRowH
  };
}


// Hinge position for a section.
// Turn and tilt-turn sections keep hinges on one side. Tilt-only sections place
// the hinge pair on the bottom-left and bottom-right corners.
function _getHingePlacement(sectionDef, slot, tag, hingeHeight) {
  if (_isTiltOnly(sectionDef.openingType)) {
    const isRightCorner = tag === 'up';
    const hingeEdgeOffset = C.tiltOnlyHingeEdgeOffset ?? C.hingeEdgeOffset;
    const positionX = isRightCorner
      ? slot.cx + slot.w / 2 - hingeEdgeOffset
      : slot.cx - slot.w / 2 + hingeEdgeOffset;
    const positionY = _getTiltOnlyHingeBaselineY(slot);

    return {
      positionX,
      positionY,
      scaleX: isRightCorner ? -1 : 1,
      rotationZ: isRightCorner ? -Math.PI / 2 : Math.PI / 2,
      alignToBounds: true,
      alignX: isRightCorner ? 'max' : 'min',
      targetX: positionX,
      alignY: 'min',
      targetY: positionY,
    };
  }

  const isRight = sectionDef.openingType === 'turn_right' || sectionDef.openingType === 'tilt_turn_right';
  const positionX = isRight
    ? slot.cx + slot.w / 2 + C.hingeEdgeOffset
    : slot.cx - slot.w / 2 - C.hingeEdgeOffset;

  const positionY = tag === 'up'
    ? slot.cy + slot.h - hingeHeight * 0.9 + C.hingeYOffset
    : slot.cy + C.hingeEdgeOffset;

  return {
    positionX,
    positionY,
    scaleX: isRight ? -1 : 1,
    rotationZ: 0,
  };
}

function _placeHingePair(frame, move, placement) {
  const hingeObjects = [frame, move].filter(Boolean);

  hingeObjects.forEach(hingeObject => {
    hingeObject.position.set(placement.positionX, placement.positionY, hingeObject.position.z);
    hingeObject.scale.x = placement.scaleX;
    hingeObject.rotation.z = placement.rotationZ;
  });

  if (!placement.alignToBounds || !frame) return;

  frame.updateWorldMatrix(true, true);
  const frameBounds = new THREE.Box3().setFromObject(frame);
  if (frameBounds.isEmpty()) return;

  const currentX = placement.alignX === 'max' ? frameBounds.max.x : frameBounds.min.x;
  const currentY = placement.alignY === 'max' ? frameBounds.max.y : frameBounds.min.y;
  const deltaX = placement.targetX - currentX;
  const deltaY = placement.targetY - currentY;

  hingeObjects.forEach(hingeObject => {
    hingeObject.position.x += deltaX;
    hingeObject.position.y += deltaY;
  });
}

function _isTiltOnly(openingType) {
  return openingType === 'tilt';
}

function _canTilt(openingType) {
  return openingType === 'tilt' || openingType === 'tilt_turn_left' || openingType === 'tilt_turn_right';
}

function _getSectionTiltAngle(openingType) {
  return _isTiltOnly(openingType)
    ? (C.tiltOnlyAngle ?? C.tiltAngle)
    : C.tiltAngle;
}

function _getLongestBoxSide(box) {
  if (!box || box.isEmpty()) return 0;

  const size = new THREE.Vector3();
  box.getSize(size);

  return Math.max(size.x, size.y, size.z);
}

function _getTiltOnlyHingeBaselineY(slot) {
  return slot.cy - C.hingeEdgeOffset * 2;
}

// ── Morph value helpers ───────────────────────────────────────────────────────
// Convert a real meter dimension to a 0-1 morph value using the frame ranges.
// Sash/panel min/max are derived from frame min/max minus the edge thickness.

function _toMorphW(meters) {
  const min = C.frameMinWidth - C.frameEdgeWidth * 2;
  const max = C.frameMaxWidth - C.frameEdgeWidth * 2;
  return _inverseLerp(meters, min, max);
}

function _inverseLerp(value, min, max) {
  if (max === min) return 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function _cacheOriginals(model) {
  model.traverse(node => {
    if (!node.name) return;
    const excluded = EXCLUDED_NAMES.some(p =>
      p instanceof RegExp ? p.test(node.name) : node.name === p
    );
    if (excluded) return;
    if (node.isGroup || node.isMesh) _originals[node.name] = node;
  });
}

function _cloneTemplate(key) {
  const tpl = _originals[key];
  if (!tpl) {
    console.warn(`[WindowController] Template not found: "${key}"`);
    return null;
  }
  return _cloneOf(tpl);
}

function _cloneOf(tpl) {
  const clone = tpl.clone(true);
  clone.visible = true;
  clone.traverse(child => { child.visible = true; });
  tpl.parent.add(clone);
  return clone;
}

function _easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function _updateCameraTarget() {
  if (!controls || !camera) return;
  const { productCategory, frameHeightRaw } = _config;
  if (productCategory === 'windows') {
    controls.target.y = frameHeightRaw / 2;
  } else {
    controls.target.y = 1.0; // match CONTROL_TARGET_POSITION_Y in settings
  }
  controls.update();
  requestRender();
}
