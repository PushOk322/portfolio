import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  STAIRS_SCHEMA,
  DIRECTIONS,
  DIRECTION_DEFAULT,
  getDefaultState,
  createDirections,
  clampValue,
  normalizeState,
} from '../js/core/stairs-state.js';

test('defaults match the spec', () => {
  assert.deepEqual(getDefaultState(), {
    totalHeight: 3.0,
    stepHeight: 0.18,
    stepGoing: 0.34,
    stepLength: 0.34,
    stepWidth: 1.0,
    flightCount: 2,
    directions: ['N'],
  });
});

test('stepGoing defaults equal to the tread length, so a fresh stair does not overlap', () => {
  const state = getDefaultState();
  assert.equal(state.stepGoing, state.stepLength);
});

test('stepGoing can drop below the tread depth to allow overlap', () => {
  assert.equal(clampValue('stepGoing', 0.10), 0.10);
  assert.ok(STAIRS_SCHEMA.stepGoing.min < STAIRS_SCHEMA.stepLength.min);
});

test('every schema entry has a default inside its own range', () => {
  for (const [key, def] of Object.entries(STAIRS_SCHEMA)) {
    assert.ok(def.default >= def.min, `${key} default below min`);
    assert.ok(def.default <= def.max, `${key} default above max`);
  }
});

test('clampValue clamps to the range', () => {
  assert.equal(clampValue('totalHeight', 99), 6.0);
  assert.equal(clampValue('totalHeight', 0), 2.0);
  assert.equal(clampValue('totalHeight', 3.5), 3.5);
});

test('clampValue rounds integer-only keys', () => {
  assert.equal(clampValue('flightCount', 2.6), 3);
  assert.equal(clampValue('flightCount', 99), 4);
  assert.equal(clampValue('flightCount', -5), 1);
});

test('clampValue falls back to the default on non-numeric input', () => {
  assert.equal(clampValue('totalHeight', 'abc'), 3.0);
  assert.equal(clampValue('totalHeight', NaN), 3.0);
  assert.equal(clampValue('totalHeight', null), 3.0);
});

test('clampValue falls back to the default for booleans', () => {
  assert.equal(clampValue('totalHeight', true), 3.0);
  assert.equal(clampValue('totalHeight', false), 3.0);
});

test('clampValue passes through unknown keys untouched', () => {
  assert.equal(clampValue('nonsense', 42), 42);
});

test('the compass set is exactly the four directions, defaulting to north', () => {
  assert.deepEqual([...DIRECTIONS], ['N', 'E', 'S', 'W']);
  assert.equal(DIRECTION_DEFAULT, 'N');
});

test('createDirections yields one slot per landing, all north', () => {
  assert.deepEqual(createDirections(1), []);
  assert.deepEqual(createDirections(2), [DIRECTION_DEFAULT]);
  assert.deepEqual(createDirections(4), ['N', 'N', 'N']);
});

test('normalizeState resizes directions to track flightCount', () => {
  const state = normalizeState({ ...getDefaultState(), flightCount: 4 });
  assert.deepEqual(state.directions, ['N', 'N', 'N']);
});

test('normalizeState gives a single flight an empty directions array', () => {
  const state = normalizeState({ ...getDefaultState(), flightCount: 1 });
  assert.deepEqual(state.directions, []);
});

test('normalizeState keeps a valid directions array untouched', () => {
  const state = normalizeState({ ...getDefaultState(), flightCount: 3, directions: ['E', 'S'] });
  assert.deepEqual(state.directions, ['E', 'S']);
});

test('normalizeState rebuilds directions holding a value outside the compass set', () => {
  const state = normalizeState({ ...getDefaultState(), flightCount: 3, directions: ['E', 'Q'] });
  assert.deepEqual(state.directions, ['N', 'N']);
});

test('normalizeState rebuilds a directions array of the wrong length', () => {
  const state = normalizeState({ ...getDefaultState(), flightCount: 3, directions: ['E'] });
  assert.deepEqual(state.directions, ['N', 'N']);
});

test('normalizeState clamps every schema key', () => {
  const state = normalizeState({ ...getDefaultState(), totalHeight: 99, stepWidth: 0 });
  assert.equal(state.totalHeight, 6.0);
  assert.equal(state.stepWidth, 0.8);
});
