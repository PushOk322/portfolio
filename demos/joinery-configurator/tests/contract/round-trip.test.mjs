import assert from 'node:assert/strict';
import test from 'node:test';

import { validate } from '../../js/integration/validate.js';
import { toState } from '../../js/integration/to-state.js';
import { fromState } from '../../js/integration/from-state.js';
import { CATALOGUE, payloadFor } from './catalogue.mjs';

const roundTrip = normalized => fromState(toState(normalized, 'window'));

test('every catalogue layout survives payload → state → payload unchanged', () => {
  for (const entry of CATALOGUE) {
    const { ok, normalized } = validate(payloadFor(entry), 'window');
    if (!ok) continue; // round is rejected before it ever reaches state

    assert.deepEqual(roundTrip(normalized), normalized, `${entry.name} did not round-trip`);
  }
});

test('a door round-trips across both colour modes', () => {
  const base = {
    schemaVersion: '1.0', locale: 'nl',
    dimensions: { widthMm: 1000, heightMm: 2100 },
    profile: { material: 'alum', series: '70', offset: 'met' },
    presentation: { view: 'outside' },
    options: {
      designType: '2a', glassType: 'blur', hasWindowFrame: false, openSide: 'right',
      handleInside: 2, handleOutside: 3, handleColor: 'hc_black', hingeType: 2,
      hasPost: true, hasVent: false,
    },
  };

  for (const colors of [
    { mode: 'split', exteriorHex: '#383E42', interiorHex: '#FFFFFF' },
    { mode: 'uniform', uniformHex: '#383E42' },
  ]) {
    const { ok, normalized } = validate({ ...base, colors }, 'door');
    assert.equal(ok, true);
    assert.deepEqual(
      fromState(toState(normalized, 'door')), normalized, `${colors.mode} did not round-trip`,
    );
  }
});

// The reason state carries colorMode at all: without it, split and uniform are
// indistinguishable once the two hexes happen to be equal.
test('split colours that happen to match still round-trip as split', () => {
  const { normalized } = validate({
    schemaVersion: '1.0', locale: 'en',
    dimensions: { widthMm: 1000, heightMm: 2100 },
    profile: { material: 'alum', series: '70', offset: 'zonder' },
    colors: { mode: 'split', exteriorHex: '#AABBCC', interiorHex: '#AABBCC' },
    presentation: { view: 'inside' },
    options: {},
  }, 'door');

  assert.equal(fromState(toState(normalized, 'door')).colors.mode, 'split');
});

// Joinery sends two colours on every order and no discriminator, so an absent
// `mode` has to mean split rather than fail as a missing field.
test('omitting colors.mode reads as split', () => {
  const { ok, errors, normalized } = validate({
    schemaVersion: '1.0', locale: 'en',
    dimensions: { widthMm: 1000, heightMm: 2100 },
    profile: { material: 'alum', series: '70', offset: 'zonder' },
    colors: { exteriorHex: '#383E42', interiorHex: '#FFFFFF' },
    presentation: { view: 'inside' },
    options: {},
  }, 'door');

  assert.equal(ok, true, JSON.stringify(errors));
  assert.equal(normalized.colors.mode, 'split');
  assert.equal(normalized.colors.exteriorHex, '#383E42');
  assert.equal(normalized.colors.interiorHex, '#FFFFFF');
});

// The single-colour form predates the two-colour contract; payloads still using
// it must not start erroring for a missing exteriorHex.
test('omitting colors.mode with only uniformHex still reads as uniform', () => {
  const { ok, normalized } = validate({
    schemaVersion: '1.0', locale: 'en',
    dimensions: { widthMm: 1000, heightMm: 2100 },
    profile: { material: 'pvc', series: '70', offset: 'zonder' },
    colors: { uniformHex: '#F1F0EB' },
    presentation: { view: 'inside' },
    options: {},
  }, 'door');

  assert.equal(ok, true);
  assert.equal(normalized.colors.mode, 'uniform');
  assert.equal(normalized.colors.uniformHex, '#F1F0EB');
});

test('the contract numbers rows from the top, the engine from the bottom', () => {
  const { normalized } = validate(payloadFor({
    columns: 2, rows: 2, transom: true, mullionless: false, shape: 'rect',
    openings: ['fixed', 'tilt_turn_right', 'tilt_turn_left'],
  }), 'window');

  const state = toState(normalized, 'window');

  // Payload row 0 is the transom; in state it must be the highest row index.
  const transom = state.sections.find(s => s.colSpan === 2);
  assert.equal(normalized.options.layout.sections[0].row, 0, 'transom is payload row 0');
  assert.equal(transom.row, 1, 'transom is the top engine row');
  assert.equal(transom.openingType, 'fixed');

  // And it comes back the way it went in.
  assert.deepEqual(fromState(state), normalized);
});

test('sections come back in the contract reading order regardless of input order', () => {
  const scrambled = payloadFor({
    columns: 2, rows: 2, transom: true, mullionless: false, shape: 'rect',
    openings: ['fixed', 'tilt', 'tilt'],
  });

  scrambled.options.layout.sections = [
    { row: 1, col: 1, colSpan: 1, opening: 'tilt' },
    { row: 0, col: 0, colSpan: 2, opening: 'fixed' },
    { row: 1, col: 0, colSpan: 1, opening: 'tilt' },
  ];

  const { ok, normalized } = validate(scrambled, 'window');
  assert.equal(ok, true, 'order is not a validity concern — the grid still tiles');

  const out = fromState(toState(normalized, 'window')).options.layout.sections;
  assert.deepEqual(
    out.map(s => `${s.row},${s.col}`),
    ['0,0', '1,0', '1,1'],
    'top→bottom, then left→right',
  );
});
