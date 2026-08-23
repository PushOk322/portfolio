import assert from 'node:assert/strict';
import test from 'node:test';

import { getConstants } from '../js/product-constants.js';

// These offsets are tuned against the GLB on every model iteration, so asserting
// literal values only produces false failures. What matters is that every
// material/model combination actually defines them: getConstants() returns
// undefined for a missing key, which reaches the controller as a NaN transform
// and silently drops the hinge somewhere off-model.

const DOOR_PROFILES = [['alum', '70'], ['pvc', '70'], ['pvc', '120']];
const HINGED_CATEGORIES = ['doors', 'backDoors'];

const HINGE_KEYS = [
  'hingeBottomOffset',
  'hingeTopOffset',
  'hingeFrameOffset',
  'hingeFrame2Offset',
  'hingePinZ',
  'hingePin2Z',
];

test('every door profile defines a finite value for all hinge placement keys', () => {
  for (const category of HINGED_CATEGORIES) {
    for (const [material, model] of DOOR_PROFILES) {
      const constants = getConstants(category, material, model);

      for (const key of HINGE_KEYS) {
        assert.equal(
          Number.isFinite(constants[key]), true,
          `${category}/${material}/${model} is missing a numeric ${key} (got ${constants[key]})`,
        );
      }
    }
  }
});

test('hinge inset from the frame is positive on every door profile', () => {
  for (const category of HINGED_CATEGORIES) {
    for (const [material, model] of DOOR_PROFILES) {
      const constants = getConstants(category, material, model);

      // A non-positive inset would place the hinge outside the door leaf.
      assert.equal(
        constants.hingeFrameOffset > 0 && constants.hingeFrame2Offset > 0, true,
        `${category}/${material}/${model} has a non-positive hinge frame offset`,
      );
    }
  }
});

// The bovenlicht sits on top of the door frame and its height is fixed per
// material, so it cannot be one number in the contract prose.
test('every back-door profile defines a positive transom extra height', () => {
  for (const [material, model] of DOOR_PROFILES) {
    const constants = getConstants('backDoors', material, model);

    assert.equal(
      constants.transomExtraHeight > 0, true,
      `backDoors/${material}/${model} has no positive transomExtraHeight`,
    );
  }
});

// getConstants warns and falls back on an unknown category, which would render
// a back door against front-door morph calibration.
test('back doors resolve to their own block, not a fallback', () => {
  const back = getConstants('backDoors', 'alum', '70');
  const front = getConstants('doors', 'alum', '70');

  assert.notEqual(back, front);
  assert.equal(back.frameMaxWidth, 1.3, 'back doors morph 100mm wider than front doors');
});
