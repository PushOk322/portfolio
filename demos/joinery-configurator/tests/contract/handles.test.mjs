import assert from 'node:assert/strict';
import test from 'node:test';

import { validate } from '../../js/integration/validate.js';
import { toState } from '../../js/integration/to-state.js';
import { ERROR_CODES as E } from '../../js/integration/codes.js';

const door = (options = {}) => ({
  schemaVersion: '1.0',
  locale: 'en',
  dimensions: { widthMm: 1000, heightMm: 2100 },
  profile: { material: 'alum', series: '70', offset: 'zonder' },
  colors: { mode: 'split', exteriorHex: '#383E42', interiorHex: '#FFFFFF' },
  presentation: { view: 'inside' },
  options: { designType: '1', ...options },
});

const backDoor = (options = {}) => ({
  schemaVersion: '1.0',
  locale: 'en',
  dimensions: { widthMm: 1000, heightMm: 2100 },
  profile: { material: 'alum', series: '70', offset: 'zonder' },
  colors: { mode: 'split', exteriorHex: '#383E42', interiorHex: '#FFFFFF' },
  presentation: { view: 'inside' },
  options: { designType: '1', ...options },
});

test("a door accepts 'none' on both faces", () => {
  const { ok, errors, normalized } = validate(
    door({ handleInside: 'none', handleOutside: 'none' }), 'door',
  );

  assert.equal(ok, true, JSON.stringify(errors));
  assert.equal(normalized.options.handleInside, 'none');
  assert.equal(normalized.options.handleOutside, 'none');
});

test("a door accepts 'none' on one face only", () => {
  const { ok, normalized } = validate(door({ handleOutside: 'none' }), 'door');

  assert.equal(ok, true);
  assert.equal(normalized.options.handleOutside, 'none');
  assert.equal(normalized.options.handleInside, 1, 'the other face keeps its default');
});

test("a back door accepts 'none'", () => {
  const { ok, normalized } = validate(
    backDoor({ handleInside: 'none', handleOutside: 'none' }), 'backDoor',
  );

  assert.equal(ok, true);
  assert.equal(normalized.options.handleOutside, 'none');
});

test("'none' reaches state unchanged", () => {
  const { normalized } = validate(door({ handleOutside: 'none' }), 'door');
  const state = toState(normalized, 'door');

  assert.equal(state.handleOutside, 'none');
});

test("a window handle cannot be 'none' — the opening type already says so", () => {
  const payload = {
    schemaVersion: '1.0',
    locale: 'en',
    dimensions: { widthMm: 1200, heightMm: 1400 },
    profile: { material: 'pvc', series: '70', offset: 'zonder' },
    colors: { mode: 'uniform', uniformHex: '#F1F0EB' },
    presentation: { view: 'inside' },
    options: {
      layout: { columns: 1, rows: 1, sections: [{ row: 0, col: 0, opening: 'fixed' }] },
      handleModel: 'none',
    },
  };

  const { ok, errors } = validate(payload, 'window');

  assert.equal(ok, false);
  assert.equal(errors.find(e => e.code === E.INVALID_ENUM).field, 'options.handleModel');
});
