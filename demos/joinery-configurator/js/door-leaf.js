'use strict';

import * as THREE from 'three';
import { requestRender } from './3d-scene.js';
import { COLOR_SOURCE_BY_MATERIAL } from './door-designs.js';

// Scene furniture rather than product parts.
const EXCLUDED_NAMES = [
  /^Cube(_?\d+)?$/,
  /^Plane(_?\d+)?$/,
  /^Cylinder(_?\d+)?$/,
  /^BezierCurve(_?\d+)?$/,
  'Plane',
  'Scene_Root',
  'Default_Light',
];

/**
 * The machinery a hinged door leaf needs, independent of which catalogue it
 * came from. The caller keeps its own visibility rules, morph names and state
 * subscription, and hands us a spec describing what its category calls things.
 *
 * @param {object} spec
 * @param {() => object} spec.getConfig     current state
 * @param {() => object} spec.getConstants  the active product-constants block
 * @param {() => object} spec.keys          {leaf, hingeBody, hingeMove, handleOutside, handleInside}
 * @param {() => Array}  spec.leafObjects   extra nodes that swing with the leaf
 */
export function createDoorLeaf(spec) {
  let _model = null;
  const _originals = {};

  const _clones = new Set();
  let _hinges = [];
  let _handles = { outside: null, inside: null };
  let _cachedZ = null;
  let _pivotGroup = null;

  const _anim = {
    progress: 0,
    target: 0,
    startProgress: 0,
    startTime: 0,
    rafId: null,
  };

  const HANDLE_SCALE_EPSILON = 0.000001;

  function attach(model) {
    _model = model;
    Object.keys(_originals).forEach(k => delete _originals[k]);
    _resetHardware();
    _cacheOriginals(model);
  }

  function _resetHardware() {
    if (_anim.rafId) cancelAnimationFrame(_anim.rafId);
    _anim.rafId = null;
    // The leaf is rebuilt closed, so the swing state must not survive it.
    _anim.progress = 0;
    _anim.target = 0;

    if (_pivotGroup) _dissolvePivotGroup();

    _clones.forEach(clone => clone.parent?.remove(clone));
    _clones.clear();
    _hinges = [];
    _handles = { outside: null, inside: null };
    invalidateZCache();
  }

  function _cacheOriginals(model) {
    model.traverse(node => {
      if (!node.name) return;

      const isExcluded = EXCLUDED_NAMES.some(pattern =>
        pattern instanceof RegExp ? pattern.test(node.name) : node.name === pattern);

      if (isExcluded) return;

      if (node.isGroup || node.isMesh) _originals[node.name] = node;
    });
  }

  function hideAll() {
    Object.values(_originals).forEach(obj => {
      if (obj.name === 'Scene') return;
      obj.visible = false;
    });
  }

  function show(name, visible) {
    const obj = _originals[name];
    // A missing node used to no-op in silence, which is how doors shipped with
    // no frame at all when a `_met` variant was asked for and never existed.
    // Hiding something absent is fine; showing it is a gap in the GLB.
    if (!obj) {
      if (visible) console.warn(`DOOR_DEBUG show: no node named "${name}" in the model`);
      return;
    }

    let ancestor = obj.parent;
    while (ancestor) {
      if (!ancestor.visible) {
        console.warn(`[show] "${name}" has hidden ancestor: "${ancestor.name}"`);
      }
      ancestor = ancestor.parent;
    }

    obj.visible = visible;
    if (visible) obj.traverse(child => { child.visible = true; });
  }

  function hideMatching(predicate) {
    Object.keys(_originals).forEach(name => {
      if (predicate(name)) _originals[name].visible = false;
    });
  }

  function applyColors() {
    if (!_model) return;
    const { colorExterior, colorInterior, colorPVC } = spec.getConfig();

    const colors = {
      exterior: colorExterior,
      interior: colorInterior,
      pvc: colorPVC,
    };

    _model.traverse(obj => {
      if (!obj.isMesh) return;

      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];

      materials.forEach((mat, i) => {
        if (!mat) return;

        const targetColor = colors[COLOR_SOURCE_BY_MATERIAL[mat.name]] ?? null;
        if (!targetColor) return;

        if (!mat.userData.materialCloned) {
          const cloned = mat.clone();
          cloned.userData.materialCloned = true;
          cloned.color.set(targetColor);
          if (Array.isArray(obj.material)) obj.material[i] = cloned;
          else obj.material = cloned;
        } else {
          const liveMat = Array.isArray(obj.material) ? obj.material[i] : obj.material;
          liveMat.color.set(targetColor);
        }
      });
    });
  }

  function detach() {
    _resetHardware();
    hideAll();
    _model = null;
    requestRender();
  }

  function invalidateZCache() { _cachedZ = null; }

  // Read once, with the pivot un-rotated, so the box is axis-aligned.
  function zBounds() {
    if (_cachedZ) return _cachedZ;

    const doorObj = _originals[spec.keys().leaf];
    if (!doorObj) return null;

    const savedRotation = _pivotGroup?.rotation.y ?? 0;
    if (_pivotGroup) _pivotGroup.rotation.y = 0;

    const box = new THREE.Box3().setFromObject(doorObj);
    _cachedZ = { front: box.max.z, back: box.min.z, depth: box.max.z - box.min.z };

    if (_pivotGroup) _pivotGroup.rotation.y = savedRotation;

    return _cachedZ;
  }

  function buildHardware() {
    _createHinges();
    _createHandles();
  }

  function _createHinges() {
    _hinges.forEach(({ body, move }) => {
      body?.parent?.remove(body);
      move?.parent?.remove(move);
    });
    _hinges = [];

    const C = spec.getConstants();
    const { hingeBody: bodyKey, hingeMove: moveKey } = spec.keys();

    const bodyTpl = _originals[bodyKey];
    const moveTpl = _originals[moveKey];

    if (!bodyTpl) {
      console.warn(`[DoorLeaf] Hinge body template not found: "${bodyKey}"`);
      return;
    }

    for (let hingeIndex = 0; hingeIndex < C.hingeCount; hingeIndex++) {
      const body = bodyTpl.clone(true);
      body.name = `__hinge_body_${hingeIndex}`;
      body.visible = true;
      body.traverse(child => { child.visible = true; });
      _clones.add(body);
      bodyTpl.parent.add(body);

      let move = null;
      if (moveTpl) {
        move = moveTpl.clone(true);
        move.name = `__hinge_move_${hingeIndex}`;
        move.visible = true;
        move.traverse(child => { child.visible = true; });
        _clones.add(move);
        moveTpl.parent.add(move);
      }

      _hinges.push({ body, move });
    }

    placeHinges();
  }

  function placeHinges() {
    if (_hinges.length === 0) return;

    const C = spec.getConstants();
    const { frameWidthRaw, frameHeightRaw, openSide, hingeType } = spec.getConfig();
    const scaleX = openSide === 'right' ? -1 : 1;
    const frameOffset = hingeType === 1 ? C.hingeFrameOffset : C.hingeFrame2Offset;
    const x = scaleX * (-frameWidthRaw / 2 + frameOffset);
    const yPositions = _getHingeYPositions(frameHeightRaw, _hinges.length);

    _hinges.forEach(({ body, move }, hingeIndex) => {
      const y = yPositions[hingeIndex];

      body.position.x = x;
      body.position.y = y;
      body.scale.x = scaleX;

      // While the pivot group owns the moving halves, their transform is the
      // group's business — writing to it here drags them out of the swing.
      if (move && !_pivotGroup) {
        move.position.x = x;
        move.position.y = y;
        move.scale.x = scaleX;
      }
    });
  }

  function _getHingeYPositions(frameHeightRaw, hingeCount) {
    const C = spec.getConstants();
    if (hingeCount === 1) return [frameHeightRaw / 2];

    const bottomY = C.hingeBottomOffset;
    const topY = frameHeightRaw - C.hingeTopOffset;

    if (spec.getConfig().profileMaterial === 'alum' && hingeCount === 3) {
      return [bottomY, topY - C.hingeMiddleFromTopOffset, topY];
    }

    const interval = (topY - bottomY) / (hingeCount - 1);

    return Array.from({ length: hingeCount }, (_, i) => bottomY + interval * i);
  }

  function _createHandles() {
    _handles.outside?.parent?.remove(_handles.outside);
    _handles.inside?.parent?.remove(_handles.inside);
    _handles = { outside: null, inside: null };

    const { handleOutside: outsideKey, handleInside: insideKey } = spec.keys();

    // A null key is a deliberate 'none'; a key that does not resolve is a
    // model gap worth hearing about. Only the second one warns.
    const outsideTpl = outsideKey ? _originals[outsideKey] : null;
    const insideTpl = insideKey ? _originals[insideKey] : null;

    if (outsideKey && !outsideTpl) console.warn(`[DoorLeaf] Handle template not found: "${outsideKey}"`);
    if (insideKey && !insideTpl) console.warn(`[DoorLeaf] Handle template not found: "${insideKey}"`);

    if (outsideTpl) {
      const clone = outsideTpl.clone(true);
      clone.traverse(child => { child.visible = true; });
      clone.name = '__handle_outside';
      clone.visible = true;
      _clones.add(clone);
      outsideTpl.parent.add(clone);
      _handles.outside = clone;
    }

    if (insideTpl) {
      const clone = insideTpl.clone(true);
      clone.traverse(child => { child.visible = true; });
      clone.name = '__handle_inside';
      clone.visible = true;
      _clones.add(clone);
      insideTpl.parent.add(clone);
      _handles.inside = clone;
    }

    placeHandles();
  }

  function placeHandles() {
    const { outside, inside } = _handles;
    if (!outside && !inside) return;

    const C = spec.getConstants();
    const { view, openSide, frameWidthRaw, handleOutside } = spec.getConfig();
    const scaleX = openSide === 'right' ? -1 : 1;
    const isInside = view === 'inside';
    const doorZ = zBounds();
    if (!doorZ) return;

    if (outside) {
      const hBox = new THREE.Box3().setFromObject(outside);
      const handleDepth = (hBox.max.z - hBox.min.z) / 10;

      const modelXOffset = C.handleOutsideModelXOffsets?.[handleOutside] ?? 0;
      const outsideHandleXOffset = C.handleOutsideXOffset + modelXOffset;

      outside.scale.set(scaleX, 1, isInside ? -1 : 1);
      outside.rotation.set(0, 0, 0);
      outside.position.x = scaleX * (frameWidthRaw / 2 - C.doorFrameWidth / 2 + outsideHandleXOffset);
      outside.position.z = isInside
        ? doorZ.back + handleDepth + C.handleOutsideZOffset
        : doorZ.front - handleDepth + C.handleOutsideZOffset;
      _setScaleXKeepingWorldCenter(outside, -scaleX);
    }

    if (inside) {
      const hBox = new THREE.Box3().setFromObject(inside);
      const handleDepth = (hBox.max.z - hBox.min.z) / 10;

      inside.scale.set(scaleX, 1, isInside ? 1 : -1);
      inside.rotation.set(0, 0, 0);
      inside.position.x = scaleX * (frameWidthRaw / 2 - C.doorFrameWidth / 2 + C.handleInsideXOffset);
      inside.position.z = isInside
        ? doorZ.front - handleDepth + C.handleInsideZOffset
        : doorZ.back + handleDepth + C.handleInsideZOffset;
    }
  }

  function _setScaleXKeepingWorldCenter(obj, targetScaleX) {
    if (Math.abs(obj.scale.x - targetScaleX) <= HANDLE_SCALE_EPSILON) return;
    if (!obj.parent) return;

    _model.updateWorldMatrix(true, true);

    const centerBefore = new THREE.Vector3();
    new THREE.Box3().setFromObject(obj).getCenter(centerBefore);

    obj.scale.x = targetScaleX;
    obj.updateWorldMatrix(true, true);

    const centerAfter = new THREE.Vector3();
    new THREE.Box3().setFromObject(obj).getCenter(centerAfter);

    obj.position.x += centerBefore.x - centerAfter.x;
    obj.updateWorldMatrix(true, true);
  }

  // Nothing mirrors the leaf itself for a right-hung door: the hinges, the
  // handles and the swing direction each apply their own scaleX, and the leaves
  // are symmetric. A blanket scale.x = -1 over the `_door` nodes cannot do it —
  // the leaf and frame sit at a non-zero local origin, so mirroring about it
  // translates them off-centre instead of flipping them in place.
  function placeItems() {
    placeHinges();
    if (!_pivotGroup) placeHandles();
  }

  // Rebuilt on every call: handles and hinges are re-cloned whenever state
  // changes, so a cached list would hold nodes no longer in the scene.
  function _getLeafObjects() {
    return [
      _originals[spec.keys().leaf],
      ...spec.leafObjects(),
      _handles.outside,
      _handles.inside,
      ..._hinges.map(h => h.move).filter(Boolean),
    ].filter(Boolean);
  }

  function _getPivotPoint() {
    const C = spec.getConstants();
    const config = spec.getConfig();
    const hingeMove = _hinges[0]?.move;

    if (hingeMove) {
      // The leaf swings around the hinge pin, which on some models sits a few
      // mm behind the move part's origin — rotating around the origin drags the
      // wrap-around leaf straight through the rod.
      const pinZ = (config.hingeType === 1 ? C.hingePinZ : C.hingePin2Z) ?? 0;

      // localToWorld keeps the openSide mirroring (scale.x = -1) intact.
      const wp = hingeMove.localToWorld(new THREE.Vector3(0, 0, pinZ));

      return new THREE.Vector3(wp.x, 0, wp.z);
    }

    const hingeBody = _hinges[0]?.body;
    if (hingeBody) {
      const box = new THREE.Box3().setFromObject(hingeBody);
      const center = new THREE.Vector3();
      box.getCenter(center);
      console.warn('[PivotDebug] Fallback: using hinge body bbox center');
      return new THREE.Vector3(center.x, 0, center.z);
    }

    const sign = config.openSide === 'right' ? 1 : -1;
    const doorZ = zBounds();
    console.warn('[PivotDebug] Fallback: deriving pivot from frameWidthRaw');
    return new THREE.Vector3(
      sign * (config.frameWidthRaw / 2 - C.doorFrameWidth),
      0,
      doorZ ? (doorZ.front + doorZ.back) / 2 : 0,
    );
  }

  function _buildPivotGroup() {
    _dissolvePivotGroup();

    _pivotGroup = new THREE.Group();
    _pivotGroup.name = '__door_pivot';

    _model.updateWorldMatrix(true, true);

    _pivotGroup.position.copy(_getPivotPoint());
    _model.add(_pivotGroup);

    // attach() recomputes each object's local matrix so its world position
    // stays put — but only if world matrices are up to date.
    _getLeafObjects().forEach(obj => {
      obj.updateWorldMatrix(true, false);
      _pivotGroup.attach(obj);
    });
  }

  function _dissolvePivotGroup() {
    if (!_pivotGroup) return;

    // Snap back to zero BEFORE reparenting, so world positions are clean.
    _pivotGroup.rotation.y = 0;
    _pivotGroup.updateWorldMatrix(true, true);

    while (_pivotGroup.children.length) {
      const child = _pivotGroup.children[0];
      child.updateWorldMatrix(true, false);
      _model.attach(child);
    }

    _pivotGroup.parent?.remove(_pivotGroup);
    _pivotGroup = null;
  }

  function _applyDoorAngle(progress) {
    if (!_pivotGroup) return;

    const config = spec.getConfig();
    const sign = (config.openSide === 'right' ? 1 : -1)
      * (config.view === 'inside' ? 1 : -1);

    _pivotGroup.rotation.y = sign * spec.getConstants().turnAngle * progress;
  }

  function _easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  function _animTick(now) {
    const elapsed = now - _anim.startTime;
    const raw = Math.min(elapsed / spec.getConstants().animDuration, 1);

    _anim.progress = _anim.startProgress
      + (_anim.target - _anim.startProgress) * _easeInOut(raw);

    _applyDoorAngle(_anim.progress);
    requestRender();

    if (raw < 1) {
      _anim.rafId = requestAnimationFrame(_animTick);
      return;
    }

    _anim.rafId = null;

    if (_anim.target === 0) {
      _dissolvePivotGroup();
      buildHardware();
      placeItems();
      requestRender();
    }
  }

  function _startAnim(target) {
    if (_anim.target === target) return;       // already heading there — no-op
    if (_anim.rafId) cancelAnimationFrame(_anim.rafId);

    _anim.startTime = performance.now();
    _anim.startProgress = _anim.progress;
    _anim.target = target;
    _anim.rafId = requestAnimationFrame(_animTick);
  }

  function open() {
    _buildPivotGroup();
    _startAnim(1);
  }

  function close() { _startAnim(0); }
  function toggle() { _anim.target === 0 ? open() : close(); }

  // The leaf changed shape while it was open — rebuild it and put it back at
  // the angle it was already at, rather than snapping shut.
  function rebuildPivotAtCurrentAngle() {
    _dissolvePivotGroup();
    buildHardware();
    placeItems();
    _buildPivotGroup();
    _applyDoorAngle(_anim.progress);
  }

  return {
    attach, detach, hideAll,
    show, hideMatching,
    applyColors,
    buildHardware, placeItems, placeHinges, placeHandles,
    zBounds, invalidateZCache,
    hinges: () => _hinges,
    handles: () => _handles,
    open, close, toggle,
    progress: () => _anim.progress,
    hasPivot: () => _pivotGroup !== null,
    rebuildPivotAtCurrentAngle,
    originals: _originals,
    model: () => _model,
  };
}
