import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  PIECE_MORPH_OVERREACH,
  PIECE_MORPH_RANGES,
  PIECE_SOURCE_NAMES,
  PIECE_TYPES,
} from '../js/core/piece-contract.js';
import { STAIRS_SCHEMA } from '../js/core/stairs-state.js';

test('piece types match the spec', () => {
  assert.deepEqual(PIECE_TYPES, ['step', 'landing', 'stringer', 'landingBar']);
});

test('a landing bar loads from the stringer object, because it is the same beam', () => {
  assert.deepEqual(PIECE_SOURCE_NAMES, { landingBar: 'stringer' });
});

test('every alias points at a real piece type, and never at another alias', () => {
  for (const [type, source] of Object.entries(PIECE_SOURCE_NAMES)) {
    assert.ok(PIECE_TYPES.includes(type), `${type} is not a piece type`);
    assert.ok(PIECE_TYPES.includes(source), `${type} loads from unknown source ${source}`);
    assert.ok(!PIECE_SOURCE_NAMES[source], `${type} chains through another alias`);
  }
});

test('a landing bar is scaled, not morphed — same as the stringer it comes from', () => {
  assert.deepEqual(PIECE_MORPH_RANGES.landingBar, {});
});

test('the step width range matches the state schema exactly', () => {
  assert.deepEqual(PIECE_MORPH_RANGES.step.width, [STAIRS_SCHEMA.stepWidth.min, STAIRS_SCHEMA.stepWidth.max]);
});

test('the step length range is the mesh, and the schema runs past it on purpose', () => {
  // The tread slider (stepLength) deliberately outruns what the tread reaches at influence
  // 1. `max` must stay the mesh value or the mapping lies.
  assert.deepEqual(PIECE_MORPH_RANGES.step.length, [STAIRS_SCHEMA.stepLength.min, 0.3339]);
  assert.ok(STAIRS_SCHEMA.stepLength.max > PIECE_MORPH_RANGES.step.length[1]);
});

test('landing length range matches stair width, because landing depth is derived from it', () => {
  assert.deepEqual(PIECE_MORPH_RANGES.landing.width, [STAIRS_SCHEMA.stepWidth.min, STAIRS_SCHEMA.stepWidth.max]);
  assert.deepEqual(PIECE_MORPH_RANGES.landing.length, [STAIRS_SCHEMA.stepWidth.min, STAIRS_SCHEMA.stepWidth.max]);
});

test('the stringer has no morph targets — it is scaled', () => {
  assert.deepEqual(PIECE_MORPH_RANGES.stringer, {});
});

test('only translational keys may extrapolate, and only past their own maximum', () => {
  // Every key here must move whole faces rigidly. `width` reshapes a slab across the
  // flight and must never appear — extrapolating it would stretch the piece, not lengthen
  // it. The tread's `length` was verified against the GLB as a two-position translation.
  assert.deepEqual(Object.keys(PIECE_MORPH_OVERREACH), ['step']);
  assert.deepEqual(Object.keys(PIECE_MORPH_OVERREACH.step), ['length']);

  assert.ok(PIECE_MORPH_OVERREACH.step.length > PIECE_MORPH_RANGES.step.length[1]);
});

test('the step overreach covers the whole steepness slider', () => {
  assert.equal(PIECE_MORPH_OVERREACH.step.length, STAIRS_SCHEMA.stepLength.max);
});

test('every piece type has a morph range entry', () => {
  for (const type of PIECE_TYPES) {
    assert.ok(PIECE_MORPH_RANGES[type] !== undefined, `${type} has no morph range entry`);
  }
});
